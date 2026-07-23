import { ethereum } from "../config/ethereum";


export class DoctorRegistryContract {


    async registerDoctor(
        fullNameHash: string,
        licenseNumberHash: string,
        specialization: string,
        hospital: string
    ) {


        const tx =
            await ethereum.doctorRegistry.registerDoctor(
                fullNameHash,
                licenseNumberHash,
                specialization,
                hospital
            );


        return await tx.wait();

    }


    async getDoctor(
        wallet: string
    ) {


        return await ethereum.doctorRegistry.getDoctor(
            wallet
        );

    }


    async isDoctorActive(
        wallet: string
    ) {


        return await ethereum.doctorRegistry.isDoctorActive(
            wallet
        );

    }


    async isDoctorVerified(
        wallet: string
    ) {


        return await ethereum.doctorRegistry.isDoctorVerified(
            wallet
        );

    }


    async getDoctorHospital(
        wallet: string
    ) {


        return await ethereum.doctorRegistry.getDoctorHospital(
            wallet
        );

    }


    async verifyDoctor(
        wallet: string
    ) {


        const tx =
            await ethereum.doctorRegistry.verifyDoctor(
                wallet
            );


        return await tx.wait();

    }


    async revokeVerification(
        wallet: string
    ) {


        const tx =
            await ethereum.doctorRegistry.revokeVerification(
                wallet
            );


        return await tx.wait();

    }


    async deactivateDoctor() {


        const tx =
            await ethereum.doctorRegistry.deactivateDoctor();


        return await tx.wait();

    }


    async reactivateDoctor(
        wallet: string
    ) {


        const tx =
            await ethereum.doctorRegistry.reactivateDoctor(
                wallet
            );


        return await tx.wait();

    }


    async updateSpecialization(
        specialization: string
    ) {


        const tx =
            await ethereum.doctorRegistry.updateSpecialization(
                specialization
            );


        return await tx.wait();

    }


    async totalDoctors() {


        return await ethereum.doctorRegistry.totalDoctors();

    }


}