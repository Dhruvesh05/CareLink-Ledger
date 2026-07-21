import { IBlockchainProvider } from "../../provider/IBlockchainProvider";
import { EthereumPatientService } from "../services/EthereumPatientService";

export class EthereumProvider implements IBlockchainProvider {

    private patientService =
        new EthereumPatientService();

    async registerPatient(

        fullNameHash: string,

        dobHash: string,

        bloodGroup: string,

        gender: string

    ): Promise<any> {

        return await this.patientService.registerPatient(

            fullNameHash,

            dobHash,

            bloodGroup,

            gender

        );

    }

    async registerDoctor(): Promise<any> {
        throw new Error("Not implemented");
    }

    async registerHospital(): Promise<any> {
        throw new Error("Not implemented");
    }

    async createMedicalRecord(): Promise<any> {
        throw new Error("Not implemented");
    }

    async grantAccess(): Promise<any> {
        throw new Error("Not implemented");
    }

    async revokeAccess(): Promise<any> {
        throw new Error("Not implemented");
    }

}