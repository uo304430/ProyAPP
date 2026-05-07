from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
from app import models
from app.dependencies import get_db
from app.schemas import UserCreate, CoachAthleteLink

router = APIRouter(tags=["auth"])


@router.post("/register/")
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    hashed = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    user = models.User(email=user_data.email, hashed_password=hashed, role=user_data.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"mensaje": "Usuario registrado", "usuario_id": user.id, "email": user.email, "rol": user.role}


@router.post("/login/")
def iniciar_sesion(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    if not bcrypt.checkpw(user_data.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    return {"mensaje": "Inicio de sesión exitoso", "usuario_id": user.id, "email": user.email, "rol": user.role}


@router.post("/vincular/")
def vincular(link_data: CoachAthleteLink, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == link_data.coach_id, models.User.role == "coach").first():
        raise HTTPException(status_code=404, detail="Entrenador no encontrado")
    if not db.query(models.User).filter(models.User.id == link_data.athlete_id, models.User.role == "athlete").first():
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
    if db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == link_data.coach_id,
        models.CoachAthlete.athlete_id == link_data.athlete_id,
    ).first():
        return {"mensaje": "Relación ya existe"}
    db.add(models.CoachAthlete(coach_id=link_data.coach_id, athlete_id=link_data.athlete_id))
    db.commit()
    return {"mensaje": "Atleta vinculado correctamente"}
