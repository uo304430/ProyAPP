from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import BlockCreate, BlockCreateFull, WeekCreate, DayCreate, ReplicateTemplate

router = APIRouter(tags=["blocks"])


@router.post("/blocks/")
def crear_bloque(data: BlockCreate, db: Session = Depends(get_db)):
    b = models.Block(name=data.name, coach_id=data.coach_id, athlete_id=data.athlete_id, objective=data.objective, start_date=data.start_date)
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"mensaje": "Bloque creado", "bloque_id": b.id}


@router.post("/blocks/full/")
def crear_bloque_completo(data: BlockCreateFull, db: Session = Depends(get_db)):
    is_self_coached = data.coach_id == data.athlete_id
    b = models.Block(name=data.name, coach_id=data.coach_id, athlete_id=data.athlete_id, objective=data.objective, start_date=data.start_date)
    db.add(b)
    db.flush()

    for w in range(1, data.num_weeks + 1):
        semana = models.Week(block_id=b.id, week_number=w, published=1 if is_self_coached else 0)
        db.add(semana)
        db.flush()
        days = []
        for i in range(data.days_per_week):
            name = data.day_names[i] if data.day_names and i < len(data.day_names) else None
            days.append(models.Day(week_id=semana.id, day_number=i + 1, day_name=name))
        db.add_all(days)

    db.commit()
    return {"mensaje": "Bloque generado", "bloque_id": b.id, "total_semanas": data.num_weeks, "dias_por_semana": data.days_per_week}


@router.delete("/blocks/{block_id}/")
def eliminar_bloque(block_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Block).filter(models.Block.id == block_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
    # Full cascade: Sets → PlannedWorkouts → Days (Weeks/Days cascade via ORM)
    for week in db.query(models.Week).filter(models.Week.block_id == b.id).all():
        for day in db.query(models.Day).filter(models.Day.week_id == week.id).all():
            plan_ids = [
                pw.id for pw in
                db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == day.id).all()
            ]
            if plan_ids:
                db.query(models.Set).filter(models.Set.workout_id.in_(plan_ids)).delete(synchronize_session=False)
                db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == day.id).delete(synchronize_session=False)
    db.delete(b)
    db.commit()
    return {"mensaje": "Bloque eliminado"}


@router.get("/atleta/{athlete_id}/blocks/")
def obtener_bloques(athlete_id: int, db: Session = Depends(get_db)):
    bloques = db.query(models.Block).filter(models.Block.athlete_id == athlete_id).all()
    result = []
    for b in bloques:
        num_weeks = db.query(models.Week).filter(models.Week.block_id == b.id).count()
        result.append({
            "id": b.id, "name": b.name, "objective": b.objective,
            "athlete_id": b.athlete_id, "coach_id": b.coach_id,
            "num_weeks": num_weeks, "start_date": b.start_date,
        })
    return {"atleta_id": athlete_id, "bloques": result}


