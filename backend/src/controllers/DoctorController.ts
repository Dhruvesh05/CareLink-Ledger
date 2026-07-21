import { Request, Response } from "express";
import { DoctorService } from "../services/DoctorService";

const doctorService = new DoctorService();

export class DoctorController {

  /*
  ==========================================================
  Register Doctor
  ==========================================================
  */

  async register(req: Request, res: Response) {

    try {

      const {
        fullNameHash,
        licenseHash,
        specialization,
        hospital
      } = req.body;

      const receipt = await doctorService.registerDoctor(
        fullNameHash,
        licenseHash,
        specialization,
        hospital
      );

      return res.status(201).json({
        success: true,
        receipt
      });

    } catch (error: any) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
        reason: error.reason,
        code: error.code,
        shortMessage: error.shortMessage
      });

    }

  }

  /*
  ==========================================================
  Verify Doctor
  ==========================================================
  */

  async verifyDoctor(req: Request, res: Response) {

    try {

      const { wallet } = req.body;

      const receipt = await doctorService.verifyDoctor(wallet);

      return res.status(200).json({
        success: true,
        receipt
      });

    } catch (error: any) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
        reason: error.reason,
        code: error.code,
        shortMessage: error.shortMessage
      });

    }

  }

  /*
  ==========================================================
  Get Doctor
  ==========================================================
  */

  async getDoctor(req: Request, res: Response) {

    try {

      const doctor = await doctorService.getDoctor(
        req.params.wallet
      );

      return res.status(200).json({
        success: true,
        doctor
      });

    } catch (error: any) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
        reason: error.reason,
        code: error.code,
        shortMessage: error.shortMessage
      });

    }

  }

}