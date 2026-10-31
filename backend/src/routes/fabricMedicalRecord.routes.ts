import { Router } from "express";
import { getAddress } from "ethers";
import { authenticate, requireRole } from "../middleware/auth";
import upload, { requireFile } from "../middleware/upload.middleware";
import { FabricProvider } from "../blockchain/fabric/provider/FabricProvider";
import { BlockchainFactory } from "../blockchain/provider/BlockchainFactory";
import { IPFSServiceAdapter } from "../ipfs/adapters/IPFSServiceAdapter";
import { MedicalRecordService } from "../services/MedicalRecordService";
import { requireCareLinkRole } from "../ssi/middleware/carelinkAuthorization";

const router = Router();

// This API reads Fabric directly; it does not use the EVM network selector.
router.use(authenticate);

router.post(
    "/:recordId/content",
    requireCareLinkRole("Doctor", "Patient", "Hospital", "Admin"),
    async (req, res) => {
        try {
            const wallet = req.auth?.walletAddress?.trim();
            const role = req.careLinkAuth?.role;
            const recordId = String(req.params.recordId ?? "").trim();

            if (!wallet || !role) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication and SSI authorization are required."
                });
            }

            if (
                !recordId ||
                recordId.length > 256 ||
                /[\\/\u0000-\u001f\u007f]/.test(recordId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Fabric record ID."
                });
            }

            const record = await fabricProvider.getMedicalRecord(recordId);

            if (!record || typeof record !== "object") {
                return res.status(404).json({
                    success: false,
                    message: "Fabric medical record was not found."
                });
            }

            if (!asBoolean(readField(record, "active", "Active"))) {
                return res.status(404).json({
                    success: false,
                    message: "Fabric medical record is inactive."
                });
            }

            const identityMatches = (identity: unknown): boolean => {
                const value = asString(identity).trim().toLowerCase();
                const address = wallet.toLowerCase();

                return value === address ||
                    value === `ethereum_${address}` ||
                    value === `polygon_${address}`;
            };

            const patientId = readField(record, "patientId", "PatientID");
            const doctorId = readField(record, "doctorId", "DoctorID");
            const hospitalId = readField(record, "hospitalId", "HospitalID");

            let authorized =
                role === "Admin" ||
                (role === "Patient" && identityMatches(patientId)) ||
                (role === "Doctor" && identityMatches(doctorId)) ||
                (role === "Hospital" && identityMatches(hospitalId));

            // Preserve the existing EVM doctor-grant model for bridged records.
            if (!authorized && role === "Doctor") {
                const source = /^(ethereum|polygon)_(\d+)$/i.exec(recordId);

                if (source) {
                    const chainId =
                        source[1].toLowerCase() === "ethereum" ? 11155111 : 80002;

                    try {
                        const sourceProvider =
                            BlockchainFactory.getProviderForChainId(chainId);

                        authorized = await sourceProvider.isAuthorizedDoctor(
                            Number(source[2]),
                            wallet
                        );
                    } catch {
                        authorized = false;
                    }
                }
            }

            if (!authorized) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to access this medical record."
                });
            }

            // This method verifies the encrypted-file hash before decrypting.
            // Encryption metadata must match the exact CID and file hash.
            const result =
                await fabricContentService.getMedicalRecordContentFromLedgerRecord(record);

            const mimeType = String(
                result.mimeType ?? "application/octet-stream"
            ).split(";")[0].trim() || "application/octet-stream";

            const requestedInline =
                String(req.query.disposition ?? "attachment").toLowerCase() === "inline";

            const disposition =
                requestedInline && mimeType.toLowerCase() === "application/pdf"
                    ? "inline"
                    : "attachment";

            const originalName = String(
                result.fileName ?? `medical-record-${recordId}`
            );
            const safeName = originalName.replace(/[\/\\\r\n"]/g, "_");
            const encodedName = encodeURIComponent(originalName).replace(
                /['()]/g,
                character =>
                    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
            );

            res.setHeader("Content-Type", mimeType);
            res.setHeader(
                "Content-Disposition",
                `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodedName}`
            );
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "private, no-store");

            return res.status(200).send(result.content);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown error";

            console.error("[fabric-medical-records] Content read failed:", message);

            const status =
                message === "Unauthorized" ? 403 :
                message === "InactiveRecord" ? 404 :
                502;

            return res.status(status).json({
                success: false,
                message: status === 403
                    ? "You are not authorized to access this medical record."
                    : status === 404
                        ? "Fabric medical record is inactive."
                        : "Unable to retrieve the medical record content."
            });
        }
    }
);


