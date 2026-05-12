"""add_block_start_date

Revision ID: d20fec283f29
Revises: 94812ce11385
Create Date: 2026-05-12 01:18:59.784633

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd20fec283f29'
down_revision: Union[str, Sequence[str], None] = '94812ce11385'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('blocks', sa.Column('start_date', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('blocks', 'start_date')
