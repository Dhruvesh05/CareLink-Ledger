import {
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

const authenticate = jest.fn();
let ssiAuthorizationAllowed = true;
let ssiRole = "Doctor";
let ssiChallengeValid = true;
let doctorRoleAllowed = true;
const confirmMiddlewareEvents: string[] = [];

const requireRole = jest.fn((role: string) => {
    const middleware = jest.fn((req: any, res: any, next: any) => {
        if (role === "Doctor") {
            confirmMiddlewareEvents.push("role");
        }

        if (!doctorRoleAllowed && role === "Doctor") {
            return res.status(403).json({
                success: false,
                message: "Insufficient role for this operation"
            });
        }

        return next();
    });

    Object.defineProperty(middleware, "name", {
        value: `requireRole:${role}`
    });

    return middleware;
});

const requireCareLinkRole = jest.fn((role: string) => {
    const middleware = jest.fn((req: any, res: any, next: any) => {
        confirmMiddlewareEvents.push("ssi");

        if (!ssiAuthorizationAllowed || !ssiChallengeValid) {
            return res.status(403).json({
                success: false,
                message: "SSI authorization failed"
            });
        }

        if (ssiRole !== role) {
            return res.status(403).json({
                success: false,
                message: "Insufficient CareLink role"
            });
        }

        return next();
    });

    Object.defineProperty(middleware, "name", {
        value: `requireCareLinkRole:${role}`
    });

    return middleware;
});
const uploadSingle = jest.fn(() => {
    const middleware = jest.fn();
    Object.defineProperty(middleware, "name", {
        value: "upload.single:file"
    });
    return middleware;
});
const requireFile = jest.fn();
const mockPrepareMedicalRecord = jest.fn();
const mockConfirmMedicalRecord = jest.fn();
const mockViewRecord = jest.fn();
const mockGetMedicalRecordContent = jest.fn();
const mockGetPatientRecords = jest.fn();
const mockGetDoctorRecords = jest.fn();
const mockGetHospitalRecords = jest.fn();
const mockIsAuthorizedDoctor = jest.fn();
const mockRecordExists = jest.fn();
const mockTotalRecords = jest.fn();
const mockUpdateMedicalRecord = jest.fn();
const mockGrantAccess = jest.fn();
const mockRevokeAccess = jest.fn();
const mockLogDownload = jest.fn();
const mockDeactivateMedicalRecord = jest.fn();
const mockGetMedicalRecord = jest.fn();

mockConfirmMedicalRecord.mockImplementation((req: any, res: any) => {
    return res.status(200).json({
        success: true,
        data: {
            doctorWallet: req.auth?.walletAddress
        }
    });
});

jest.mock("../../middleware/auth", () => ({
    authenticate,
    requireRole
}));

jest.mock("../../middleware/upload.middleware", () => ({
    __esModule: true,
    default: {
        single: uploadSingle
    },
    requireFile
}));

jest.mock("../../ssi/middleware/carelinkAuthorization", () => ({
    requireCareLinkRole
}));

jest.mock("../../controllers/MedicalRecordController", () => ({
    MedicalRecordController: jest.fn().mockImplementation(() => ({
        prepareMedicalRecord: mockPrepareMedicalRecord,
        confirmMedicalRecord: mockConfirmMedicalRecord,
        viewRecord: mockViewRecord,
        getMedicalRecordContent: mockGetMedicalRecordContent,
        getPatientRecords: mockGetPatientRecords,
        getDoctorRecords: mockGetDoctorRecords,
        getHospitalRecords: mockGetHospitalRecords,
        isAuthorizedDoctor: mockIsAuthorizedDoctor,
        recordExists: mockRecordExists,
        totalRecords: mockTotalRecords,
        updateMedicalRecord: mockUpdateMedicalRecord,
        grantAccess: mockGrantAccess,
        revokeAccess: mockRevokeAccess,
        logDownload: mockLogDownload,
        deactivateMedicalRecord: mockDeactivateMedicalRecord,
        getMedicalRecord: mockGetMedicalRecord
    }))
}));

function getRoute(router: any, path: string, method: string) {
    const layer = router.stack.find(
        (item: any) => item.route?.path === path && item.route.methods[method]
    );

    if (!layer) {
        throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
    }

    return layer.route;
}

function createResponse() {
    const response: any = {
        status: jest.fn(),
        json: jest.fn()
    };

    response.status.mockReturnValue(response);

    return response;
}

async function invokeConfirmRoute(route: any, req: any, res: any) {
    let index = 0;

    const next = async () => {
        const middleware = route.stack[index++]?.handle;

        if (!middleware) {
            return;
        }

        return middleware(req, res, next);
    };

    return next();
}

describe("medical record route SSI integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ssiAuthorizationAllowed = true;
        ssiRole = "Doctor";
        ssiChallengeValid = true;
        doctorRoleAllowed = true;
        confirmMiddlewareEvents.length = 0;
    });

    it("requires authentication at the router level", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const middlewareLayer = router.stack.find((layer: any) => !layer.route);

        expect(middlewareLayer?.handle).toBe(authenticate);
    });

    it("uses the required prepare middleware order", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const prepareRoute = getRoute(router, "/prepare", "post");

        expect(prepareRoute.stack.map((layer: any) => layer.handle)).toEqual([
            expect.any(Function),
            expect.any(Function),
            expect.any(Function),
            requireFile,
            expect.any(Function)
        ]);
        expect(prepareRoute.stack[0].handle.name).toBe("upload.single:file");
        expect(prepareRoute.stack[1].handle.name).toBe("requireCareLinkRole:Doctor");
        expect(prepareRoute.stack[2].handle.name).toBe("requireRole:Doctor");
        expect(prepareRoute.stack[4].handle.name).toBe(`bound ${mockPrepareMedicalRecord.name}`);
    });

    it("uses SSI authorization before the existing confirm role check", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");

        expect(confirmRoute.stack).toHaveLength(3);
        expect(confirmRoute.stack[0].handle.name).toBe("requireCareLinkRole:Doctor");
        expect(confirmRoute.stack[1].handle.name).toBe("requireRole:Doctor");
        expect(confirmRoute.stack[2].handle).toEqual(expect.any(Function));
        expect(confirmRoute.stack[2].handle.name).toBe(`bound ${mockConfirmMedicalRecord.name}`);
    });

    it("allows a valid SSI-authorized Doctor request to reach confirmation business logic", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const request = {
            auth: {
                userId: "doctor-user",
                walletAddress: "0x2222222222222222222222222222222222222222",
                role: "Doctor"
            },
            body: {
                preparationId: "prep-123",
                transactionHash: "0x" + "a".repeat(64)
            }
        };
        const response = createResponse();

        await invokeConfirmRoute(confirmRoute, request, response);

        expect(confirmMiddlewareEvents).toEqual(["ssi", "role"]);
        expect(mockConfirmMedicalRecord).toHaveBeenCalledWith(
            request,
            response,
            expect.any(Function)
        );
        expect(response.status).toHaveBeenCalledWith(200);
    });

    it("rejects confirmation when SSI authorization fails before the Doctor role check", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const response = createResponse();
        ssiAuthorizationAllowed = false;

        await invokeConfirmRoute(
            confirmRoute,
            { auth: { role: "Doctor" }, body: {} },
            response
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(confirmMiddlewareEvents).toEqual(["ssi"]);
        expect(mockConfirmMedicalRecord).not.toHaveBeenCalled();
    });

    it("rejects confirmation when the SSI role is not Doctor", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const response = createResponse();
        ssiRole = "Patient";

        await invokeConfirmRoute(
            confirmRoute,
            { auth: { role: "Patient" }, body: {} },
            response
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(confirmMiddlewareEvents).toEqual(["ssi"]);
        expect(mockConfirmMedicalRecord).not.toHaveBeenCalled();
    });

    it("preserves the existing Doctor role check after SSI authorization", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const response = createResponse();
        doctorRoleAllowed = false;

        await invokeConfirmRoute(
            confirmRoute,
            { auth: { role: "Patient" }, body: {} },
            response
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(confirmMiddlewareEvents).toEqual(["ssi", "role"]);
        expect(mockConfirmMedicalRecord).not.toHaveBeenCalled();
    });

    it("rejects confirmation when the SSI challenge is invalid or already consumed", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const response = createResponse();
        ssiChallengeValid = false;

        await invokeConfirmRoute(
            confirmRoute,
            {
                auth: { role: "Doctor" },
                body: { presentation: { challenge: "consumed-challenge" } }
            },
            response
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockConfirmMedicalRecord).not.toHaveBeenCalled();
    });

    it("preserves the authenticated JWT wallet after SSI authorization", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const request = {
            auth: {
                userId: "doctor-user",
                walletAddress: "0x2222222222222222222222222222222222222222",
                role: "Doctor"
            },
            body: {
                preparationId: "prep-123",
                transactionHash: "0x" + "a".repeat(64),
                doctor: "0x9999999999999999999999999999999999999999"
            }
        };
        const response = createResponse();

        await invokeConfirmRoute(confirmRoute, request, response);

        expect(mockConfirmMedicalRecord).toHaveBeenCalledWith(
            expect.objectContaining({
                auth: expect.objectContaining({
                    walletAddress: "0x2222222222222222222222222222222222222222"
                })
            }),
            response,
            expect.any(Function)
        );
        expect(request.body.doctor).not.toBe(request.auth.walletAddress);
    });

    it("leaves the disabled create route unchanged", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const createRoute = getRoute(router, "/create", "post");

        expect(createRoute.stack).toHaveLength(1);
    });
});