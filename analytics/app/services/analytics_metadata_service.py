"""
Builds metadata from the outputs of the Analytics Layer.
"""

from __future__ import annotations

from app.models.analytics_metadata import AnalyticsMetadata


class AnalyticsMetadataService:
    """
    Converts analytics pipeline results into a compact metadata object.
    """

    def generate(
        self,
        *,
        schema_profile,
        mapping_result,
        validation_result,
        fhir_bundle=None,
        status: str | None = None,
    ) -> AnalyticsMetadata:
        """
        Generate analytics metadata from pipeline outputs.
        """

        # ---------------------------------------------------------
        # Source and canonical fields
        # ---------------------------------------------------------
        source_fields = list(schema_profile.columns)

        canonical_fields = [
            mapping.canonical_field
            for mapping in mapping_result.mappings
        ]

        unmapped_fields = list(
            mapping_result.unmapped_source_fields
        )

        # ---------------------------------------------------------
        # FHIR metadata
        # ---------------------------------------------------------
        fhir_resource_types: list[str] = []

        if fhir_bundle is not None and fhir_bundle.entry:
            fhir_resource_types = [
                entry.resource.__resource_type__
                for entry in fhir_bundle.entry
                if entry.resource is not None
            ]

        # ---------------------------------------------------------
        # Processing status
        # ---------------------------------------------------------
        if status is None:
            if (
                validation_result.is_valid
                and fhir_bundle is not None
            ):
                status = "FHIR_GENERATED"
            elif not validation_result.is_valid:
                status = "VALIDATED_WITH_ERRORS"
            else:
                status = "VALIDATED"

        # ---------------------------------------------------------
        # Construct metadata
        # ---------------------------------------------------------
        return AnalyticsMetadata(
            dataset_name=schema_profile.dataset_name,
            row_count=schema_profile.row_count,
            column_count=schema_profile.column_count,

            status=status,

            schema_fingerprint=schema_profile.fingerprint,

            source_fields=source_fields,
            canonical_fields=canonical_fields,
            unmapped_fields=unmapped_fields,

            mapping_count=mapping_result.mapping_count,
            mapping_complete=mapping_result.is_complete,

            valid_rows=validation_result.valid_rows,
            invalid_rows=validation_result.invalid_rows,
            quality_score=validation_result.quality_score,

            error_count=len(validation_result.errors),
            warning_count=len(validation_result.warnings),
            quarantined_row_count=len(
                validation_result.quarantined_rows
            ),

            fhir_resource_types=sorted(
                set(fhir_resource_types)
            ),
            fhir_resource_count=len(fhir_resource_types),

            statistics=schema_profile.statistics,
        )

    def build(self, result: dict) -> AnalyticsMetadata:
        """
        Backward-compatible interface.

        Allows callers that provide the complete pipeline result
        dictionary to continue using the metadata service.
        """

        return self.generate(
            schema_profile=result["schema_profile"],
            mapping_result=result["mapping_result"],
            validation_result=result["validation_result"],
            fhir_bundle=result.get("fhir_bundle"),
            status=result.get("status"),
        )