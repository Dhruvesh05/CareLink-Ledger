import dotenv from "dotenv";
dotenv.config();

import AccessControlABI from "./abi/AccessControl.json";
import DoctorRegistryABI from "./abi/DoctorRegistry.json";
import HospitalRegistryABI from "./abi/HospitalRegistry.json";
import AuditLogABI from "./abi/AuditLog.json";
import MedicalRecordABI from "./abi/MedicalRecord.json";

import { ethers } from "ethers";

import PatientRegistryABI from "./abi/PatientRegistry.json";
import { CONTRACTS } from "./addresses";

import { IBlockchainProvider } from "../provider/IBlockchainProvider";

export class EthereumProvider implements IBlockchainProvider {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private accessControl: ethers.Contract;
  private patientRegistry: ethers.Contract;
  private doctorRegistry: ethers.Contract;
  private hospitalRegistry: ethers.Contract;
  private auditLog: ethers.Contract;
  private medicalRecord: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC;
    const privateKey = process.env.PRIVATE_KEY;

    if (!rpcUrl) {
      throw new Error("ETHEREUM_RPC is missing in .env");
    }

    if (!privateKey) {
      throw new Error("PRIVATE_KEY is missing in .env");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.accessControl = new ethers.Contract(
      CONTRACTS.ACCESS_CONTROL,
      AccessControlABI.abi,
      this.wallet
    );

    this.patientRegistry = new ethers.Contract(
      CONTRACTS.PATIENT_REGISTRY,
      PatientRegistryABI.abi,
      this.wallet
    );

    this.doctorRegistry = new ethers.Contract(
      CONTRACTS.DOCTOR_REGISTRY,
      DoctorRegistryABI.abi,
      this.wallet
    );

    this.hospitalRegistry = new ethers.Contract(
      CONTRACTS.HOSPITAL_REGISTRY,
      HospitalRegistryABI.abi,
      this.wallet
    );

    this.auditLog = new ethers.Contract(
      CONTRACTS.AUDIT_LOG,
      AuditLogABI.abi,
      this.wallet
    );

    this.medicalRecord = new ethers.Contract(
      CONTRACTS.MEDICAL_RECORD,
      MedicalRecordABI.abi,
      this.wallet
    );

    console.log("======================================");
    console.log("Ethereum Provider Initialized");
    console.log("RPC:", process.env.ETHEREUM_RPC);
    console.log("Wallet:", this.wallet.address);
    console.log("PatientRegistry:", CONTRACTS.PATIENT_REGISTRY);
    console.log("DoctorRegistry :", CONTRACTS.DOCTOR_REGISTRY);
    console.log("======================================");
  }

  /**
   * ------------------------------------------------------------
   * Patient
   * ------------------------------------------------------------
   */

  async registerPatient(
    fullNameHash: string,
    dobHash: string,
    bloodGroup: string,
    gender: string
  ) {
    const tx = await this.patientRegistry.registerPatient(
      fullNameHash,
      dobHash,
      bloodGroup,
      gender
    );

    return await tx.wait();
  }

  async getPatient(patientWallet: string) {
    const patient = await this.patientRegistry.getPatient(patientWallet);

    return {
      patientId: patient[0],
      wallet: patient[1],
      fullNameHash: patient[2],
      dobHash: patient[3],
      bloodGroup: patient[4],
      gender: patient[5],
      recordCount: patient[6],
      createdAt: patient[7],
      updatedAt: patient[8],
      active: patient[9]
    };
  }

  async isPatientActive(patientWallet: string) {
    return await this.patientRegistry.isPatientActive(patientWallet);
  }

  /**
   * ------------------------------------------------------------
   * Doctor
   * ------------------------------------------------------------
   */

  async registerDoctor(
    fullNameHash: string,
    licenseHash: string,
    specialization: string,
    hospital: string
  ) {
    const tx = await this.doctorRegistry.registerDoctor(
      fullNameHash,
      licenseHash,
      specialization,
      hospital
    );

    return await tx.wait();
  }

  async verifyDoctor(wallet: string) {
    const tx = await this.doctorRegistry.verifyDoctor(wallet);

    return await tx.wait();
  }

  async getDoctor(wallet: string) {
      const doctor = await this.doctorRegistry.getDoctor(wallet);

      return {
          doctorId: doctor[0].toString(),
          wallet: doctor[1],
          fullNameHash: doctor[2],
          licenseNumberHash: doctor[3],
          specialization: doctor[4],
          hospital: doctor[5],
          verified: doctor[6],
          active: doctor[7],
          createdAt: doctor[8].toString(),
          updatedAt: doctor[9].toString()
      };
  }

  async isDoctorActive(wallet: string) {
    return await this.doctorRegistry.isDoctorActive(wallet);
  }

  async isDoctorVerified(wallet: string) {
    return await this.doctorRegistry.isDoctorVerified(wallet);
  }

  /**
   * ------------------------------------------------------------
   * Hospital
   * ------------------------------------------------------------
   */

  async registerHospital(
    hospitalNameHash: string,
    registrationNumberHash: string,
    locationHash: string
  ) {
    const tx = await this.hospitalRegistry.registerHospital(
      hospitalNameHash,
      registrationNumberHash,
      locationHash
    );

    return await tx.wait();
  }

  async verifyHospital(wallet: string) {
    const tx = await this.hospitalRegistry.verifyHospital(wallet);

    return await tx.wait();
  }

