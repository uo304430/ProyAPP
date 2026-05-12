from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.utils import calc_e1rm
from app.schemas import PlannedWorkoutCreate, PlannedWorkoutUpdate, SetCreate, SetUpdate, SetCapUpdate, SetPlanUpdate, BatchSetCreate

router = APIRouter(tags=["workouts"])


@router.get("/days/{day_id}/workouts/")
def obtener_entrenos(day_id: int, db: Session = Depends(get_db)):
    resultados = db.query(models.PlannedWorkout, models.Exercise).join(
        models.Exercise, models.PlannedWorkout.exercise_id == models.Exercise.id
    ).filter(models.PlannedWorkout.day_id == day_id).all()

    if not resultados:
        return {"dia_id": day_id, "entrenos": []}

    plan_ids = [plan.id for plan, _ in resultados]
    all_sets = db.query(models.Set).filter(models.Set.workout_id.in_(plan_ids)).all()
    sets_by_workout: dict[int, list] = {}
    for s in all_sets:
        sets_by_workout.setdefault(s.workout_id, []).append(s)

    entrenos = []
    for plan, ejercicio in resultados:
        series = sets_by_workout.get(plan.id, [])
        nombre = ejercicio.name + (f" ({ejercicio.variant})" if ejercicio.variant else "")
        entrenos.append({
            "plan_id": plan.id,
            "ejercicio_id": plan.exercise_id,
            "ejercicio_nombre": nombre,
            "exercise_category": ejercicio.category,
            "target_weight": plan.target_weight,
            "target_reps": plan.target_reps,
            "target_rpe": plan.target_rpe,
            "modifier": plan.modifier,
            "weight_cap": plan.weight_cap,
            "num_sets": len(series),
            "series": [
                {
                    "id": s.id,
                    "planned_weight": s.planned_weight,
                    "planned_reps": s.planned_reps,
                    "planned_rpe": s.planned_rpe,
                    "weight": s.weight,
                    "reps": s.reps,
                    "rpe": s.rpe,
                    "estimated_1rm": s.estimated_1rm,
                    "weight_cap": s.weight_cap,
                    "note": s.note,
                }
                for s in series
            ],
        })
    return {"dia_id": day_id, "entrenos": entrenos}


@router.post("/planned_workouts/")
def crear_planificado(data: PlannedWorkoutCreate, db: Session = Depends(get_db)):
    num_sets = max(data.num_sets or 1, 1)

    # If this exercise already exists in the day, add sets to it instead of creating a duplicate
    existing = db.query(models.PlannedWorkout).filter(
        models.PlannedWorkout.day_id == data.day_id,
        models.PlannedWorkout.exercise_id == data.exercise_id,
    ).first()

    if existing:
        db.add_all([
            models.Set(
                workout_id=existing.id,
                exercise_id=data.exercise_id,
                planned_weight=data.target_weight,
                planned_reps=data.target_reps,
                planned_rpe=data.target_rpe,
                weight=None, reps=None, rpe=None, estimated_1rm=0,
            )
            for _ in range(num_sets)
        ])
        db.commit()
        return {"mensaje": "Series añadidas al ejercicio existente", "plan_id": existing.id}

    pw = models.PlannedWorkout(
        day_id=data.day_id,
        exercise_id=data.exercise_id,
        target_weight=data.target_weight,
        target_reps=data.target_reps,
        target_rpe=data.target_rpe,
        modifier=data.modifier,
        weight_cap=data.weight_cap,
    )
    db.add(pw)
    db.flush()

    db.add_all([
        models.Set(
            workout_id=pw.id,
            exercise_id=data.exercise_id,
            planned_weight=data.target_weight,
            planned_reps=data.target_reps,
            planned_rpe=data.target_rpe,
            weight=None, reps=None, rpe=None, estimated_1rm=0,
        )
        for _ in range(num_sets)
    ])
    db.commit()
    return {"mensaje": "Entrenamiento planificado", "plan_id": pw.id}


@router.delete("/planned_workouts/{plan_id}/")
def eliminar_planificado(plan_id: int, db: Session = Depends(get_db)):
    pw = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.id == plan_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.query(models.Set).filter(models.Set.workout_id == plan_id).delete()
    db.delete(pw)
    db.commit()
    return {"mensaje": "Eliminado"}


@router.put("/planned_workouts/{plan_id}/")
def actualizar_planificado(plan_id: int, data: PlannedWorkoutUpdate, db: Session = Depends(get_db)):
    pw = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.id == plan_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="No encontrado")

    pw.target_weight = data.target_weight
    pw.target_reps = data.target_reps
    pw.target_rpe = data.target_rpe
    pw.modifier = data.modifier
    pw.weight_cap = data.weight_cap

    # Adjust set count if requested
    if data.num_sets is not None:
        existing = db.query(models.Set).filter(models.Set.workout_id == pw.id).all()
        current = len(existing)
        target = max(data.num_sets, 1)
        if target > current:
            db.add_all([
                models.Set(
                    workout_id=pw.id, exercise_id=pw.exercise_id,
                    planned_weight=data.target_weight,
                    planned_reps=data.target_reps, planned_rpe=data.target_rpe,
                    weight=None, reps=None, rpe=None, estimated_1rm=0,
                )
                for _ in range(target - current)
            ])
        elif target < current:
            # Remove unexecuted sets first, then executed if needed
            unexecuted = [s for s in existing if s.weight is None]
            to_delete = existing if not unexecuted else unexecuted
            for s in to_delete[:current - target]:
                db.delete(s)

    # Sync planned values on all unexecuted sets
    db.query(models.Set).filter(
        models.Set.workout_id == pw.id,
        models.Set.weight == None,
    ).update({
        "planned_weight": data.target_weight,
        "planned_reps": data.target_reps,
        "planned_rpe": data.target_rpe,
    })

    db.commit()
    return {"mensaje": "Actualizado", "plan_id": pw.id}


