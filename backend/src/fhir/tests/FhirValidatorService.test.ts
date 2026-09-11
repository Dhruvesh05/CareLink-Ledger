import { FhirValidatorService } from "../validation/FhirValidatorService";

describe("FhirValidatorService", () => {

    const service =
        new FhirValidatorService();

    it("accepts a valid FHIR R4 Patient", async () => {

        const patient = {
            resourceType: "Patient",
            id: "patient-001",
            name: [
                {
                    family: "Patil",
                    given: ["Dhruv"],
                },
            ],
        };

        const result =
            await service.validate(
                patient
            );

        expect(result.valid).toBe(true);
    });

    it("rejects an invalid FHIR Patient", async () => {

        const invalidResource = {
            resourceType: "Patient",
            id: "patient-002",
            name: "invalid-name",
        };

        const result =
            await service.validate(
                invalidResource
            );

        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
    });

    it("rejects an unknown resource type", async () => {

        const invalidResource = {
            resourceType: "NotARealFHIRResource",
            id: "invalid-001",
        };

        const result =
            await service.validate(
                invalidResource
            );

        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
    });

});
