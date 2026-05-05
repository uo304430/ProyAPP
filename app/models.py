from sqlalchemy import Column, Integer, String, Float, ForeignKey
from .database import Base

# (Mantén tus modelos Exercise, Set y User como los tienes actualmente)

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class Set(Base):
    __tablename__ = "sets"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer)
    exercise_id = Column(Integer)
    weight = Column(Float)
    reps = Column(Integer)
    rpe = Column(Float, nullable=True)
    estimated_1rm = Column(Float, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)

# AÑADE ESTA NUEVA TABLA AQUÍ:
class CoachAthlete(Base):
    __tablename__ = "coach_athlete"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"))
    athlete_id = Column(Integer, ForeignKey("users.id"))