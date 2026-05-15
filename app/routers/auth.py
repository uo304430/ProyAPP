from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import uuid
import smtplib
import os
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from app import models
from app.dependencies import get_db
from app.schemas import UserCreate, CoachAthleteLink, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter(tags=["auth"])


@router.post("/register/")
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_db)):
    email = user_data.email.lower().strip()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    uname = user_data.username.strip().lower() if user_data.username else None
    if uname and db.query(models.User).filter(models.User.username == uname).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    hashed = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    user = models.User(email=email, hashed_password=hashed, role=user_data.role, username=uname)
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = models.Profile(
        user_id=user.id,
        first_name=user_data.first_name.strip() if user_data.first_name else None,
        last_name=user_data.last_name.strip() if user_data.last_name else None,
    )
    db.add(profile)
    db.commit()

    return {"mensaje": "Usuario registrado", "usuario_id": user.id, "email": user.email, "rol": user.role}


@router.post("/login/")
def iniciar_sesion(user_data: UserCreate, db: Session = Depends(get_db)):
    email = user_data.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    if not bcrypt.checkpw(user_data.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    return {"mensaje": "Inicio de sesión exitoso", "usuario_id": user.id, "email": user.email, "rol": user.role}


def _send_reset_email(to_email: str, token: str) -> str | None:
    """Envía el email de reset. Devuelve el enlace si no hay SMTP configurado (modo dev)."""
    base_url = os.getenv("APP_URL", "http://localhost:5173")
    reset_link = f"{base_url}/#reset?token={token}"

    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        return reset_link  # modo dev: el enlace va al frontend

    msg = MIMEText(
        f"Hola,\n\nHaz clic en el siguiente enlace para restablecer tu contraseña B2L "
        f"(válido 1 hora):\n\n{reset_link}\n\nSi no solicitaste esto, ignora este email.",
        "plain", "utf-8"
    )
    msg["Subject"] = "Restablecer contraseña B2L"
    msg["From"] = os.getenv("SMTP_FROM", smtp_host)
    msg["To"] = to_email

    try:
        with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", 587))) as s:
            s.starttls()
            s.login(os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASS", ""))
            s.send_message(msg)
    except Exception as e:
        print(f"[RESET PASSWORD] Error enviando email: {e}\nEnlace: {reset_link}")
        return reset_link  # si falla el envío, también lo devolvemos
    return None


@router.post("/forgot-password/")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower().strip()).first()
    # Respuesta genérica para no revelar si el email existe
    if not user:
        return {"mensaje": "Si el email existe recibirás un enlace de recuperación"}

    # Invalidar tokens anteriores no usados
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == 0,
    ).update({"used": 1})
    db.commit()

    token = str(uuid.uuid4())
    expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    db.add(models.PasswordResetToken(user_id=user.id, token=token, expires_at=expires, used=0))
    db.commit()

    dev_link = _send_reset_email(user.email, token)
    response = {"mensaje": "Si el email existe recibirás un enlace de recuperación"}
    if dev_link:
        response["dev_link"] = dev_link
    return response


@router.post("/reset-password/")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == data.token,
        models.PasswordResetToken.used == 0,
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="Token inválido o ya utilizado")
    if datetime.utcnow() > datetime.fromisoformat(record.expires_at):
        raise HTTPException(status_code=400, detail="El enlace ha expirado. Solicita uno nuevo.")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    user.hashed_password = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    record.used = 1
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}


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
