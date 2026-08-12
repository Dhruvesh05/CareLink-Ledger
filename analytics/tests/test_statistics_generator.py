import pandas as pd
import pytest

from app.schemas.statistics_generator import StatisticsGenerator


@pytest.fixture
def generator():
    return StatisticsGenerator()


def test_numeric_statistics(generator):
    dataframe = pd.DataFrame({
        "age": [20, 30, 40, 50]
    })

    result = generator.generate(dataframe)

    assert result["age"]["count"] == 4
    assert result["age"]["missing"] == 0
    assert result["age"]["unique"] == 4
    assert result["age"]["min"] == 20.0
    assert result["age"]["max"] == 50.0
    assert result["age"]["mean"] == 35.0
    assert result["age"]["median"] == 35.0


def test_missing_numeric_values(generator):
    dataframe = pd.DataFrame({
        "age": [20, None, 40]
    })

    result = generator.generate(dataframe)

    assert result["age"]["count"] == 2
    assert result["age"]["missing"] == 1


def test_categorical_statistics(generator):
    dataframe = pd.DataFrame({
        "gender": ["Male", "Female", "Male"]
    })

    result = generator.generate(dataframe)

    assert result["gender"]["count"] == 3
    assert result["gender"]["unique"] == 2
    assert result["gender"]["most_frequent"] == "Male"


def test_empty_column(generator):
    dataframe = pd.DataFrame({
        "age": [None, None, None]
    })

    result = generator.generate(dataframe)

    assert result["age"]["count"] == 0
    assert result["age"]["missing"] == 3
    assert result["age"]["unique"] == 0


def test_invalid_input(generator):
    with pytest.raises(TypeError):
        generator.generate("not a dataframe")