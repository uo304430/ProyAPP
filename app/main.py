from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt # Cambiamos passlib por bcrypt
from . import models, database

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Powerlifting API - Sprint 2")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    email: str
    password: str
    role: str

# ---------------------------------------------------------
# Endpoints de Inicio y 1RM
# ---------------------------------------------------------

@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting con Base de Datos y Usuarios activa"}

@app.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    reps_equivalentes = reps + (10 - rpe)
    e1rm = peso / (1.0278 - (0.0278 * reps_equivalentes))
    
    return {
        "datos_entrada": {
            "peso": peso,
            "reps": reps,
            "rpe": rpe
        },
        "e1rm_estimado": round(e1rm, 2),
        "nota": f"Tu 1RM estimado es {round(e1rm, 2)}kg basado en un esfuerzo de {rpe}"
    }

# ---------------------------------------------------------
# Endpoints de Ejercicios
# ---------------------------------------------------------

@app.post("/ejercicios/")
def crear_ejercicio(nombre: str, db: Session = Depends(get_db)):
    nuevo_ejercicio = models.Exercise(name=nombre)
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return {"mensaje": "Ejercicio creado", "id": nuevo_ejercicio.id, "nombre": nuevo_ejercicio.name}

# ---------------------------------------------------------
# Endpoints de Series (Sets)
# ---------------------------------------------------------

from pydantic import BaseModel

class SetCreate(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: float
    planned_reps: int
    planned_rpe: float
    weight: float
    reps: int
    rpe: float

@app.post("/series/")
def registrar_serie(set_data: SetCreate, db: Session = Depends(get_db)):
    # Cálculo del e1RM basado en los datos reales ejecutados
    reps_equivalentes = set_data.reps + (10 - set_data.rpe)
    e1rm = set_data.weight / (1.0278 - (0.0278 * reps_equivalentes))
    
    nueva_serie = models.Set(
        workout_id=set_data.workout_id,
        exercise_id=set_data.exercise_id,
        planned_weight=set_data.planned_weight,
        planned_reps=set_data.planned_reps,
        planned_rpe=set_data.planned_rpe,
        weight=set_data.weight,
        reps=set_data.reps,
        rpe=set_data.rpe,
        estimated_1rm=round(e1rm, 2)
    )
    
    db.add(nueva_serie)
    db.commit()
    db.refresh(nueva_serie)
    
    return {
        "mensaje": "Serie registrada con éxito y comparada con el objetivo",
        "set_id": nueva_serie.id,
        "e1rm": nueva_serie.estimated_1rm,
        "objetivo_vs_real": {
            "objetivo_peso": nueva_serie.planned_weight,
            "peso_real": nueva_serie.weight
        }
    }
# ---------------------------------------------------------
# Endpoints de Registro de Usuario
# ---------------------------------------------------------

@app.post("/register/")
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el usuario ya existe
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Encriptar la contraseña usando bcrypt directamente
    pwd_bytes = user_data.password.encode('utf-8')
    hashed_pass = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
    
    # 3. Crear el nuevo usuario
    nuevo_usuario = models.User(
        email=user_data.email,
        hashed_password=hashed_pass,
        role=user_data.role
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return {
        "mensaje": "Usuario registrado exitosamente",
        "usuario_id": nuevo_usuario.id,
        "email": nuevo_usuario.email,
        "rol": nuevo_usuario.role
    }
class CoachAthleteLink(BaseModel):
    coach_id: int
    athlete_id: int

@app.post("/vincular/")
def vincular_entrenador_atleta(link_data: CoachAthleteLink, db: Session = Depends(get_db)):
    # Verificamos que el coach exista
    coach = db.query(models.User).filter(models.User.id == link_data.coach_id, models.User.role == "coach").first()
    if not coach:
        raise HTTPException(status_code=404, detail="Entrenador no encontrado o no tiene el rol correcto")
    
    # Verificamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == link_data.athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado o no tiene el rol correcto")
    
    # Verificamos si ya existe la relación para no duplicar
    existing_link = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == link_data.coach_id,
        models.CoachAthlete.athlete_id == link_data.athlete_id
    ).first()
    
    if existing_link:
        return {"mensaje": "Esta relación ya existe"}
    
    # Creamos el nuevo enlace
    nuevo_vinculo = models.CoachAthlete(
        coach_id=link_data.coach_id,
        athlete_id=link_data.athlete_id
    )
    
    db.add(nuevo_vinculo)
    db.commit()
    
    return {"mensaje": "Atleta vinculado al entrenador correctamente"}
from pydantic import BaseModel

from pydantic import BaseModel
from typing import Optional

class PlannedWorkoutCreate(BaseModel):
    coach_id: int
    athlete_id: int
    exercise_id: int
    target_weight: float
    target_reps: int
    target_rpe: float
    modifier: Optional[str] = None # Campo opcional para la variante

@app.post("/planificar/")
def crear_entrenamiento_planificado(plan_data: PlannedWorkoutCreate, db: Session = Depends(get_db)):
    # 1. Verificamos que el entrenador exista
    coach = db.query(models.User).filter(models.User.id == plan_data.coach_id, models.User.role == "coach").first()
    if not coach:
        raise HTTPException(status_code=404, detail="Entrenador no encontrado")
    
    # 2. Verificamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == plan_data.athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
    
    # 3. Creamos el registro del plan incluyendo el modificador
    nuevo_plan = models.PlannedWorkout(
        coach_id=plan_data.coach_id,
        athlete_id=plan_data.athlete_id,
        exercise_id=plan_data.exercise_id,
        target_weight=plan_data.target_weight,
        target_reps=plan_data.target_reps,
        target_rpe=plan_data.target_rpe,
        modifier=plan_data.modifier
    )
    
    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)
    
    return {
        "mensaje": "Entrenamiento planificado con variante correctamente",
        "plan_id": nuevo_plan.id,
        "ejercicio_id": nuevo_plan.exercise_id,
        "variante": nuevo_plan.modifier
    }
