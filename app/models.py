from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    variant = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    user_id = Column(Integer, nullable=True)  # NULL = global library, set = user-private

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    username = Column(String, unique=True, nullable=True, index=True)

class CoachAthlete(Base):
    __tablename__ = "coach_athlete"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(String, default="accepted")  # pending | accepted


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)  # base64 data URL or remote URL
    squat_pr = Column(Float, nullable=True)
    bench_pr = Column(Float, nullable=True)
    deadlift_pr = Column(Float, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    coach_id = Column(Integer, index=True)
    athlete_id = Column(Integer, index=True)
    objective = Column(String, nullable=True)
    start_date = Column(String, nullable=True)  # ISO date "YYYY-MM-DD"

    weeks = relationship("Week", back_populates="block", cascade="all, delete-orphan")

class Week(Base):
    __tablename__ = "weeks"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), index=True)
    week_number = Column(Integer)
    published = Column(Integer, default=0)  # 0 = borrador, 1 = publicada (visible para el atleta)

    block = relationship("Block", back_populates="weeks")

    # Relación en cascada con los días
    days = relationship("Day", back_populates="week", cascade="all, delete-orphan")

class Day(Base):
    __tablename__ = "days"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("weeks.id"), index=True)
    day_number = Column(Integer)
    day_name = Column(String, nullable=True)  # e.g. "Lunes", "Miércoles"

    week = relationship("Week", back_populates="days")
    planned_workouts = relationship("PlannedWorkout", cascade="all, delete-orphan")

# 4. Nivel Inferior: Ejercicio Planificado en ese día
class PlannedWorkout(Base):
    __tablename__ = "planned_workouts"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("days.id"), index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), index=True)
    target_weight = Column(Float, nullable=True)
    target_reps = Column(Integer)
    target_rpe = Column(Float)
    modifier = Column(String, nullable=True)
    weight_cap = Column(String, nullable=True)  # text cap/note, e.g. "100-120kg"
    sets = relationship("Set", foreign_keys="Set.workout_id", cascade="all, delete-orphan")

# Registro de la ejecución real
class Set(Base):
    __tablename__ = "sets"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("planned_workouts.id"), nullable=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), index=True)
    
    # Datos Planificados
    planned_weight = Column(Float, nullable=True)
    planned_reps = Column(Integer, nullable=True)
    planned_rpe = Column(Float, nullable=True)
    
    # Datos Reales
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    rpe = Column(Float, nullable=True)
    estimated_1rm = Column(Float, nullable=True)
    weight_cap = Column(String, nullable=True)  # per-set cap set by coach (text, e.g. "100-120kg")
    note = Column(String, nullable=True)         # per-set note set by athlete
    logged_at = Column(String, nullable=True)    # ISO datetime when the set was completed


class WeeklyCheckin(Base):
    __tablename__ = "weekly_checkins"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), index=True)
    week_start = Column(String)       # "YYYY-MM-DD" Monday of the week
    fatigue = Column(Integer, nullable=True)      # 1-10
    sleep = Column(Integer, nullable=True)        # 1-10
    motivation = Column(Integer, nullable=True)   # 1-10
    stress = Column(Integer, nullable=True)       # 1-10
    soreness = Column(Integer, nullable=True)     # 1-10
    notes = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(String)   # ISO datetime
    used = Column(Integer, default=0)


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String)
    date = Column(String)             # "YYYY-MM-DD"
    weight_class = Column(String, nullable=True)
    federation = Column(String, nullable=True)
    squat_best = Column(Float, nullable=True)
    bench_best = Column(Float, nullable=True)
    deadlift_best = Column(Float, nullable=True)
    total = Column(Float, nullable=True)
    notes = Column(String, nullable=True)