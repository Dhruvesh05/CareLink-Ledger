"""
Unit tests for IngestionService.
"""

import pandas as pd
import pytest

from app.ingestion.ingestion_service import IngestionService


@pytest.fixture
def service():
    """
    Create an IngestionService instance.
    """
    return IngestionService()


def test_load_csv(service):
    dataframe = service.load("test_data/sample.csv")

    assert isinstance(dataframe, pd.DataFrame)
    assert len(dataframe) == 3


# def test_load_excel(service):
#     dataframe = service.load("test_data/sample.xlsx")

#     assert isinstance(dataframe, pd.DataFrame)
#     assert len(dataframe) == 3


def test_load_json(service):
    dataframe = service.load("test_data/sample.json")

    assert isinstance(dataframe, pd.DataFrame)
    assert len(dataframe) == 3


def test_missing_file(service):
    with pytest.raises(FileNotFoundError):
        service.load("test_data/missing.csv")


# def test_unsupported_file(service):
#     with pytest.raises(ValueError):
#         service.load("test_data/sample.xml")