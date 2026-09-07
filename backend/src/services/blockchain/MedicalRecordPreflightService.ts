import { ethers } from "ethers";

import { BlockchainRoleService } from "./BlockchainRoleService";
import { env } from "../../config/env";

import DoctorRegistryABI from "../../blockchain/polygon/abi/DoctorRegistry.json";
import HospitalRegistryABI from "../../blockchain/polygon/abi/HospitalRegistry.json";

export interface MedicalRecordPreflightResult {
    doctor: string;
    hospital: string;
    doctorRole: "Doctor";
    doctorActive: true;
    doctorVerified: true;
    hospitalActive: true;
    hospitalVerified: true;
}

export class MedicalRecordPreflightService {

    private readonly provider: ethers.JsonRpcProvider;

    private readonly doctorRegistry: ethers.Contract;

    private readonly hospitalRegistry: ethers.Contract;

    private readonly roleService: BlockchainRoleService;

    constructor() {

        if (!env.POLYGON_RPC) {
            throw new Error(
                "Polygon RPC is not configured"
            );
        }

        if (!env.POLYGON_DOCTOR_REGISTRY_ADDRESS) {
            throw new Error(
                "Polygon DoctorRegistry contract address is not configured"
            );
        }

        if (!env.POLYGON_HOSPITAL_REGISTRY_ADDRESS) {
            throw new Error(
                "Polygon HospitalRegistry contract address is not configured"
            );
        }

        this.provider =
            new ethers.JsonRpcProvider(
                env.POLYGON_RPC
            );

        this.doctorRegistry =
            new ethers.Contract(
                env.POLYGON_DOCTOR_REGISTRY_ADDRESS,
                DoctorRegistryABI.abi,
                this.provider
            );

        this.hospitalRegistry =
            new ethers.Contract(
                env.POLYGON_HOSPITAL_REGISTRY_ADDRESS,
                HospitalRegistryABI.abi,
                this.provider
            );

        this.roleService =
            new BlockchainRoleService();
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
            ethers.getAddress(doctorWallet);

        const role =
            await this.roleService.getRole(doctor);

        if (role !== "Doctor") {
            throw new Error(
                "Authenticated wallet is not assigned the Doctor role"
            );
        }

        const doctorActive =
            await this.doctorRegistry.isDoctorActive(
                doctor
            );

        if (!doctorActive) {
            throw new Error(
                "Doctor account is inactive"
            );
        }

        const doctorVerified =
            await this.doctorRegistry.isDoctorVerified(
                doctor
            );

        if (!doctorVerified) {
            throw new Error(
                "Doctor account is not verified"
            );
        }

        const hospital =
            await this.doctorRegistry.getDoctorHospital(
                doctor
            );

        if (!hospital || hospital === ethers.ZeroAddress) {
            throw new Error(
                "Doctor is not associated with a valid hospital"
            );
        }

        const hospitalActive =
            await this.hospitalRegistry.isHospitalActive(
                hospital
            );

        if (!hospitalActive) {
            throw new Error(
                "Doctor's hospital is inactive"
            );
        }

        const hospitalVerified =
            await this.hospitalRegistry.isHospitalVerified(
                hospital
            );

        if (!hospitalVerified) {
            throw new Error(
                "Doctor's hospital is not verified"
            );
        }

        return {
            doctor,
            hospital: ethers.getAddress(hospital),
            doctorRole: "Doctor",
            doctorActive: true,
            doctorVerified: true,
            hospitalActive: true,
            hospitalVerified: true
        };
    }
}
