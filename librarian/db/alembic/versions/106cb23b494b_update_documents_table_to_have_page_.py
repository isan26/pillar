"""update documents table to have page_number

Revision ID: 106cb23b494b
Revises: 7e7190be74c2
Create Date: 2026-06-12 13:35:21.078787

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '106cb23b494b'
down_revision: Union[str, Sequence[str], None] = '7e7190be74c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
