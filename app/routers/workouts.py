from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.utils import calc_e1rm
from app.schemas import PlannedWorkoutCreate, SetCreate, SetUpdate, BatchSetCreate

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
            "target_weight": plan.target_weight,
            "target_reps": plan.target_reps,
            "target_rpe": plan.target_rpe,
            "modifier": plan.modifier,
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
                }
                for s in series
            ],
        })
    return {"dia_id": day_id, "entrenos": entrenos}


@router.post("/planned_workouts/")
def crear_planificado(data: PlannedWorkoutCreate, db: Session = Depends(get_db)):
    pw = models.PlannedWorkout(
        day_id=data.day_id,
        exercise_id=data.exercise_id,
        target_weight=data.target_weight,
        target_reps=data.target_reps,
        target_rpe=data.target_rpe,
        modifier=data.modifier,
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
        for _ in range(max(data.num_sets or 1, 1))
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
    s = db.query(models.Set).filter(models.Set.id == set_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    s.weight = data.weight
    s.reps = data.reps
    s.rpe = data.rpe
    s.estimated_1rm = calc_e1rm(data.weight, data.reps, data.rpe) if data.weight else 0
    db.commit()
    return {"set_id": s.id, "e1rm": s.estimated_1rm}


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