@app.get("/atleta/{athlete_id}/plan/")
def obtener_plan_atleta(athlete_id: int, db: Session = Depends(get_db)):
    # 1. Verificamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado en el sistema")
    
    # 2. Obtenemos los planes unidos con el nombre del ejercicio
    resultados = db.query(models.PlannedWorkout, models.Exercise).join(
        models.Exercise, models.PlannedWorkout.exercise_id == models.Exercise.id
    ).filter(models.PlannedWorkout.athlete_id == athlete_id).all()
    
    if not resultados:
        return {"mensaje": "No hay entrenamientos planificados para este atleta"}
        
    plan_detalle = []
    for plan, ejercicio in resultados:
        plan_detalle.append({
            "plan_id": plan.id,
            "ejercicio": ejercicio.name,
            "peso_target": plan.target_weight,
            "reps_target": plan.target_reps,
            "rpe_target": plan.target_rpe,
            "variante": plan.modifier
        })
        
    return {"atleta_id": athlete_id, "entrenos": plan_detalle}
@app.get("/atleta/{athlete_id}/ejercicio/{exercise_id}/progreso/")
def obtener_progreso_ejercicio(athlete_id: int, exercise_id: int, db: Session = Depends(get_db)):
    # 1. Comprobamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
        
    # 2. Obtenemos las series de ese atleta para ese ejercicio
    resultados = db.query(models.Set).filter(
        models.Set.exercise_id == exercise_id
    ).join(
        models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id
    ).filter(
        models.PlannedWorkout.athlete_id == athlete_id
    ).all()
    
    if not resultados:
        return {"mensaje": "No hay datos de progreso para este ejercicio y atleta."}
        
    historico = []
    for serie in resultados:
        historico.append({
            "set_id": serie.id,
            "peso_real": serie.weight,
            "reps_real": serie.reps,
            "rpe_real": serie.rpe,
            "e1rm_estimado": serie.estimated_1rm
        })
        
    return {
        "atleta_id": athlete_id,
        "ejercicio_id": exercise_id,
        "historial_series": historico
    } @app.get("/atleta/{athlete_id}/cumplimiento/")
def obtener_cumplimiento(athlete_id: int, db: Session = Depends(get_db)):
    # 1. Comprobamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
        
    # 2. Obtenemos los sets planificados y ejecutados
    resultados = db.query(models.Set, models.PlannedWorkout).join(
        models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id
    ).filter(
        models.PlannedWorkout.athlete_id == athlete_id
    ).all()
    
    if not resultados:
        return {"mensaje": "No hay datos de cumplimiento para este atleta."}
        
    cumplimiento = []
    for serie, plan in resultados:
        # Lógica de semáforo
        estado_rpe = "Verde"
        if serie.rpe and plan.target_rpe:
            if serie.rpe > plan.target_rpe:
                estado_rpe = "Rojo (Intensidad excedida)"
            elif serie.rpe < plan.target_rpe:
                estado_rpe = "Amarillo (Por debajo del objetivo)"
                
        cumplimiento.append({
            "plan_id": plan.id,
            "target_peso": plan.target_weight,
            "peso_real": serie.weight,
            "target_rpe": plan.target_rpe,
            "rpe_real": serie.rpe,
            "estado_cumplimiento": estado_rpe
        })
        
    return {
        "atleta_id": athlete_id,
        "analisis_cumplimiento": cumplimiento
    }