@router.get("/blocks/{block_id}/weeks/")
def obtener_semanas(block_id: int, published_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(models.Week).filter(models.Week.block_id == block_id)
    if published_only:
        q = q.filter(models.Week.published == 1)
    semanas = q.order_by(models.Week.week_number).all()
    return {
        "bloque_id": block_id,
        "semanas": [
            {"id": s.id, "block_id": s.block_id, "week_number": s.week_number, "published": s.published}
            for s in semanas
        ],
    }


@router.post("/weeks/{week_id}/publish/")
def publish_week(week_id: int, db: Session = Depends(get_db)):
    week = db.query(models.Week).filter(models.Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Semana no encontrada")
    week.published = 1
    db.commit()
    return {"week_id": week_id, "published": True}


@router.post("/weeks/{week_id}/unpublish/")
def unpublish_week(week_id: int, db: Session = Depends(get_db)):
    week = db.query(models.Week).filter(models.Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Semana no encontrada")
    week.published = 0
    db.commit()
    return {"week_id": week_id, "published": False}


@router.get("/coach/{coach_id}/pending-reviews/")
def pending_reviews(coach_id: int, db: Session = Depends(get_db)):
    """Per-athlete count of blocks where the next sequential week is unpublished (max 1 per block)."""
    blocks = db.query(models.Block).filter(
        models.Block.coach_id == coach_id,
        models.Block.athlete_id != coach_id,
    ).all()

    pending_by_athlete: dict[int, int] = {}
    for block in blocks:
        weeks = (
            db.query(models.Week)
            .filter(models.Week.block_id == block.id)
            .order_by(models.Week.week_number)
            .all()
        )
        if not weeks:
            continue
        published_nums = {w.week_number for w in weeks if w.published}
        if not published_nums:
            next_num = 1
        else:
            next_num = max(published_nums) + 1
        week_nums = {w.week_number: w for w in weeks}
        next_week = week_nums.get(next_num)
        if next_week and not next_week.published:
            aid = block.athlete_id
            pending_by_athlete[aid] = pending_by_athlete.get(aid, 0) + 1

    return {"pending": pending_by_athlete, "total": sum(pending_by_athlete.values())}


@router.post("/weeks/")
def crear_semana(data: WeekCreate, db: Session = Depends(get_db)):
    s = models.Week(block_id=data.block_id, week_number=data.week_number)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"semana_id": s.id}


@router.get("/weeks/{week_id}/days/")
def obtener_dias(week_id: int, db: Session = Depends(get_db)):
    dias = db.query(models.Day).filter(models.Day.week_id == week_id).order_by(models.Day.day_number).all()
    return {
        "semana_id": week_id,
        "dias": [{"id": d.id, "week_id": d.week_id, "day_number": d.day_number, "day_name": d.day_name} for d in dias],
    }


@router.post("/days/")
def crear_dia(data: DayCreate, db: Session = Depends(get_db)):
    d = models.Day(week_id=data.week_id, day_number=data.day_number)
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"dia_id": d.id}


@router.get("/blocks/{block_id}/weeks/{week_number}/days/{day_number}/")
def obtener_dia_por_posicion(block_id: int, week_number: int, day_number: int, db: Session = Depends(get_db)):
    dia = (
        db.query(models.Day)
        .join(models.Week)
        .filter(models.Week.block_id == block_id, models.Week.week_number == week_number, models.Day.day_number == day_number)
        .first()
    )
    if not dia:
        raise HTTPException(status_code=404, detail="Día no encontrado")
    return {"day_id": dia.id}


@router.post("/blocks/{block_id}/weeks/add/")
def add_week(block_id: int, db: Session = Depends(get_db)):
    weeks = db.query(models.Week).filter(models.Week.block_id == block_id).order_by(models.Week.week_number).all()
    if not weeks:
        raise HTTPException(status_code=404, detail="Bloque no encontrado o sin semanas")
    days_count = db.query(models.Day).filter(models.Day.week_id == weeks[0].id).count()
    new_num = max(w.week_number for w in weeks) + 1
    new_week = models.Week(block_id=block_id, week_number=new_num)
    db.add(new_week)
    db.flush()
    db.add_all([models.Day(week_id=new_week.id, day_number=d) for d in range(1, days_count + 1)])
    db.commit()
    return {"semana_id": new_week.id, "week_number": new_num, "total_semanas": len(weeks) + 1}


@router.delete("/blocks/{block_id}/weeks/last/")
def remove_last_week(block_id: int, db: Session = Depends(get_db)):
    weeks = db.query(models.Week).filter(models.Week.block_id == block_id).order_by(models.Week.week_number).all()
    if len(weeks) <= 1:
        raise HTTPException(status_code=400, detail="El bloque debe tener al menos una semana")
    last = weeks[-1]
    days = db.query(models.Day).filter(models.Day.week_id == last.id).all()
    for day in days:
        pws = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == day.id).all()
        for pw in pws:
            db.query(models.Set).filter(models.Set.workout_id == pw.id).delete()
            db.delete(pw)
        db.delete(day)
    db.delete(last)
    db.commit()
    return {"mensaje": f"Semana {last.week_number} eliminada", "total_semanas": len(weeks) - 1}


@router.get("/atleta/{athlete_id}/calendar/")
def get_calendar(athlete_id: int, year: int, month: int, db: Session = Depends(get_db)):
    import calendar as cal_mod
    first_day = date(year, month, 1)
    last_day = date(year, month, cal_mod.monthrange(year, month)[1])

    # Athlete sees own blocks; coach sees own training + all athlete blocks they manage
    blocks = (
        db.query(models.Block)
        .filter(
            (models.Block.athlete_id == athlete_id) | (models.Block.coach_id == athlete_id)
        )
        .all()
    )
    sessions: dict[str, list] = {}

    DAY_NAME_OFFSET = {"lunes": 0, "martes": 1, "miércoles": 2, "miercoles": 2, "jueves": 3, "viernes": 4, "sábado": 5, "sabado": 5, "domingo": 6}

    for block in blocks:
        if not block.start_date:
            continue
        start = date.fromisoformat(block.start_date)
        # Align start to the Monday of its week so day_name offsets are correct
        start = start - timedelta(days=start.weekday())
        weeks = db.query(models.Week).filter(models.Week.block_id == block.id).order_by(models.Week.week_number).all()
        for week in weeks:
            days = db.query(models.Day).filter(models.Day.week_id == week.id).order_by(models.Day.day_number).all()
            for day in days:
                if day.day_name:
                    day_offset = DAY_NAME_OFFSET.get(day.day_name.lower(), day.day_number - 1)
                else:
                    day_offset = day.day_number - 1
                offset = (week.week_number - 1) * 7 + day_offset
                session_date = start + timedelta(days=offset)
                if first_day <= session_date <= last_day:
                    key = session_date.isoformat()
                    workout_count = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == day.id).count()
                    # Resolve athlete name for coach view
                    athlete_label = None
                    if block.athlete_id != athlete_id:
                        athlete_user = db.query(models.User).filter(models.User.id == block.athlete_id).first()
                        if athlete_user:
                            profile = db.query(models.Profile).filter(models.Profile.user_id == block.athlete_id).first()
                            athlete_label = (profile.display_name if profile and profile.display_name else athlete_user.email)
                    sessions.setdefault(key, []).append({
                        "block_id": block.id,
                        "block_name": block.name,
                        "week_number": week.week_number,
                        "day_number": day.day_number,
                        "day_id": day.id,
                        "day_name": day.day_name,
                        "workout_count": workout_count,
                        "athlete_label": athlete_label,
                        "published": week.published,
                    })

    return {"year": year, "month": month, "sessions": sessions}


