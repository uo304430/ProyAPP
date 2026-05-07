from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import BlockCreate, BlockCreateFull, WeekCreate, DayCreate, ReplicateTemplate

router = APIRouter(tags=["blocks"])


@router.post("/blocks/")
def crear_bloque(data: BlockCreate, db: Session = Depends(get_db)):
    b = models.Block(name=data.name, coach_id=data.coach_id, athlete_id=data.athlete_id, objective=data.objective)
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"mensaje": "Bloque creado", "bloque_id": b.id}


@router.post("/blocks/full/")
def crear_bloque_completo(data: BlockCreateFull, db: Session = Depends(get_db)):
    b = models.Block(name=data.name, coach_id=data.coach_id, athlete_id=data.athlete_id, objective=data.objective)
    db.add(b)
    db.flush()

    for w in range(1, data.num_weeks + 1):
        semana = models.Week(block_id=b.id, week_number=w)
        db.add(semana)
        db.flush()
        db.add_all([models.Day(week_id=semana.id, day_number=d) for d in range(1, data.days_per_week + 1)])

    db.commit()
    return {"mensaje": "Bloque generado", "bloque_id": b.id, "total_semanas": data.num_weeks, "dias_por_semana": data.days_per_week}


@router.delete("/blocks/{block_id}/")
def eliminar_bloque(block_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Block).filter(models.Block.id == block_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
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
            "num_weeks": num_weeks,
        })
    return {"atleta_id": athlete_id, "bloques": result}


@router.get("/blocks/{block_id}/weeks/")
def obtener_semanas(block_id: int, db: Session = Depends(get_db)):
    return {"bloque_id": block_id, "semanas": db.query(models.Week).filter(models.Week.block_id == block_id).all()}


@router.post("/weeks/")
def crear_semana(data: WeekCreate, db: Session = Depends(get_db)):
    s = models.Week(block_id=data.block_id, week_number=data.week_number)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"semana_id": s.id}


@router.get("/weeks/{week_id}/days/")
def obtener_dias(week_id: int, db: Session = Depends(get_db)):
    return {"semana_id": week_id, "dias": db.query(models.Day).filter(models.Day.week_id == week_id).all()}


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
                )
                db.add(new_pw)
                db.flush()

                base_week_sets = sets_by_plan.get(wb.id, [])
                num_sets = len(base_week_sets) if base_week_sets else 1
                if data.progression_type == "volume_wave" and data.volume_sets and wave_idx < len(data.volume_sets):
                    num_sets = data.volume_sets[wave_idx]

                db.add_all([
                    models.Set(
                        workout_id=new_pw.id,
                        exercise_id=wb.exercise_id,
                        planned_weight=wb.target_weight,
                        planned_reps=new_reps,
                        planned_rpe=new_rpe,
                        weight=None, reps=None, rpe=None, estimated_1rm=0,
                    )
                    for _ in range(num_sets)
                ])

    db.commit()
    return {"mensaje": f"Plantilla replicada a {len(semanas) - 1} semanas", "progression": data.progression_type}
