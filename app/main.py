from fastapi import FastAPI

app = FastAPI(title="Powerlifting API - RTS Style")

@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting con RPE activa"}

@app.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    # Ajustamos las repeticiones según el RPE para el cálculo
    # Si haces 5 reps @ 8, es como si pudieras haber hecho 7 reps @ 10.
    reps_equivalentes = reps + (10 - rpe)
    
    # Fórmula de Brzycki usando las reps equivalentes
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