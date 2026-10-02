import {
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

const authenticate = jest.fn();
const requireRole = jest.fn((role: string) => {
    const middleware = jest.fn();
    Object.defineProperty(middleware, "name", {
        value: `requireRole:${role}`
    });
    return middleware;
});
const requireCareLinkRole = jest.fn((role: string) => {
    const middleware = jest.fn();
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

describe("medical record route SSI integration", () => {
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

    it("leaves confirm and the disabled create route unchanged", async () => {
        const { default: router } = await import("../../routes/medicalRecord.routes");
        const confirmRoute = getRoute(router, "/confirm", "post");
        const createRoute = getRoute(router, "/create", "post");

        expect(confirmRoute.stack).toHaveLength(2);
        expect(confirmRoute.stack[0].handle.name).toBe("requireRole:Doctor");
        expect(confirmRoute.stack[1].handle).toEqual(expect.any(Function));
        expect(confirmRoute.stack[1].handle.name).toBe(`bound ${mockConfirmMedicalRecord.name}`);
        expect(createRoute.stack).toHaveLength(1);
    });
});