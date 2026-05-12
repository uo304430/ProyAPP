"""add_fk_indexes

Revision ID: 8b881934f388
Revises: f9d7db008b41
Create Date: 2026-05-08 16:36:14.765836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b881934f388'
down_revision: Union[str, Sequence[str], None] = 'f9d7db008b41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f('ix_blocks_athlete_id'), 'blocks', ['athlete_id'], unique=False)
    op.create_index(op.f('ix_blocks_coach_id'), 'blocks', ['coach_id'], unique=False)
    op.create_index(op.f('ix_coach_athlete_athlete_id'), 'coach_athlete', ['athlete_id'], unique=False)
    op.create_index(op.f('ix_coach_athlete_coach_id'), 'coach_athlete', ['coach_id'], unique=False)
    op.create_index(op.f('ix_days_week_id'), 'days', ['week_id'], unique=False)
    op.create_index(op.f('ix_planned_workouts_day_id'), 'planned_workouts', ['day_id'], unique=False)
    op.create_index(op.f('ix_planned_workouts_exercise_id'), 'planned_workouts', ['exercise_id'], unique=False)
    op.create_index(op.f('ix_sets_exercise_id'), 'sets', ['exercise_id'], unique=False)
    op.create_index(op.f('ix_sets_workout_id'), 'sets', ['workout_id'], unique=False)
    op.create_index(op.f('ix_weeks_block_id'), 'weeks', ['block_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_weeks_block_id'), table_name='weeks')
    op.drop_index(op.f('ix_sets_workout_id'), table_name='sets')
    op.drop_index(op.f('ix_sets_exercise_id'), table_name='sets')
    op.drop_index(op.f('ix_planned_workouts_exercise_id'), table_name='planned_workouts')
    op.drop_index(op.f('ix_planned_workouts_day_id'), table_name='planned_workouts')
    op.drop_index(op.f('ix_days_week_id'), table_name='days')
    op.drop_index(op.f('ix_coach_athlete_coach_id'), table_name='coach_athlete')
    op.drop_index(op.f('ix_coach_athlete_athlete_id'), table_name='coach_athlete')
    op.drop_index(op.f('ix_blocks_coach_id'), table_name='blocks')
    op.drop_index(op.f('ix_blocks_athlete_id'), table_name='blocks')
