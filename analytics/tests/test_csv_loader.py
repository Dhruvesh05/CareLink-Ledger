"""
Unit tests for CSVLoader.
"""

from pathlib import Path

import pandas as pd
import pytest

from app.ingestion.csv_loader import CSVLoader


@pytest.fixture
def loader():
    """
    Create a CSVLoader instance.
    """
    return CSVLoader()


def test_load_valid_csv(loader):
    """
    Verify that a valid CSV file is loaded correctly.
    """

    # Arrange
    file_path = Path("test_data/sample.csv")

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


def test_load_missing_csv(loader):
    """
    Verify FileNotFoundError is raised for a missing file.
    """

    with pytest.raises(FileNotFoundError):
        loader.load("test_data/missing.csv")


def test_wrong_extension(loader):
    """
    Verify ValueError is raised for an unsupported extension.
    """

    with pytest.raises(ValueError):
        loader.load("test_data/sample.xlsx")


def test_load_empty_csv(loader):
    """
    Verify an empty CSV (headers only) is loaded.
    """

    dataframe = loader.load("test_data/empty.csv")

    assert isinstance(dataframe, pd.DataFrame)
    assert dataframe.empty
    assert len(dataframe.columns) == 3