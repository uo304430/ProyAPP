from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.utils import calc_e1rm

router = APIRouter(tags=["analytics"])


@router.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    return {"e1rm_estimado": calc_e1rm(peso, reps, rpe)}


@router.get("/atleta/{athlete_id}/ejercicios-con-datos/")
def ejercicios_con_datos(athlete_id: int, db: Session = Depends(get_db)):
    """Return exercises the athlete has at least one completed set for, sorted by count."""
    rows = (
        db.query(models.Set, models.Exercise)
        .join(models.Exercise, models.Set.exercise_id == models.Exercise.id)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .filter(models.Block.athlete_id == athlete_id, models.Set.weight != None)
        .all()
    )

    seen: dict[int, dict] = {}
    for s, ex in rows:
        if ex.id not in seen:
            nombre = ex.name + (f" ({ex.variant})" if ex.variant else "")
            seen[ex.id] = {"exercise_id": ex.id, "name": nombre, "category": ex.category, "count": 0}
        seen[ex.id]["count"] += 1

    result = sorted(seen.values(), key=lambda x: -x["count"])
    return {"athlete_id": athlete_id, "ejercicios": result}


@router.get("/atleta/{athlete_id}/ejercicio/{exercise_id}/progreso/")
def progreso_ejercicio(athlete_id: int, exercise_id: int, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == athlete_id).first():
        raise HTTPException(status_code=404, detail="Atleta no encontrado")

    series = (
        db.query(models.Set)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .filter(models.Block.athlete_id == athlete_id, models.Set.exercise_id == exercise_id)
        .filter(models.Set.weight != None)
        .order_by(models.Set.logged_at)
        .all()
    )

    sessions: dict[str, list] = defaultdict(list)
    for s in series:
        if s.weight and s.reps and s.rpe:
            key = (s.logged_at or "")[:10] or "unknown"
            sessions[key].append(calc_e1rm(s.weight, s.reps, s.rpe))

    history = [
        {"date": k, "e1rm": round(max(v), 1)}
        for k, v in sorted(sessions.items())
        if k != "unknown"
    ]
    all_vals = [e for v in sessions.values() for e in v]
    best = round(max(all_vals), 1) if all_vals else None

    return {
        "atleta_id": athlete_id,
        "ejercicio_id": exercise_id,
        "historial": history,
        "best_e1rm": best,
        "total_sesiones": len(history),
    }


@router.get("/atleta/{athlete_id}/tonelaje-semanal/")
def tonelaje_semanal(athlete_id: int, db: Session = Depends(get_db)):
    from datetime import date, timedelta

    series = (
        db.query(models.Set)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .filter(models.Block.athlete_id == athlete_id, models.Set.weight != None)
        .all()
    )

    weeks: dict[str, float] = defaultdict(float)
    for s in series:
        if s.weight and s.reps and s.logged_at:
            d = date.fromisoformat(s.logged_at[:10])
            monday = (d - timedelta(days=d.weekday())).isoformat()
            weeks[monday] += s.weight * s.reps

    return {
        "atleta_id": athlete_id,
        "semanas": [
            {"week_start": k, "tonelaje": round(v, 1)}
            for k, v in sorted(weeks.items())
        ],
    }


@router.get("/atleta/{athlete_id}/ejercicio/{exercise_id}/historial-sesiones/")
def historial_sesiones(athlete_id: int, exercise_id: int, db: Session = Depends(get_db)):
    """Grouped session history: block + week + day, for the right-panel history view."""
    rows = (
        db.query(models.Set, models.PlannedWorkout, models.Day, models.Week, models.Block)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .filter(models.Block.athlete_id == athlete_id, models.Set.exercise_id == exercise_id)
        .filter(models.Set.weight != None)
        .order_by(models.Block.start_date.desc(), models.Week.week_number.desc(), models.Day.day_number)
        .all()
    )

    from collections import OrderedDict
    sessions: OrderedDict = OrderedDict()
    for s, pw, day, week, block in rows:
        key = (block.id, week.week_number, day.day_number)
        if key not in sessions:
            from datetime import date, timedelta
            session_date = None
            if block.start_date:
                offset = (week.week_number - 1) * 7 + (day.day_number - 1)
                session_date = (date.fromisoformat(block.start_date) + timedelta(days=offset)).isoformat()
            sessions[key] = {
                "block_id": block.id,
                "block_name": block.name,
                "week_number": week.week_number,
                "day_number": day.day_number,
                "date": session_date,
                "sets": [],
            }
        if s.weight and s.reps:
            sessions[key]["sets"].append(
                f"{s.weight}×{s.reps}" + (f" @{s.rpe}" if s.rpe else "")
            )

    return {
        "athlete_id": athlete_id,
        "exercise_id": exercise_id,
        "sessions": list(sessions.values()),
    }


