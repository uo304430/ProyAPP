from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import ExerciseCreate

router = APIRouter(prefix="/ejercicios", tags=["exercises"])


@router.get("/")
def obtener_ejercicios(user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Exercise)
    if user_id is not None:
        q = q.filter((models.Exercise.user_id == None) | (models.Exercise.user_id == user_id))
    else:
        q = q.filter(models.Exercise.user_id == None)
    return {"ejercicios": q.all()}


@router.post("/")
def crear_ejercicio(ej: ExerciseCreate, db: Session = Depends(get_db)):
    variant = ej.variant.strip() if ej.variant else None
    if db.query(models.Exercise).filter(
        models.Exercise.name == ej.name,
        models.Exercise.variant == variant,
        (models.Exercise.user_id == ej.user_id) if ej.user_id else (models.Exercise.user_id == None),
    ).first():
        raise HTTPException(status_code=400, detail="Este ejercicio ya existe")
    nuevo = models.Exercise(name=ej.name, category=ej.category, variant=variant, subcategory=ej.subcategory, user_id=ej.user_id)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "mensaje": "Ejercicio creado",
        "id": nuevo.id,
        "ejercicio": {"id": nuevo.id, "name": nuevo.name, "category": nuevo.category, "variant": nuevo.variant, "subcategory": nuevo.subcategory, "user_id": nuevo.user_id},
    }
