from pydantic import BaseModel
from typing import Literal, Optional, List


class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class CoachAthleteLink(BaseModel):
    coach_id: int
    athlete_id: int


class BlockCreate(BaseModel):
    name: str
    coach_id: int
    athlete_id: int
    objective: Optional[str] = None
    start_date: Optional[str] = None


class BlockCreateFull(BlockCreate):
    num_weeks: int
    days_per_week: int
    day_names: Optional[List[str]] = None  # e.g. ["Lunes","Miércoles","Viernes"]


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
    subcategory: Optional[str] = None
    user_id: Optional[int] = None


class PlannedWorkoutCreate(BaseModel):
    day_id: int
    exercise_id: int
    target_weight: Optional[float] = None
    target_reps: int
    target_rpe: float
    modifier: Optional[str] = None
    num_sets: Optional[int] = 1
    weight_cap: Optional[str] = None


class PlannedWorkoutUpdate(BaseModel):
    target_weight: Optional[float] = None
    target_reps: int
    target_rpe: float
    modifier: Optional[str] = None
    weight_cap: Optional[str] = None
    num_sets: Optional[int] = None


class SetCreate(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: Optional[float] = None
    planned_reps: int
    planned_rpe: float
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = None


class SetUpdate(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = None
    note: Optional[str] = None


class SetCapUpdate(BaseModel):
    weight_cap: Optional[str] = None


class SetPlanUpdate(BaseModel):
    planned_weight: Optional[float] = None
    planned_reps: Optional[int] = None
    planned_rpe: Optional[float] = None


class SingleSetInput(BaseModel):
    workout_id: int
    exercise_id: int
    planned_weight: Optional[float] = None
    planned_reps: int
    planned_rpe: float
    weight: Optional[float] = None
    reps: int
    rpe: float


class BatchSetCreate(BaseModel):
    series: List[SingleSetInput]


class ConnectionRequestCreate(BaseModel):
    from_user_id: int
    to_email: Optional[str] = None       # email search (legacy)
    to_identifier: Optional[str] = None  # email or @username


class ProfileUpsert(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    squat_pr: Optional[float] = None
    bench_pr: Optional[float] = None
    deadlift_pr: Optional[float] = None


class WeeklyCheckinCreate(BaseModel):
    week_start: str  # "YYYY-MM-DD"
    fatigue: Optional[int] = None
    sleep: Optional[int] = None
    motivation: Optional[int] = None
    stress: Optional[int] = None
    soreness: Optional[int] = None
    notes: Optional[str] = None


class CompetitionCreate(BaseModel):
    name: str
    date: str  # "YYYY-MM-DD"
    weight_class: Optional[str] = None
    federation: Optional[str] = None
    squat_best: Optional[float] = None
    bench_best: Optional[float] = None
    deadlift_best: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None


class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    weight_class: Optional[str] = None
    federation: Optional[str] = None
    squat_best: Optional[float] = None
    bench_best: Optional[float] = None
    deadlift_best: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
