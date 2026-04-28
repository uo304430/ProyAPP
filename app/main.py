from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from . import models, database # Importamos tus nuevos archivos

# Esta línea es la "magia": crea las tablas en el archivo .db si no existen
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Powerlifting API - RTS Style")

@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting con Base de Datos activa"}

# ... (tus otros endpoints de 1rm se quedan igual)

@app.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    # Ajustamos las repeticiones según el RPE para el cálculo
    # Si haces 5 reps @ 8, es como si pudieras haber hecho 7 reps @ 10.
    reps_equivalentes = reps + (10 - rpe)
    
    # Fórmula de Brzycki usando las reps equivalentes
    e1rm = peso / (1.0278 - (0.0278 * reps_equivalentes))

    # Función para conectar con la DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ESTE ES EL QUE NECESITAS QUE APAREZCA:
@app.post("/ejercicios/")
def crear_ejercicio(nombre: str, db: Session = Depends(get_db)):
    nuevo_ejercicio = models.Exercise(name=nombre)
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return {"mensaje": "Ejercicio creado", "nombre": nuevo_ejercicio.name}

@app.post("/series/")
def registrar_serie(
    workout_id: int, 
    exercise_id: int, 
    peso: float, 
    reps: int, 
    rpe: float, 
    db: Session = Depends(get_db)
):
    # Calculamos el e1RM antes de guardar
    reps_equivalentes = reps + (10 - rpe)
    e1rm = peso / (1.0278 - (0.0278 * reps_equivalentes))
    
    # Creamos el objeto para la base de datos
    nueva_serie = models.Set(
        workout_id=workout_id,
        exercise_id=exercise_id,
        weight=peso,
        reps=reps,
        rpe=rpe,
        estimated_1rm=round(e1rm, 2)
    )
    
    db.add(nueva_serie)
    db.commit()
    db.refresh(nueva_serie)
    
    return {"mensaje": "Serie registrada con éxito", "e1rm": nueva_serie.estimated_1rm}
    
    return {
        "datos_entrada": {
            "peso": peso,
            "reps": reps,
            "rpe": rpe
        },
        "e1rm_estimado": round(e1rm, 2),
        "nota": f"Tu 1RM estimado es {round(e1rm, 2)}kg basado en un esfuerzo de {rpe}"
    }