"""
Orchestrates the analytics pipeline from raw ingestion
through schema analysis, mapping, canonical transformation,
and validation.
"""

from __future__ import annotations

import pandas as pd

from app.mapping.canonical_transformer import CanonicalTransformer
from app.schemas.schema_analyzer import SchemaAnalyzer
from app.services.mapping_service import MappingService
from app.validation.validation_service import ValidationService


class AnalyticsPipelineService:
    """
    Coordinates the core analytics-layer processing pipeline.

    Pipeline:
        Raw DataFrame
            -> Schema Analysis
            -> Schema Mapping
            -> Canonical Transformation
            -> Validation
    """

    def __init__(
        self,
        schema_analyzer: SchemaAnalyzer | None = None,
        mapping_service: MappingService | None = None,
        validation_service: ValidationService | None = None,
        transformer: CanonicalTransformer | None = None,
    ) -> None:
        self.schema_analyzer = schema_analyzer or SchemaAnalyzer()
        self.mapping_service = mapping_service or MappingService()
        self.validation_service = validation_service or ValidationService()
        self.transformer = transformer or CanonicalTransformer()

    def process(
        self,
        dataframe: pd.DataFrame,
        dataset_name: str = "pipeline_dataset",
    ) -> dict:
        """
        Process a raw hospital dataset through the analytics pipeline.

        Args:
            dataframe: Raw hospital dataset as a pandas DataFrame.
            dataset_name: Name assigned to the dataset during schema analysis.

        Returns:
            Dictionary containing:
                - schema_profile
                - mapping_result
                - canonical_dataframe
                - validation_result

        Raises:
            TypeError: If dataframe is not a pandas DataFrame.
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        # 1. Analyze the raw dataset schema
        schema_profile = self.schema_analyzer.analyze(
            dataframe,
            dataset_name=dataset_name,
        )

        # 2. Map hospital-specific fields to canonical fields
        mapping_result = self.mapping_service.map_dataset(
            schema_profile
        )

        # 3. Transform the DataFrame using the generated mappings
        canonical_dataframe = self.transformer.transform(
            dataframe,
            mapping_result,
        )

        # 4. Validate the canonical dataset
        validation_result = self.validation_service.validate_dataset(
            canonical_dataframe,
            schema_profile,
        )

        return {
            "schema_profile": schema_profile,
            "mapping_result": mapping_result,
            "canonical_dataframe": canonical_dataframe,
            "validation_result": validation_result,
        }