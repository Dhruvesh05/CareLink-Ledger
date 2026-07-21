import { EthereumProvider } from "../blockchain/ethereum/EthereumProvider";

export class DoctorService {
  private blockchain = new EthereumProvider();

  async registerDoctor(
    fullNameHash: string,
    licenseHash: string,
    specialization: string,
    hospital: string
  ) {
    return await this.blockchain.registerDoctor(
      fullNameHash,
      licenseHash,
      specialization,
      hospital
    );
  }

  async verifyDoctor(wallet: string) {
    return await this.blockchain.verifyDoctor(wallet);
  }

  async getDoctor(wallet: string) {
    return await this.blockchain.getDoctor(wallet);
  }

  async isDoctorActive(wallet: string) {
    return await this.blockchain.isDoctorActive(wallet);
  }

  async isDoctorVerified(wallet: string) {
    return await this.blockchain.isDoctorVerified(wallet);
  }
}