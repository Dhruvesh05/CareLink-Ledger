import { ethers } from "ethers";

import {
    BlockchainRoleService
} from "./BlockchainRoleService";

import {
    BlockchainFactory
} from "../../blockchain/provider/BlockchainFactory";

export interface MedicalRecordPreflightResult {
    doctor: string;
    hospital: string;
    doctorActive: boolean;
    doctorVerified: boolean;
    hospitalActive: boolean;
    hospitalVerified: boolean;
}

export class MedicalRecordPreflightService {

    private readonly blockchainService =
        BlockchainFactory.getProvider();

    private readonly roleService:
        BlockchainRoleService;

    constructor(
        roleService: BlockchainRoleService =
            new BlockchainRoleService()
    ) {
        this.roleService = roleService;
    }

    async validateDoctor(
        doctorWallet: string
    ): Promise<MedicalRecordPreflightResult> {

        if (!ethers.isAddress(doctorWallet)) {
            throw new Error(
                "Invalid doctor wallet address"
            );
        }

        const doctor =
            ethers.getAddress(
                doctorWallet
            );

        const role =
            await this.roleService.getRole(
                doctor
            );

        if (role !== "Doctor") {
            throw new Error(
                "Wallet is not registered as a Doctor"
            );
        }

        const doctorActive =
            await this.blockchainService
                .isDoctorActive(
                    doctor
                );

        if (!doctorActive) {
            throw new Error(
                "Doctor is inactive"
            );
        }

        const doctorVerified =
            await this.blockchainService
                .isDoctorVerified(
                    doctor
                );

        if (!doctorVerified) {
            throw new Error(
                "Doctor is not verified"
            );
        }

        const hospital =
            await this.blockchainService
                .getDoctorHospital(
                    doctor
                );

        if (!hospital ||
            !ethers.isAddress(hospital)) {
            throw new Error(
                "Doctor is not associated with a valid hospital"
            );
        }

        const hospitalWallet =
            ethers.getAddress(
                hospital
            );

        const hospitalActive =
            await this.blockchainService
                .isHospitalActive(
                    hospitalWallet
                );

        if (!hospitalActive) {
            throw new Error(
                "Doctor's hospital is inactive"
            );
        }

        const hospitalVerified =
            await this.blockchainService
                .isHospitalVerified(
                    hospitalWallet
                );

        if (!hospitalVerified) {
            throw new Error(
                "Doctor's hospital is not verified"
            );
        }

        return {
            doctor,
            hospital: hospitalWallet,
            doctorActive: true,
            doctorVerified: true,
            hospitalActive: true,
            hospitalVerified: true
        };
    }
}