const fabricProvider = new FabricProvider();
const fabricContentService = new MedicalRecordService(
    new IPFSServiceAdapter(),
    fabricProvider
);

function readField(
    record: Record<string, unknown>,
    ...names: string[]
): unknown {
    for (const name of names) {
        if (record[name] !== undefined && record[name] !== null) {
            return record[name];
        }
    }

    return undefined;
}

function asString(value: unknown): string {
    return value === undefined || value === null ? "" : String(value);
}

function asBoolean(value: unknown): boolean {
    return value === true || value === 1 || value === "true";
}

router.post(
    "/",
    upload.single("file"),
    requireCareLinkRole("Doctor"),
    requireRole("Doctor"),
    requireFile,
    async (req, res) => {
        try {
            const walletRaw = req.auth?.walletAddress?.trim();
            if (!walletRaw || req.careLinkAuth?.role !== "Doctor") {
                return res.status(401).json({
                    success: false,
                    message: "Authenticated Doctor identity and SSI authorization are required."
                });
            }

            const doctorWallet = getAddress(walletRaw);
            const patientWallet = getAddress(
                String(req.body.patient ?? "").trim()
            );
            const category = String(req.body.category ?? "").trim();
            const emergencyValue = String(
                req.body.emergency ?? "false"
            ).toLowerCase();

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Medical record category is required."
                });
            }

            if (!["true", "false"].includes(emergencyValue)) {
                return res.status(400).json({
                    success: false,
                    message: "Emergency must be true or false."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Medical record file is required."
                });
            }

            const identityCandidates = (rawValue: string): string[] => {
                const raw = rawValue.trim();
                const match =
                    /^(?:ethereum|polygon)_(0x[a-fA-F0-9]{40})$/i.exec(raw);
                const address = getAddress(match ? match[1] : raw);

                const candidates = match
                    ? [raw, `polygon_${address}`, `ethereum_${address}`, address]
                    : [`polygon_${address}`, `ethereum_${address}`, address];

                return [...new Set(candidates)];
            };

            const resolveIdentity = async (
                label: string,
                rawValue: string,
                lookup: (id: string) => Promise<any>
            ): Promise<{ id: string; record: any }> => {
                for (const id of identityCandidates(rawValue)) {
                    try {
                        const record = await lookup(id);
                        if (record) {
                            return { id, record };
                        }
                    } catch (lookupError) {
                        const message = String(
                            lookupError instanceof Error
                                ? lookupError.message
                                : lookupError
                        );

                        if (/does not exist|not found|not registered/i.test(message)) {
                            continue;
                        }

                        throw lookupError;
                    }
                }

                throw new Error(
                    `${label} identity is not registered in Fabric.`
                );
            };

            const patient = await resolveIdentity(
                "Patient",
                patientWallet,
                id => fabricProvider.getPatient(id)
            );

            const doctor = await resolveIdentity(
                "Doctor",
                doctorWallet,
                id => fabricProvider.getDoctor(id)
            );

            const hospitalValue = readField(
                doctor.record,
                "hospital",
                "Hospital",
                "hospitalId",
                "HospitalID",
                "hospitalWallet",
                "HospitalWallet"
            );

            if (
                typeof hospitalValue !== "string" ||
                !hospitalValue.trim()
            ) {
                throw new Error(
                    "The Doctor's linked hospital identity is missing from Fabric."
                );
            }

            const hospital = await resolveIdentity(
                "Hospital",
                hospitalValue,
                id => fabricProvider.getHospital(id)
            );

            if (!asBoolean(readField(patient.record, "active", "Active"))) {
                throw new Error("Patient is inactive in Fabric.");
            }
            if (!asBoolean(readField(doctor.record, "active", "Active"))) {
                throw new Error("Doctor is inactive in Fabric.");
            }
            if (!asBoolean(readField(hospital.record, "active", "Active"))) {
                throw new Error("Hospital is inactive in Fabric.");
            }

            const created = await fabricContentService.createFabricMedicalRecord({
                patientId: patient.id,
                patientWallet,
                doctorId: doctor.id,
                hospitalId: hospital.id,
                file: req.file,
                category,
                emergency: emergencyValue === "true"
            });

            return res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            const message = String(
                error instanceof Error ? error.message : error
            );
            console.error("[fabric-medical-record-upload] Failed:", message);

            const status =
                /invalid address|not registered|inactive|required|missing|not verified|must be/i
                    .test(message)
                    ? 400
                    : 500;

            return res.status(status).json({
                success: false,
                message
            });
        }
    }
);

