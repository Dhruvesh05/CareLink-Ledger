export interface IBlockchainProvider {
    /*
    ==========================================================
    PATIENT
    ==========================================================
    */

    registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ): Promise<any>;

    getPatient(
        wallet: string
    ): Promise<any>;

    isPatientActive(
        wallet: string
    ): Promise<boolean>;

    updateBloodGroup(
        newBloodGroup: string
    ): Promise<any>;

    deactivatePatient(): Promise<any>;

    reactivatePatient(
        wallet: string
    ): Promise<any>;

    /*
    ==========================================================
    DOCTOR
    ==========================================================
    */

    registerDoctor(
        fullNameHash: string,
        licenseHash: string,
        specialization: string,
        hospital: string
    ): Promise<any>;

    getDoctor(
        wallet: string
    ): Promise<any>;

    isDoctorActive(
        wallet: string
    ): Promise<boolean>;

    isDoctorVerified(
        wallet: string
    ): Promise<boolean>;

    getDoctorHospital(
        wallet: string
    ): Promise<any>;

    verifyDoctor(
        wallet: string
    ): Promise<any>;

    revokeDoctorVerification(
        wallet: string
    ): Promise<any>;

    deactivateDoctor(): Promise<any>;

    reactivateDoctor(
        wallet: string
    ): Promise<any>;

    updateSpecialization(
        specialization: string
    ): Promise<any>;

    totalDoctors(): Promise<any>;

    /*
    ==========================================================
    HOSPITAL
    ==========================================================
    */

    registerHospital(
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ): Promise<any>;

    verifyHospital(
        wallet: string
    ): Promise<any>;

    revokeHospitalVerification(
        wallet: string
    ): Promise<any>;

    reactivateHospital(
        wallet: string
    ): Promise<any>;

    deactivateHospital(): Promise<any>;

    updateLocation(
        newLocationHash: string
    ): Promise<any>;

    getHospital(
        wallet: string
    ): Promise<any>;

    isHospitalActive(
        wallet: string
    ): Promise<boolean>;

    isHospitalVerified(
        wallet: string
    ): Promise<boolean>;

    totalHospitals(): Promise<any>;

    /*
    ==========================================================
    MEDICAL RECORD
    ==========================================================
    */

    createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ): Promise<any>;

    updateMedicalRecord(
        recordId: number,
        ipfsHash: string,
        fileHash: string,
        category: string,
        expectedVersion: number
    ): Promise<any>;

    deactivateMedicalRecord(
        recordId: number
    ): Promise<any>;

    grantAccess(
        recordId: number,
        doctor: string
    ): Promise<any>;

    revokeAccess(
        recordId: number,
        doctor: string
    ): Promise<any>;

    isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ): Promise<boolean>;

    viewRecord(
        recordId: number
    ): Promise<any>;

    logDownload(
        recordId: number
    ): Promise<any>;

    getMedicalRecord(
        recordId: number
    ): Promise<any>;

    getPatientRecords(
        patient: string
    ): Promise<any>;

    getDoctorRecords(
        doctor: string
    ): Promise<any>;

    getHospitalRecords(
        hospital: string
    ): Promise<any>;

    recordExists(
        recordId: number
    ): Promise<boolean>;

    totalRecords(): Promise<any>;

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

    getAudit(
        logId: number
    ): Promise<any>;

    getRecordAuditLogs(
        recordId: number
    ): Promise<any>;

    totalAuditLogs(): Promise<any>;
}