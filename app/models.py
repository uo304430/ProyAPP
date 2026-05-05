from sqlalchemy import Column, Integer, String, Float, ForeignKey
from .database import Base

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)

class CoachAthlete(Base):
    __tablename__ = "coach_athlete"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"))
    athlete_id = Column(Integer, ForeignKey("users.id"))

class PlannedWorkout(Base):
    __tablename__ = "planned_workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"))
    athlete_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    target_weight = Column(Float, nullable=True)
    target_reps = Column(Integer)
    target_rpe = Column(Float)
    
    # Campo para almacenar modificadores como "Tempo 3-0-0" o "Pausa 2s"
    modifier = Column(String, nullable=True) 

class Set(Base):
    __tablename__ = "sets"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("planned_workouts.id"), nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    
    # Datos Planificados (Target del Entrenador)
    planned_weight = Column(Float, nullable=True)
    planned_reps = Column(Integer, nullable=True)
    planned_rpe = Column(Float, nullable=True)
    
    # Datos Reales (Ejecución del Atleta)
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    rpe = Column(Float, nullable=True)
    estimated_1rm = Column(Float, nullable=True)