@router.get("/blocks/{block_id}/full/")
def get_block_full(block_id: int, db: Session = Depends(get_db)):
    """Full block structure with planned workouts and logged sets — used by dashboard editor."""
    block = db.query(models.Block).filter(models.Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")

    weeks = db.query(models.Week).filter(models.Week.block_id == block_id).order_by(models.Week.week_number).all()

    weeks_out = []
    for week in weeks:
        days = db.query(models.Day).filter(models.Day.week_id == week.id).order_by(models.Day.day_number).all()
        days_out = []
        for day in days:
            pws_q = (
                db.query(models.PlannedWorkout, models.Exercise)
                .join(models.Exercise, models.PlannedWorkout.exercise_id == models.Exercise.id)
                .filter(models.PlannedWorkout.day_id == day.id)
                .all()
            )
            pw_ids = [pw.id for pw, _ in pws_q]
            all_sets = db.query(models.Set).filter(models.Set.workout_id.in_(pw_ids)).all() if pw_ids else []
            sets_by_pw: dict = {}
            for s in all_sets:
                sets_by_pw.setdefault(s.workout_id, []).append(s)

            exercises_out = []
            for pw, ex in pws_q:
                nombre = ex.name + (f" ({ex.variant})" if ex.variant else "")
                sets = sets_by_pw.get(pw.id, [])
                logged = [s for s in sets if s.weight is not None]
                exercises_out.append({
                    "plan_id": pw.id,
                    "exercise_id": pw.exercise_id,
                    "exercise_name": nombre,
                    "exercise_subcategory": ex.subcategory,
                    "target_weight": pw.target_weight,
                    "target_reps": pw.target_reps,
                    "target_rpe": pw.target_rpe,
                    "modifier": pw.modifier,
                    "weight_cap": pw.weight_cap,
                    "num_sets": len(sets),
                    "num_logged": len(logged),
                    "sets": [
                        {
                            "id": s.id,
                            "planned_weight": s.planned_weight,
                            "planned_reps": s.planned_reps,
                            "planned_rpe": s.planned_rpe,
                            "weight": s.weight,
                            "reps": s.reps,
                            "rpe": s.rpe,
                        }
                        for s in sets
                    ],
                })

            days_out.append({
                "day_id": day.id,
                "day_number": day.day_number,
                "day_name": day.day_name,
                "exercises": exercises_out,
            })

        weeks_out.append({
            "week_id": week.id,
            "week_number": week.week_number,
            "published": week.published,
            "days": days_out,
        })

    return {
        "block_id": block.id,
        "block_name": block.name,
        "start_date": block.start_date,
        "objective": block.objective,
        "weeks": weeks_out,
    }


@router.post("/blocks/{block_id}/copy-from/{source_id}/")
def copy_from_block(block_id: int, source_id: int, db: Session = Depends(get_db)):
    src_w1 = db.query(models.Week).filter(models.Week.block_id == source_id, models.Week.week_number == 1).first()
    tgt_w1 = db.query(models.Week).filter(models.Week.block_id == block_id, models.Week.week_number == 1).first()
    if not src_w1 or not tgt_w1:
        raise HTTPException(status_code=404, detail="Semana 1 no encontrada")

    src_days = db.query(models.Day).filter(models.Day.week_id == src_w1.id).order_by(models.Day.day_number).all()
    tgt_days = {d.day_number: d for d in db.query(models.Day).filter(models.Day.week_id == tgt_w1.id).all()}

    copied = 0
    for src_day in src_days:
        tgt_day = tgt_days.get(src_day.day_number)
        if not tgt_day:
            continue
        for pw in db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == tgt_day.id).all():
            db.query(models.Set).filter(models.Set.workout_id == pw.id).delete()
            db.delete(pw)
        db.flush()
        for src_pw in db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == src_day.id).all():
            num_sets = db.query(models.Set).filter(models.Set.workout_id == src_pw.id).count()
            new_pw = models.PlannedWorkout(
                day_id=tgt_day.id, exercise_id=src_pw.exercise_id,
                target_weight=src_pw.target_weight, target_reps=src_pw.target_reps,
                target_rpe=src_pw.target_rpe, modifier=src_pw.modifier, weight_cap=src_pw.weight_cap,
            )
            db.add(new_pw)
            db.flush()
            db.add_all([
                models.Set(
                    workout_id=new_pw.id, exercise_id=src_pw.exercise_id,
                    planned_weight=src_pw.target_weight, planned_reps=src_pw.target_reps,
                    planned_rpe=src_pw.target_rpe, weight=None, reps=None, rpe=None, estimated_1rm=0,
                )
                for _ in range(max(num_sets, 1))
            ])
            copied += 1

    db.commit()
    return {"copied": copied}


