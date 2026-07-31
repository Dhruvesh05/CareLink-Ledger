"""
Unit tests for JSONLoader.
"""

from pathlib import Path

import pandas as pd
import pytest

from app.ingestion.json_loader import JSONLoader


@pytest.fixture
def loader():
    """
    Create a JSONLoader instance.
    """
    return JSONLoader()


def test_load_valid_json(loader):
    """
    Verify that a valid JSON file is loaded correctly.
    """

    # Arrange
    file_path = Path("test_data/sample.json")

    # Act
    dataframe = loader.load(str(file_path))

    # Assert
    assert isinstance(dataframe, pd.DataFrame)
    assert len(dataframe) == 3
    assert list(dataframe.columns) == [
        "patient_id",
        "name",
        "age",
    ]


def test_load_missing_json(loader):
    """
    Verify FileNotFoundError is raised.
    """

    with pytest.raises(FileNotFoundError):
        loader.load("test_data/missing.json")


def test_wrong_extension(loader):
    """
    Verify ValueError is raised for non-JSON files.
    """

    with pytest.raises(ValueError):
        loader.load("test_data/sample.csv")


def test_load_empty_json(loader):
    """
    Verify an empty JSON array is loaded.
    """

    dataframe = loader.load("test_data/empty.json")

    assert isinstance(dataframe, pd.DataFrame)
    assert dataframe.empty