router.get("/mine", async (req, res) => {
    try {
        const wallet = req.auth?.walletAddress;

        if (typeof wallet !== "string" || !wallet.trim()) {
            return res.status(401).json({
                success: false,
                message: "Authentication with a wallet address is required.",
            });
        }

        // Fabric compares PatientID strings exactly. EVM addresses may be
        // stored with EIP-55 checksum casing, so query raw, lowercase and
        // checksummed forms belonging to this authenticated wallet only.
        const walletVariants = new Set<string>([
            wallet,
            wallet.toLowerCase(),
        ]);

        try {
            walletVariants.add(getAddress(wallet));
        } catch {
            // Keep raw/lowercase candidates if the wallet isn't a valid EVM address.
        }

        const patientIds = [...new Set(
            [...walletVariants].flatMap((address) => [
                `ethereum_${address}`,
                `polygon_${address}`,
                address,
            ])
        )];

        const recordsById = new Map<string, Record<string, unknown>>();

        for (const patientId of patientIds) {
            const result = await fabricProvider.getPatientRecords(patientId);

            if (!Array.isArray(result)) {
                throw new Error("Fabric returned an unexpected patient-record response.");
            }

            for (const item of result) {
                if (!item || typeof item !== "object") {
                    continue;
                }

                const source = item as Record<string, unknown>;
                const id = asString(readField(source, "id", "ID"));

                if (!id) {
                    continue;
                }

                recordsById.set(id, {
                    id,
                    recordId: id,
                    patientId: asString(readField(source, "patientId", "PatientID")),
                    doctorId: asString(readField(source, "doctorId", "DoctorID")),
                    hospitalId: asString(readField(source, "hospitalId", "HospitalID")),
                    cid: asString(readField(source, "cid", "CID")),
                    fileHash: asString(readField(source, "fileHash", "FileHash")),
                    category: asString(readField(source, "category", "Category")),
                    emergency: asBoolean(readField(source, "emergency", "Emergency")),
                    version: Number(readField(source, "version", "Version") ?? 1),
                    createdAt: asString(readField(source, "createdAt", "CreatedAt")),
                    updatedAt: asString(readField(source, "updatedAt", "UpdatedAt")),
                    active: asBoolean(readField(source, "active", "Active")),
                    ledger: "Hyperledger Fabric",
                });
            }
        }

        return res.json({
            success: true,
            network: "Hyperledger Fabric",
            channel: process.env.FABRIC_CHANNEL || "carelinkchannel",
            records: [...recordsById.values()],
        });
    } catch (error) {
        console.error(
            "[fabric-medical-records] Read failed:",
            error instanceof Error ? error.message : String(error)
        );

        return res.status(502).json({
            success: false,
            message: "Unable to retrieve medical records from Hyperledger Fabric.",
        });
    }
});

export default router;
