"""add_exercise_subcategory

Revision ID: 94812ce11385
Revises: aa06a9c6dced
Create Date: 2026-05-08 17:15:41.010978

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94812ce11385'
down_revision: Union[str, Sequence[str], None] = 'aa06a9c6dced'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('exercises', sa.Column('subcategory', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('exercises', 'subcategory')
