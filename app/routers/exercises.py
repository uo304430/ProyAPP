from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import ExerciseCreate

router = APIRouter(prefix="/ejercicios", tags=["exercises"])


@router.get("/")
def obtener_ejercicios(db: Session = Depends(get_db)):
    return {"ejercicios": db.query(models.Exercise).all()}


@router.post("/")
def crear_ejercicio(ej: ExerciseCreate, db: Session = Depends(get_db)):
    variant = ej.variant.strip() if ej.variant else None
    if db.query(models.Exercise).filter(
        models.Exercise.name == ej.name, models.Exercise.variant == variant
    ).first():
        raise HTTPException(status_code=400, detail="Este ejercicio ya existe")
    nuevo = models.Exercise(name=ej.name, category=ej.category, variant=variant, subcategory=ej.subcategory)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "mensaje": "Ejercicio creado",
        "id": nuevo.id,
        "ejercicio": {"id": nuevo.id, "name": nuevo.name, "category": nuevo.category, "variant": nuevo.variant, "subcategory": nuevo.subcategory},
    }
