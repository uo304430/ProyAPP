from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
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