@router.post("/blocks/{block_id}/replicate-template/")
def replicar_plantilla(block_id: int, data: ReplicateTemplate, db: Session = Depends(get_db)):
    semanas = (
        db.query(models.Week)
        .filter(models.Week.block_id == block_id)
        .order_by(models.Week.week_number)
        .all()
    )
    if len(semanas) < 2:
        return {"mensaje": "Solo hay una semana, nada que replicar"}

    semana_base = semanas[0]
    dias_base = db.query(models.Day).filter(models.Day.week_id == semana_base.id).order_by(models.Day.day_number).all()

    for semana in semanas[1:]:
        wave_idx = semana.week_number - 2  # 0-indexed from week 2

        dias_destino = (
            db.query(models.Day)
            .filter(models.Day.week_id == semana.id)
            .order_by(models.Day.day_number)
            .all()
        )

        for dia_base, dia_dest in zip(dias_base, dias_destino):
            # Delete existing workouts in the destination day
            pws = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == dia_dest.id).all()
            for pw in pws:
                db.query(models.Set).filter(models.Set.workout_id == pw.id).delete()
                db.delete(pw)
            db.flush()

            workouts_base = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.day_id == dia_base.id).all()
            base_plan_ids = [wb.id for wb in workouts_base]
            base_sets = db.query(models.Set).filter(models.Set.workout_id.in_(base_plan_ids)).all()
            sets_by_plan: dict[int, list] = {}
            for s in base_sets:
                sets_by_plan.setdefault(s.workout_id, []).append(s)

            for wb in workouts_base:
                new_rpe = wb.target_rpe
                new_reps = wb.target_reps

                if data.progression_type == "rpe_wave" and data.rpe_values and wave_idx < len(data.rpe_values):
                    new_rpe = data.rpe_values[wave_idx]

                new_pw = models.PlannedWorkout(
                    day_id=dia_dest.id,
                    exercise_id=wb.exercise_id,
                    target_weight=wb.target_weight,
                    target_reps=new_reps,
                    target_rpe=new_rpe,
                    modifier=wb.modifier,
                    weight_cap=wb.weight_cap,
                )
                db.add(new_pw)
                db.flush()

                template_sets = sets_by_plan.get(wb.id, [])
                num_sets = len(template_sets) if template_sets else 1
                if data.progression_type == "volume_wave" and data.volume_sets and wave_idx < len(data.volume_sets):
                    num_sets = data.volume_sets[wave_idx]

                new_sets = []
                for i in range(num_sets):
                    if i < len(template_sets):
                        s = template_sets[i]
                        s_reps = s.planned_reps if s.planned_reps is not None else new_reps
                        s_rpe = new_rpe if data.progression_type == "rpe_wave" else (s.planned_rpe if s.planned_rpe is not None else new_rpe)
                        s_weight = s.planned_weight
                        s_cap = s.weight_cap
                    else:
                        last = template_sets[-1] if template_sets else None
                        s_reps = last.planned_reps if last and last.planned_reps is not None else new_reps
                        s_rpe = new_rpe if data.progression_type == "rpe_wave" else (last.planned_rpe if last and last.planned_rpe is not None else new_rpe)
                        s_weight = last.planned_weight if last else wb.target_weight
                        s_cap = last.weight_cap if last else None
                    new_sets.append(models.Set(
                        workout_id=new_pw.id,
                        exercise_id=wb.exercise_id,
                        planned_weight=s_weight,
                        planned_reps=s_reps,
                        planned_rpe=s_rpe,
                        weight=None, reps=None, rpe=None, estimated_1rm=0,
                        weight_cap=s_cap,
                    ))
                db.add_all(new_sets)

    db.commit()
    return {"mensaje": f"Plantilla replicada a {len(semanas) - 1} semanas", "progression": data.progression_type}