  async getHospital(wallet: string) {
    const hospital = await this.hospitalRegistry.getHospital(wallet);

    return {
      hospitalId: hospital[0],
      wallet: hospital[1],
      hospitalNameHash: hospital[2],
      registrationNumberHash: hospital[3],
      locationHash: hospital[4],
      verified: hospital[5],
      active: hospital[6],
      createdAt: hospital[7],
      updatedAt: hospital[8]
    };
  }

  async isHospitalActive(wallet: string) {
    return await this.hospitalRegistry.isHospitalActive(wallet);
  }

  async isHospitalVerified(wallet: string) {
    return await this.hospitalRegistry.isHospitalVerified(wallet);
  }

  /**
   * ------------------------------------------------------------
   * Medical Record
   * ------------------------------------------------------------
   */

  async createMedicalRecord(
      patient: string,
      ipfsHash: string,
      fileHash: string,
      category: string,
      emergency: boolean
  ) {

      console.log("======================================");
      console.log("MEDICAL RECORD DIAGNOSTICS");
      console.log("======================================");

      console.log("Wallet:", this.wallet.address);

      console.log(
          "Role:",
          (
              await this.accessControl.getRole(
                  this.wallet.address
              )
          ).toString()
      );

      console.log(
          "Is Doctor:",
          await this.accessControl.isDoctor(
              this.wallet.address
          )
      );

      console.log(
          "Doctor Active:",
          await this.doctorRegistry.isDoctorActive(
              this.wallet.address
          )
      );

      console.log(
          "Doctor Verified:",
          await this.doctorRegistry.isDoctorVerified(
              this.wallet.address
          )
      );

      const hospital =
          await this.doctorRegistry.getDoctorHospital(
              this.wallet.address
          );

      console.log("Hospital:", hospital);

      console.log(
          "Hospital Active:",
          await this.hospitalRegistry.isHospitalActive(
              hospital
          )
      );

      console.log(
          "Hospital Verified:",
          await this.hospitalRegistry.isHospitalVerified(
              hospital
          )
      );

      console.log(
          "Patient Active:",
          await this.patientRegistry.isPatientActive(
              patient
          )
      );

      console.log(
          "MedicalRecord in AuditLog:",
          await this.auditLog.medicalRecordContract()
      );

      console.log("======================================");

      const tx =
          await this.medicalRecord.createMedicalRecord(
              patient,
              ipfsHash,
              fileHash,
              category,
              emergency
          );

      return await tx.wait();
  }

  async getMedicalRecord(recordId: number) {
    return await this.medicalRecord.getMedicalRecord(recordId);
  }

  async updateMedicalRecord(
    recordId: number,
    ipfsHash: string,
    fileHash: string,
    category: string,
    expectedVersion: number
  ) {
    const tx = await this.medicalRecord.updateMedicalRecord(
      recordId,
      ipfsHash,
      fileHash,
      category,
      expectedVersion
    );

    return await tx.wait();
  }

  async deactivateMedicalRecord(recordId: number) {
    const tx = await this.medicalRecord.deactivateMedicalRecord(recordId);

    return await tx.wait();
  }

  /**
   * ------------------------------------------------------------
   * Access
   * ------------------------------------------------------------
   */

  async grantAccess(recordId: number, doctor: string) {
    const tx = await this.medicalRecord.grantAccess(recordId, doctor);

    return await tx.wait();
  }

  async revokeAccess(recordId: number, doctor: string) {
    const tx = await this.medicalRecord.revokeAccess(recordId, doctor);

    return await tx.wait();
  }

  /**
   * ------------------------------------------------------------
   * Views
   * ------------------------------------------------------------
   */

  async getPatientRecords(patient: string) {
    return await this.medicalRecord.getPatientRecords(patient);
  }

  async getDoctorRecords(doctor: string) {
    return await this.medicalRecord.getDoctorRecords(doctor);
  }

  async getHospitalRecords(hospital: string) {
    return await this.medicalRecord.getHospitalRecords(hospital);
  }

  /**
   * ------------------------------------------------------------
   * Audit
   * ------------------------------------------------------------
   */

  async viewRecord(recordId: number) {
    const tx = await this.medicalRecord.viewRecord(recordId);

    await tx.wait();

    return await this.getMedicalRecord(recordId);
  }

  async logDownload(recordId: number) {
    const tx = await this.medicalRecord.logDownload(recordId);

    return await tx.wait();
  }

  /**
   * ------------------------------------------------------------
   * Utility
   * ------------------------------------------------------------
   */

  async recordExists(recordId: number) {
    return await this.medicalRecord.recordExists(recordId);
  }

  async totalRecords() {
    return await this.medicalRecord.totalRecords();
  }

  /**
   * ------------------------------------------------------------
   * TEMPORARY DIAGNOSTICS
   * ------------------------------------------------------------
   * These three methods exist only to isolate which dependency
   * contract is throwing `ResolverNotFound(bytes)` during
   * createMedicalRecord(). Remove once the root cause is found.
   */

  /** Test 1: AccessControl. Expect 2 (Doctor) or 4 (Admin) for a working wallet. */
  async getRole(address: string) {
    return await this.accessControl.getRole(address);
  }

  /** Test 2: DoctorRegistry. If this throws ResolverNotFound(bytes), DoctorRegistry is the problem. */
  async getDoctorHospital(address: string) {
    return await this.doctorRegistry.getDoctorHospital(address);
  }

  /** Test 3: AuditLog wiring. Expect this to equal the deployed MedicalRecord contract address. */
  async medicalRecordContract() {
    return await this.auditLog.medicalRecordContract();
  }
}