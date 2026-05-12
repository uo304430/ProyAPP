"""set_note_cap_and_pw_cap_text

Revision ID: aa06a9c6dced
Revises: 8b881934f388
Create Date: 2026-05-08 16:59:52.840439

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa06a9c6dced'
down_revision: Union[str, Sequence[str], None] = '8b881934f388'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('planned_workouts') as batch_op:
        batch_op.alter_column('weight_cap', existing_type=sa.REAL(), type_=sa.String(), existing_nullable=True)
    op.add_column('sets', sa.Column('weight_cap', sa.String(), nullable=True))
    op.add_column('sets', sa.Column('note', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('sets', 'note')
    op.drop_column('sets', 'weight_cap')
    with op.batch_alter_table('planned_workouts') as batch_op:
        batch_op.alter_column('weight_cap', existing_type=sa.String(), type_=sa.REAL(), existing_nullable=True)
