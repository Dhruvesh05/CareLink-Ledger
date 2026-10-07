import AuthorizationService from "../../src/ssi/services/AuthorizationService";

type AuthorizationCase = {
    label: string;
    role: string;
    action: string;
    verified: boolean;
    expected: boolean;
};

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Authorization Service Test");
    console.log("=================================");

    const did = "did:key:carelink-authorization-smoke-test";
    const cases: AuthorizationCase[] = [
        {
            label: "A",
            role: "doctor",
            action: "read_patient_record",
            verified: true,
            expected: true,
        },
        {
            label: "B",
            role: "doctor",
            action: "create_clinical_record",
            verified: true,
            expected: true,
        },
        {
            label: "C",
            role: "doctor",
            action: "manage_access",
            verified: true,
            expected: false,
        },
        {
            label: "D",
            role: "nurse",
            action: "read_patient_record",
            verified: true,
            expected: true,
        },
        {
            label: "E",
            role: "patient",
            action: "read_own_record",
            verified: true,
            expected: true,
        },
        {
            label: "F",
            role: "patient",
            action: "update_clinical_record",
            verified: true,
            expected: false,
        },
        {
            label: "G",
            role: "admin",
            action: "manage_access",
            verified: true,
            expected: true,
        },
        {
            label: "H",
            role: "doctor",
            action: "read_patient_record",
            verified: false,
            expected: false,
        },
        {
            label: "I",
            role: "unknown",
            action: "read_patient_record",
            verified: true,
            expected: false,
        },
    ];

    for (const testCase of cases) {
        console.log(`\n${testCase.label}. Authorization request`);
        console.log("DID:", did);
        console.log("Role:", testCase.role);
        console.log("Action:", testCase.action);
        console.log("Verification status:", testCase.verified);

        const result = await AuthorizationService.authorize(
            did,
            testCase.action,
            testCase.verified,
            { role: testCase.role },
        );

        console.log("Authorization result:", result);
        console.log("Expected result:", testCase.expected);

        if (result !== testCase.expected) {
            throw new Error(
                `Case ${testCase.label} failed. Expected ${testCase.expected}, received ${result}.`,
            );
        }
    }

    console.log("\n=================================");
    console.log("SSI AUTHORIZATION TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("SSI AUTHORIZATION TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
