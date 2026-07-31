"""
Unit tests for BaseLoader.
"""

import pytest

from app.ingestion.base_loader import BaseLoader


def test_base_loader_cannot_be_instantiated():
    """
    Verify that BaseLoader cannot be instantiated
    because it is an abstract base class.
    """

    with pytest.raises(TypeError):
        BaseLoader()