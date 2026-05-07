from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.utils import calc_e1rm

router = APIRouter(tags=["analytics"])


@router.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    return {"e1rm_estimado": calc_e1rm(peso, reps, rpe)}


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
        .all()
    )

    return {
        "atleta_id": athlete_id,
        "ejercicio_id": exercise_id,
        "historial": [
            {"set_id": s.id, "peso_real": s.weight, "reps_real": s.reps, "rpe_real": s.rpe, "e1rm": s.estimated_1rm}
            for s in series if s.weight
        ],
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