@router.get("/atleta/{athlete_id}/cumplimiento/")
def cumplimiento(athlete_id: int, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == athlete_id).first():
        raise HTTPException(status_code=404, detail="Atleta no encontrado")

    resultados = (
        db.query(models.Set, models.PlannedWorkout)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .filter(models.Block.athlete_id == athlete_id)
        .all()
    )

    data = []
    for s, pw in resultados:
        if not s.weight:
            continue
        if s.rpe and pw.target_rpe:
            if s.rpe > pw.target_rpe:
                estado = "rojo"
            elif s.rpe < pw.target_rpe:
                estado = "amarillo"
            else:
                estado = "verde"
        else:
            estado = "verde"
        data.append({"plan_id": pw.id, "target_rpe": pw.target_rpe, "rpe_real": s.rpe, "estado": estado})

    return {"atleta_id": athlete_id, "cumplimiento": data}


@router.get("/atleta/{athlete_id}/dashboard-semanal/")
def dashboard_semanal(
    athlete_id: int,
    block_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    from datetime import date, timedelta

    DAY_NAME_OFFSET = {
        "lunes": 0, "martes": 1, "miércoles": 2, "miercoles": 2,
        "jueves": 3, "viernes": 4, "sábado": 5, "sabado": 5, "domingo": 6,
    }

    def classify_lift(ex) -> str:
        sub = (ex.subcategory or "").upper()
        if sub in ("SQ", "BP", "DL"):
            return sub
        combined = (ex.name + " " + (ex.variant or "")).lower()
        if any(k in combined for k in ("squat", "sentadilla")):
            return "SQ"
        if any(k in combined for k in ("bench", "banca", "banco")):
            return "BP"
        if any(k in combined for k in ("deadlift", "muerto")):
            return "DL"
        return "OTHER"

    q = (
        db.query(models.Set, models.PlannedWorkout, models.Day, models.Week, models.Block, models.Exercise)
        .join(models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id)
        .join(models.Day, models.PlannedWorkout.day_id == models.Day.id)
        .join(models.Week, models.Day.week_id == models.Week.id)
        .join(models.Block, models.Week.block_id == models.Block.id)
        .join(models.Exercise, models.Set.exercise_id == models.Exercise.id)
        .filter(
            models.Block.athlete_id == athlete_id,
            models.Set.weight != None,
            models.Set.reps != None,
        )
        .order_by(models.Block.id, models.Week.week_number, models.Day.day_number, models.Set.id)
    )
    if block_id:
        q = q.filter(models.Block.id == block_id)
    rows = q.all()

    # Enrich with e1rm and lift classification
    enriched = []
    for s, pw, day, week, block, ex in rows:
        e1rm = s.estimated_1rm
        if not e1rm and s.weight and s.reps and s.rpe:
            e1rm = calc_e1rm(s.weight, s.reps, s.rpe)
        enriched.append((s, pw, day, week, block, ex, e1rm, classify_lift(ex)))

    # Best e1rm per (block_id, lift_type) across the whole block
    best_e1rm: dict = {}
    for s, pw, day, week, block, ex, e1rm, lift in enriched:
        if e1rm:
            key = (block.id, lift)
            if key not in best_e1rm or e1rm > best_e1rm[key]:
                best_e1rm[key] = e1rm

    blocks_data: dict = {}

    for s, pw, day, week, block, ex, e1rm, lift in enriched:
        if block.id not in blocks_data:
            blocks_data[block.id] = {
                "block_id": block.id, "block_name": block.name,
                "start_date": block.start_date, "weeks": {},
            }
        bd = blocks_data[block.id]

        wk = week.week_number
        if wk not in bd["weeks"]:
            bd["weeks"][wk] = {"week_number": wk, "by_lift": {}, "days": {}}
        wd = bd["weeks"][wk]

        best = best_e1rm.get((block.id, lift), 0)
        pct_rm = (s.weight / best * 100) if best > 0 else 0
        si_set = s.reps * (pct_rm / 100) ** 4 / 3 if (s.reps and pct_rm > 0) else 0

        if lift not in wd["by_lift"]:
            wd["by_lift"][lift] = {
                "si": 0.0, "tonnage": 0.0, "e1rm_max": 0.0,
                "pct_rm_sum": 0.0, "rpe_sum": 0.0, "rpe_count": 0,
                "ns": 0, "nl": 0,
            }
        lm = wd["by_lift"][lift]
        lm["si"] += si_set
        lm["tonnage"] += s.weight * s.reps
        if e1rm and e1rm > lm["e1rm_max"]:
            lm["e1rm_max"] = e1rm
        lm["pct_rm_sum"] += pct_rm
        if s.rpe:
            lm["rpe_sum"] += s.rpe
            lm["rpe_count"] += 1
        lm["ns"] += 1
        lm["nl"] += s.reps

        dk = day.id
        if dk not in wd["days"]:
            session_date = None
            if block.start_date:
                try:
                    start = date.fromisoformat(block.start_date)
                    start = start - timedelta(days=start.weekday())
                    dow = DAY_NAME_OFFSET.get(day.day_name.lower(), day.day_number - 1) if day.day_name else (day.day_number - 1)
                    offset = (wk - 1) * 7 + dow
                    session_date = (start + timedelta(days=offset)).isoformat()
                except Exception:
                    pass
            wd["days"][dk] = {
                "day_id": day.id, "day_number": day.day_number,
                "day_name": day.day_name, "date": session_date, "exercises": {},
            }
        dd = wd["days"][dk]

        ex_key = ex.id
        if ex_key not in dd["exercises"]:
            ex_name = ex.name + (f" ({ex.variant})" if ex.variant else "")
            dd["exercises"][ex_key] = {
                "exercise_id": ex.id, "exercise_name": ex_name,
                "lift_type": lift, "sets": [],
            }
        em = dd["exercises"][ex_key]
        em["sets"].append({
            "set_num": len(em["sets"]) + 1,
            "reps": s.reps, "rpe": s.rpe, "weight": s.weight,
            "pct_rm": round(pct_rm, 1), "si": round(si_set, 4),
            "e1rm": round(e1rm, 1) if e1rm else None,
        })

    result = []
    for bid in sorted(blocks_data):
        bd = blocks_data[bid]
        weeks_out = []
        for wk_num in sorted(bd["weeks"]):
            wd = bd["weeks"][wk_num]
            by_lift_out = {}
            for lt, lm in wd["by_lift"].items():
                ns = lm["ns"]
                by_lift_out[lt] = {
                    "si": round(lm["si"], 3),
                    "tonnage": round(lm["tonnage"], 1),
                    "e1rm": round(lm["e1rm_max"], 1),
                    "pct_rm_avg": round(lm["pct_rm_sum"] / ns, 1) if ns else 0,
                    "rpe_avg": round(lm["rpe_sum"] / lm["rpe_count"], 1) if lm["rpe_count"] else 0,
                    "ns": ns, "nl": lm["nl"],
                }
            days_out = sorted(
                [
                    {
                        "day_id": dd["day_id"], "day_number": dd["day_number"],
                        "day_name": dd["day_name"], "date": dd["date"],
                        "exercises": list(dd["exercises"].values()),
                    }
                    for dd in wd["days"].values()
                ],
                key=lambda x: x["day_number"],
            )
            weeks_out.append({"week_number": wk_num, "by_lift": by_lift_out, "days": days_out})
        result.append({
            "block_id": bd["block_id"], "block_name": bd["block_name"],
            "start_date": bd["start_date"], "weeks": weeks_out,
        })

    return {"athlete_id": athlete_id, "blocks": result}
