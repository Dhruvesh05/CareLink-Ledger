import {
    FhirValidator,
    SpecRegistry,
} from "@fhir-toolkit/yafv";

import type {
    FhirResource,
    OperationOutcomeIssue,
} from "@fhir-toolkit/yafv";

export interface FhirValidationResult {
    valid: boolean;
    issues: OperationOutcomeIssue[];
}

export class FhirValidatorService {

    private readonly registry =
        new SpecRegistry({
            specsPath:
                "/home/dhruv/carelink/node_modules/@fhir-toolkit/r4-specs/specs",
            fhirVersion: "R4",
        });

    private readonly validator =
        new FhirValidator({
            registry: this.registry,
            fhirVersion: "R4",
        });

    async validate(
        resource: FhirResource
    ): Promise<FhirValidationResult> {

        const outcome =
            await this.validator.validate(
                resource
            );

        const issues =
            outcome.issue ?? [];

        const errors =
            issues.filter(
                (issue) =>
                    issue.severity === "error" ||
                    issue.severity === "fatal"
            );

        return {
            valid: errors.length === 0,
            issues,
        };
    }

    async isValid(
        resource: FhirResource
    ): Promise<boolean> {

        const result =
            await this.validate(resource);

        return result.valid;
    }
}

export default FhirValidatorService;
