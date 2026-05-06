from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    variant = Column(String, nullable=True) # ¡Esta línea es la que falta o estaba mal escrita!

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

class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    coach_id = Column(Integer)
    athlete_id = Column(Integer)

    # Relación en cascada con las semanas
    weeks = relationship("Week", back_populates="block", cascade="all, delete-orphan")

class Week(Base):
    __tablename__ = "weeks"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"))
    week_number = Column(Integer)

    block = relationship("Block", back_populates="weeks")
    
    # Relación en cascada con los días
    days = relationship("Day", back_populates="week", cascade="all, delete-orphan")

class Day(Base):
    __tablename__ = "days"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("weeks.id"))
    day_number = Column(Integer)

    week = relationship("Week", back_populates="days")

# 4. Nivel Inferior: Ejercicio Planificado en ese día
class PlannedWorkout(Base):
    __tablename__ = "planned_workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("days.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    target_weight = Column(Float, nullable=True)
    target_reps = Column(Integer)
    target_rpe = Column(Float)
    modifier = Column(String, nullable=True)

# Registro de la ejecución real
class Set(Base):
    __tablename__ = "sets"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("planned_workouts.id"), nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    
    # Datos Planificados
    planned_weight = Column(Float, nullable=True)
    planned_reps = Column(Integer, nullable=True)
    planned_rpe = Column(Float, nullable=True)
    
    # Datos Reales
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    rpe = Column(Float, nullable=True)
    estimated_1rm = Column(Float, nullable=True)