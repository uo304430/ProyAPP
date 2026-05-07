from pydantic import BaseModel
from typing import Literal, Optional, List


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
    objective: Optional[str] = None


class BlockCreateFull(BlockCreate):
    num_weeks: int
    days_per_week: int


class ReplicateTemplate(BaseModel):
    progression_type: Literal["same", "rpe_wave", "volume_wave"]
    rpe_values: Optional[List[float]] = None
    volume_sets: Optional[List[int]] = None


class WeekCreate(BaseModel):
    block_id: int
    week_number: int


class DayCreate(BaseModel):
    week_id: int
    day_number: int


class ExerciseCreate(BaseModel):
    name: str
    category: str
    variant: Optional[str] = None


class PlannedWorkoutCreate(BaseModel):
    day_id: int
    exercise_id: int
    target_weight: Optional[float] = None
    target_reps: int
    target_rpe: float
    modifier: Optional[str] = None
    num_sets: Optional[int] = 1


class SetCreate(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: Optional[float] = None
    planned_reps: int
    planned_rpe: float
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[int] = None


class SetUpdate(BaseModel):
    weight: Optional[float] = None
    reps: int
    rpe: int


class SingleSetInput(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: Optional[float] = None
    planned_reps: int
    planned_rpe: float
    weight: Optional[float] = None
    reps: int
    rpe: int


class BatchSetCreate(BaseModel):
    series: List[SingleSetInput]
