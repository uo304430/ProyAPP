from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import bcrypt
from fastapi.middleware.cors import CORSMiddleware

from . import models, database

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Powerlifting SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------
# Esquemas Pydantic
# ---------------------------------------------------------

class UserCreate(BaseModel):
    email: str
    password: str
    role: str

class CoachAthleteLink(BaseModel):
    coach_id: int
    athlete_id: int

class BlockCreate(BaseModel):
    name: str
    coach_id: int
    athlete_id: int

class WeekCreate(BaseModel):
    block_id: int
    week_number: int

class DayCreate(BaseModel):
    week_id: int
    day_number: int

class SetCreate(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: float
    planned_reps: int
    planned_rpe: float
    weight: float
    reps: int
    rpe: float

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
# Endpoints de Registro y Gestión de Usuarios
# ---------------------------------------------------------

@app.post("/register/")
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    pwd_bytes = user_data.password.encode('utf-8')
    hashed_pass = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
    
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

@app.post("/vincular/")
def vincular_entrenador_atleta(link_data: CoachAthleteLink, db: Session = Depends(get_db)):
    coach = db.query(models.User).filter(models.User.id == link_data.coach_id, models.User.role == "coach").first()
    if not coach:
        raise HTTPException(status_code=404, detail="Entrenador no encontrado o no tiene el rol correcto")
    
    athlete = db.query(models.User).filter(models.User.id == link_data.athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado o no tiene el rol correcto")
    
    existing_link = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == link_data.coach_id,
        models.CoachAthlete.athlete_id == link_data.athlete_id
    ).first()
    
    if existing_link:
        return {"mensaje": "Esta relación ya existe"}
    
    nuevo_vinculo = models.CoachAthlete(
        coach_id=link_data.coach_id,
        athlete_id=link_data.athlete_id
    )
    
    db.add(nuevo_vinculo)
    db.commit()
    
    return {"mensaje": "Atleta vinculado al entrenador correctamente"}

# ---------------------------------------------------------
# Endpoints de la Nueva Jerarquía (Bloque -> Semana -> Día -> Ejercicio)
# ---------------------------------------------------------

@app.post("/blocks/")
def crear_bloque(block_data: BlockCreate, db: Session = Depends(get_db)):
    nuevo_bloque = models.Block(
        name=block_data.name,
        coach_id=block_data.coach_id,
        athlete_id=block_data.athlete_id
    )
    db.add(nuevo_bloque)
    db.commit()
    db.refresh(nuevo_bloque)
    return {"mensaje": "Bloque creado", "bloque_id": nuevo_bloque.id}


@app.post("/weeks/")
def crear_semana(week_data: WeekCreate, db: Session = Depends(get_db)):
    nueva_semana = models.Week(
        block_id=week_data.block_id,
        week_number=week_data.week_number
    )
    db.add(nueva_semana)
    db.commit()
    db.refresh(nueva_semana)
    return {"mensaje": "Semana creada", "semana_id": nueva_semana.id}


@app.post("/days/")
def crear_dia(day_data: DayCreate, db: Session = Depends(get_db)):
    nuevo_dia = models.Day(
        week_id=day_data.week_id,
        day_number=day_data.day_number
    )
    db.add(nuevo_dia)
    db.commit()
    db.refresh(nuevo_dia)
    return {"mensaje": "Día creado", "dia_id": nuevo_dia.id}

@app.post("/series/")
def registrar_serie(set_data: SetCreate, db: Session = Depends(get_db)):
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
        "mensaje": "Serie registrada con éxito",
        "set_id": nueva_serie.id,
        "e1rm": nueva_serie.estimated_1rm,
        "objetivo_vs_real": {
            "objetivo_peso": nueva_serie.planned_weight,
            "peso_real": nueva_serie.weight
        }
    }

# ---------------------------------------------------------
# Endpoints de Obtención Jerárquica
# ---------------------------------------------------------

@app.get("/atleta/{athlete_id}/blocks/")
def obtener_bloques_atleta(athlete_id: int, db: Session = Depends(get_db)):
    bloques = db.query(models.Block).filter(models.Block.athlete_id == athlete_id).all()
    return {"atleta_id": athlete_id, "bloques": bloques}


@app.get("/blocks/{block_id}/weeks/")
def obtener_semanas_bloque(block_id: int, db: Session = Depends(get_db)):
    semanas = db.query(models.Week).filter(models.Week.block_id == block_id).all()
    return {"bloque_id": block_id, "semanas": semanas}


@app.get("/weeks/{week_id}/days/")
def obtener_dias_semana(week_id: int, db: Session = Depends(get_db)):
    dias = db.query(models.Day).filter(models.Day.week_id == week_id).all()
    return {"semana_id": week_id, "dias": dias}


@app.get("/days/{day_id}/workouts/")
def obtener_entrenos_dia(day_id: int, db: Session = Depends(get_db)):
    resultados = db.query(models.PlannedWorkout, models.Exercise).join(
        models.Exercise, models.PlannedWorkout.exercise_id == models.Exercise.id
    ).filter(models.PlannedWorkout.day_id == day_id).all()
    
    entrenos = []
    for plan, ejercicio in resultados:
        entrenos.append({
            "plan_id": plan.id,
            "ejercicio_id": plan.exercise_id,
            "ejercicio_nombre": ejercicio.name,
            "target_weight": plan.target_weight,
            "target_reps": plan.target_reps,
            "target_rpe": plan.target_rpe,
            "modifier": plan.modifier
        })
    return {"dia_id": day_id, "entrenos": entrenos}

# ---------------------------------------------------------
# Endpoints de Analítica y Progreso
# ---------------------------------------------------------

@app.get("/atleta/{athlete_id}/ejercicio/{exercise_id}/progreso/")
def obtener_progreso_ejercicio(athlete_id: int, exercise_id: int, db: Session = Depends(get_db)):
    athlete = db.query(models.User).filter(models.User.id == athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
        
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
    }


@app.get("/atleta/{athlete_id}/cumplimiento/")
def obtener_cumplimiento(athlete_id: int, db: Session = Depends(get_db)):
    athlete = db.query(models.User).filter(models.User.id == athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
        
    resultados = db.query(models.Set, models.PlannedWorkout).join(
        models.PlannedWorkout, models.Set.workout_id == models.PlannedWorkout.id
    ).filter(
        models.PlannedWorkout.athlete_id == athlete_id
    ).all()
    
    if not resultados:
        return {"mensaje": "No hay datos de cumplimiento para este atleta."}
        
    cumplimiento = []
    for serie, plan in resultados:
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

@app.post("/login/")
def iniciar_sesion(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Buscar al usuario por su email
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado. ¿Estás registrado?")
    
    # 2. Verificar la contraseña encriptada
    pwd_bytes = user_data.password.encode('utf-8')
    if not bcrypt.checkpw(pwd_bytes, db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    
    # 3. Devolver el ID y el rol para gestionar la sesión
    return {
        "mensaje": "Inicio de sesión exitoso",
        "usuario_id": db_user.id,
        "email": db_user.email,
        "rol": db_user.role
    }