@router.get("/planned_workouts/{plan_id}/series/")
def obtener_series(plan_id: int, db: Session = Depends(get_db)):
    series = db.query(models.Set).filter(models.Set.workout_id == plan_id).all()
    return {
        "workout_id": plan_id,
        "series": [
            {
                "id": s.id,
                "planned_weight": s.planned_weight,
                "planned_reps": s.planned_reps,
                "planned_rpe": s.planned_rpe,
                "weight": s.weight,
                "reps": s.reps,
                "rpe": s.rpe,
                "estimated_1rm": s.estimated_1rm,
                "note": s.note,
            }
            for s in series
        ],
    }


@router.post("/series/")
def registrar_serie(data: SetCreate, db: Session = Depends(get_db)):
    e1rm = calc_e1rm(data.weight, data.reps or 0, data.rpe or 0) if data.weight else 0
    s = models.Set(
        workout_id=data.workout_id, exercise_id=data.exercise_id,
        planned_weight=data.planned_weight, planned_reps=data.planned_reps, planned_rpe=data.planned_rpe,
        weight=data.weight, reps=data.reps, rpe=data.rpe, estimated_1rm=e1rm,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"set_id": s.id, "e1rm": s.estimated_1rm}


@router.put("/series/{set_id}/")
def actualizar_serie(set_id: int, data: SetUpdate, db: Session = Depends(get_db)):
    from datetime import datetime
    s = db.query(models.Set).filter(models.Set.id == set_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    if data.weight is not None:
        s.weight = data.weight
    if data.reps is not None:
        s.reps = data.reps
    if data.rpe is not None:
        s.rpe = data.rpe
    if s.weight and s.reps and s.rpe:
        s.estimated_1rm = calc_e1rm(s.weight, s.reps, s.rpe)
        if not s.logged_at:
            s.logged_at = datetime.utcnow().isoformat()
    if data.note is not None:
        s.note = data.note
    db.commit()
    return {"set_id": s.id, "e1rm": s.estimated_1rm}


@router.put("/series/{set_id}/plan/")
def update_set_plan(set_id: int, data: SetPlanUpdate, db: Session = Depends(get_db)):
    s = db.query(models.Set).filter(models.Set.id == set_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    if data.planned_weight is not None:
        s.planned_weight = data.planned_weight
    if data.planned_reps is not None:
        s.planned_reps = data.planned_reps
    if data.planned_rpe is not None:
        s.planned_rpe = data.planned_rpe
    db.commit()
    return {"set_id": s.id}


@router.delete("/series/{set_id}/")
def delete_set(set_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Set).filter(models.Set.id == set_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    db.delete(s)
    db.commit()
    return {"mensaje": "Eliminada"}


@router.put("/series/{set_id}/planned/")
def actualizar_serie_planificada(set_id: int, data: SetCapUpdate, db: Session = Depends(get_db)):
    s = db.query(models.Set).filter(models.Set.id == set_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    s.weight_cap = data.weight_cap
    db.commit()
    return {"set_id": s.id}


@router.post("/planned_workouts/{plan_id}/series/add/")
def add_blank_set(plan_id: int, db: Session = Depends(get_db)):
    pw = db.query(models.PlannedWorkout).filter(models.PlannedWorkout.id == plan_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="No encontrado")
    s = models.Set(
        workout_id=pw.id, exercise_id=pw.exercise_id,
        planned_weight=pw.target_weight,
        planned_reps=pw.target_reps,
        planned_rpe=pw.target_rpe,
        weight=None, reps=None, rpe=None, estimated_1rm=0,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "planned_weight": s.planned_weight, "planned_reps": s.planned_reps, "planned_rpe": s.planned_rpe, "weight": None, "reps": None, "rpe": None, "estimated_1rm": None}


@router.post("/series/batch/")
def registrar_batch(data: BatchSetCreate, db: Session = Depends(get_db)):
    sets_to_add = [
        models.Set(
            workout_id=sd.workout_id, exercise_id=sd.exercise_id,
            planned_weight=sd.planned_weight, planned_reps=sd.planned_reps, planned_rpe=sd.planned_rpe,
            weight=sd.weight, reps=sd.reps, rpe=sd.rpe,
            estimated_1rm=calc_e1rm(sd.weight, sd.reps, sd.rpe),
        )
        for sd in data.series
    ]
    db.add_all(sets_to_add)
    db.commit()
    return {"total_guardadas": len(sets_to_add)}
