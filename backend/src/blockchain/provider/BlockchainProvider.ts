export interface IBlockchainProvider {

    registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ): Promise<any>;

    registerDoctor(
        nameHash: string,
        specialization: string,
        licenseHash: string
    ): Promise<any>;

    registerHospital(
        nameHash: string,
        registrationHash: string
    ): Promise<any>;

    createMedicalRecord(
        patient: string,
        ipfsHash: string,
        encryptionKeyHash: string
    ): Promise<any>;

    grantAccess(
        patient: string,
        doctor: string
    ): Promise<any>;

    revokeAccess(
        patient: string,
        doctor: string
    ): Promise<any>;

}