"""
Unit tests for LoaderFactory.
"""

import pytest

from app.ingestion.csv_loader import CSVLoader
from app.ingestion.excel_loader import ExcelLoader
from app.ingestion.json_loader import JSONLoader
from app.ingestion.loader_factory import LoaderFactory


def test_csv_loader_selected():
    loader = LoaderFactory.get_loader("patients.csv")
    assert isinstance(loader, CSVLoader)


def test_excel_loader_selected_xlsx():
    loader = LoaderFactory.get_loader("patients.xlsx")
    assert isinstance(loader, ExcelLoader)


def test_excel_loader_selected_xls():
    loader = LoaderFactory.get_loader("patients.xls")
    assert isinstance(loader, ExcelLoader)


def test_json_loader_selected():
    loader = LoaderFactory.get_loader("patients.json")
    assert isinstance(loader, JSONLoader)


def test_unsupported_extension():
    with pytest.raises(ValueError):
        LoaderFactory.get_loader("patients.xml")