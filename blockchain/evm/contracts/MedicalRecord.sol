// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPatientRegistry} from "./PatientRegistry.sol";
import {IDoctorRegistry} from "./DoctorRegistry.sol";
import {IHospitalRegistry} from "./HospitalRegistry.sol";
import {IAccessControl} from "./AccessControl.sol";
import {IAuditLog} from "./AuditLog.sol";

/// @title MedicalRecord
/// @notice Core contract of CareLink Ledger. Stores ONLY medical record
///         metadata (IPFS pointer + integrity hash + classification) and
///         never any binary file content. Depends on PatientRegistry,
///         DoctorRegistry, HospitalRegistry, AccessControl and AuditLog
///         through constructor-injected interfaces so no registry data is
///         ever duplicated here.
/// @dev Validation is delegated outward to the four registry/access
///      dependencies; every sensitive write is mirrored to AuditLog so it
///      can never be forged by an arbitrary wallet. Because AuditLog is
///      called unconditionally (not best-effort), `AuditLog.setMedicalRecordContract`
///      MUST be pointed at this contract's address before any write
///      function is used — see the deployment order note on that function.
contract MedicalRecord {

    // ---------------------------------------------------------------------
    // TYPES
    // ---------------------------------------------------------------------

    /// @dev Packed on-chain representation. Field ordering is chosen so the
    ///      compiler packs (address + bool + bool), (address + uint32) and
    ///      (address + uint40 + uint40) into single 32-byte storage slots,
    ///      instead of one slot per field. `recordId` is intentionally NOT
    ///      stored here — it is always the mapping key, so persisting it a
    ///      second time would waste an entire storage slot per record.
    struct StoredRecord {
        address patient;
        bool active;
        bool emergency;
        address doctor;
        uint32 version;
        address hospital;
        uint40 createdAt;
        uint40 updatedAt;
        string ipfsHash;
        string fileHash;
        string category;
    }

    /// @notice Full public view of a record, matching the fields required by
    ///         the CareLink Ledger data model. Assembled on read from
    ///         `StoredRecord` plus the mapping key.
    struct MedicalRecordView {
        uint256 recordId;
        address patient;
        address doctor;
        address hospital;
        string ipfsHash;
        string fileHash;
        string category;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 version;
        bool active;
        bool emergency;
    }

    // ---------------------------------------------------------------------
    // DEPENDENCIES (constructor-injected, immutable)
    // ---------------------------------------------------------------------

    IPatientRegistry public immutable patientRegistry;
    IDoctorRegistry public immutable doctorRegistry;
    IHospitalRegistry public immutable hospitalRegistry;
    IAccessControl public immutable accessControl;
    IAuditLog public immutable auditLog;

    // ---------------------------------------------------------------------
    // STORAGE
    // ---------------------------------------------------------------------

    uint256 private _nextRecordId = 1;

    mapping(uint256 => StoredRecord) private _records;

    mapping(address => uint256[]) private _patientRecordIds;
    mapping(address => uint256[]) private _doctorRecordIds;
    mapping(address => uint256[]) private _hospitalRecordIds;

    /// @dev Prevents the same doctor from submitting an identical file hash
    ///      for the same patient twice (accidental double-submit or replay).
    mapping(bytes32 => bool) private _fileHashUsed;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event RecordCreated(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor,
        address hospital,
        string category,
        uint256 timestamp
    );

    event EmergencyRecordCreated(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    event RecordUpdated(
        uint256 indexed recordId,
        uint256 newVersion,
        uint256 timestamp
    );

    event MetadataUpdated(
        uint256 indexed recordId,
        string ipfsHash,
        string fileHash,
        string category
    );

    event RecordDeactivated(
        uint256 indexed recordId,
        address indexed actor,
        uint256 timestamp
    );

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();

    error InvalidPatient();
    error PatientInactive();

    error InvalidDoctor();
    error DoctorInactive();
    error DoctorNotVerified();

    error InvalidHospital();
    error HospitalInactive();
    error HospitalNotVerified();

    error RecordNotFound();
    error InactiveRecord();
    error AlreadyInactive();

    error EmptyIPFSHash();
    error EmptyFileHash();
    error InvalidCategory();
    error VersionMismatch();
    error DuplicateRecord();

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------

    modifier existingRecord(uint256 recordId) {
        if (_records[recordId].patient == address(0)) revert RecordNotFound();
        _;
    }

    // ---------------------------------------------------------------------
    // CONSTRUCTOR
    // ---------------------------------------------------------------------

    /// @param patientRegistryAddress Deployed PatientRegistry address.
    /// @param doctorRegistryAddress Deployed DoctorRegistry address.
    /// @param hospitalRegistryAddress Deployed HospitalRegistry address.
    /// @param accessControlAddress Deployed AccessControl address.
    /// @param auditLogAddress Deployed AuditLog address. Must have this
    ///        contract's (soon-to-be-deployed) address registered via
    ///        `AuditLog.setMedicalRecordContract` before any write function
    ///        below is called, or every write will revert.
    constructor(
        address patientRegistryAddress,
        address doctorRegistryAddress,
        address hospitalRegistryAddress,
        address accessControlAddress,
        address auditLogAddress
    ) {
        if (
            patientRegistryAddress == address(0) ||
            doctorRegistryAddress == address(0) ||
            hospitalRegistryAddress == address(0) ||
            accessControlAddress == address(0) ||
            auditLogAddress == address(0)
        ) revert ZeroAddress();

        patientRegistry = IPatientRegistry(patientRegistryAddress);
        doctorRegistry = IDoctorRegistry(doctorRegistryAddress);
        hospitalRegistry = IHospitalRegistry(hospitalRegistryAddress);
        accessControl = IAccessControl(accessControlAddress);
        auditLog = IAuditLog(auditLogAddress);
    }

    // ---------------------------------------------------------------------
    // RECORD LIFECYCLE
    // ---------------------------------------------------------------------

    /// @notice Creates a new medical record.
    /// @dev The caller must be an active, verified doctor (per AccessControl
    ///      and DoctorRegistry). The originating hospital is derived from
    ///      DoctorRegistry rather than trusted as caller input, so a doctor
    ///      can never attribute a record to a hospital they are not
    ///      affiliated with. Follows checks-effects-interactions: all
    ///      validation happens before any state write; the two external
    ///      interactions (patient record-count increment, audit log entry)
    ///      happen last.
    function createMedicalRecord(
        address patient,
        string calldata ipfsHash,
        string calldata fileHash,
        string calldata category,
        bool emergency
    ) external returns (uint256 recordId) {
        // ---- Checks ----
        address doctor = msg.sender;

        if (!accessControl.isDoctor(doctor)) revert Unauthorized();

        _validateDoctor(doctor);
        _validatePatient(patient);
        _validateHashes(ipfsHash, fileHash);
        _validateCategory(category);

        address hospital = doctorRegistry.getDoctorHospital(doctor);
        _validateHospital(hospital);

        bytes32 dedupeKey = keccak256(abi.encodePacked(patient, fileHash));
        if (_fileHashUsed[dedupeKey]) revert DuplicateRecord();

        // ---- Effects ----
        recordId = _nextRecordId++;

        _records[recordId] = StoredRecord({
            patient: patient,
            active: true,
            emergency: emergency,
            doctor: doctor,
            version: 1,
            hospital: hospital,
            createdAt: uint40(block.timestamp),
            updatedAt: uint40(block.timestamp),
            ipfsHash: ipfsHash,
            fileHash: fileHash,
            category: category
        });

        _fileHashUsed[dedupeKey] = true;

        _patientRecordIds[patient].push(recordId);
        _doctorRecordIds[doctor].push(recordId);
        _hospitalRecordIds[hospital].push(recordId);

        emit RecordCreated(recordId, patient, doctor, hospital, category, block.timestamp);
        if (emergency) {
            emit EmergencyRecordCreated(recordId, patient, doctor, block.timestamp);
        }

        // ---- Interactions ----
        patientRegistry.incrementRecordCount(patient);
        auditLog.createAudit(recordId, doctor, IAuditLog.Action.CREATE_RECORD, "Medical record created");
    }

    /// @notice Updates the mutable metadata of an existing record.
    /// @dev Only the doctor who created the record may update it, and only
    ///      while still active and verified. Identity fields (patient,
    ///      doctor, hospital, createdAt, emergency flag) are immutable after
    ///      creation and cannot be overwritten by this function.
    function updateMedicalRecord(
        uint256 recordId,
        string calldata newIpfsHash,
        string calldata newFileHash,
        string calldata newCategory,
        uint256 expectedVersion
    ) external existingRecord(recordId) {
        StoredRecord storage record = _records[recordId];

        if (!record.active) revert InactiveRecord();
        if (msg.sender != record.doctor) revert Unauthorized();
        if (expectedVersion != record.version) revert VersionMismatch();

        _validateDoctor(msg.sender);
        _validateHashes(newIpfsHash, newFileHash);
        _validateCategory(newCategory);

        bytes32 dedupeKey = keccak256(abi.encodePacked(record.patient, newFileHash));
        bytes32 oldDedupeKey = keccak256(abi.encodePacked(record.patient, record.fileHash));
        if (dedupeKey != oldDedupeKey && _fileHashUsed[dedupeKey]) revert DuplicateRecord();

        record.ipfsHash = newIpfsHash;
        record.fileHash = newFileHash;
        record.category = newCategory;
        record.version += 1;
        record.updatedAt = uint40(block.timestamp);

        if (dedupeKey != oldDedupeKey) {
            _fileHashUsed[oldDedupeKey] = false;
            _fileHashUsed[dedupeKey] = true;
        }

        emit RecordUpdated(recordId, record.version, block.timestamp);
        emit MetadataUpdated(recordId, newIpfsHash, newFileHash, newCategory);

        auditLog.createAudit(recordId, msg.sender, IAuditLog.Action.UPDATE_RECORD, "Medical record metadata updated");
    }

    /// @notice Soft-deletes a record. The record and its history remain
    ///         queryable; only the `active` flag flips to false.
    /// @dev Callable by the creating doctor or an admin.
    function deactivateMedicalRecord(uint256 recordId) external existingRecord(recordId) {
        StoredRecord storage record = _records[recordId];

        if (!record.active) revert AlreadyInactive();

        bool isOwningDoctor = msg.sender == record.doctor;
        bool isAdminCaller = accessControl.isAdmin(msg.sender);
        if (!isOwningDoctor && !isAdminCaller) revert Unauthorized();

        record.active = false;
        record.updatedAt = uint40(block.timestamp);

        emit RecordDeactivated(recordId, msg.sender, block.timestamp);

        auditLog.createAudit(recordId, msg.sender, IAuditLog.Action.DEACTIVATE_RECORD, "Medical record deactivated");
    }

    // ---------------------------------------------------------------------
    // READ ACCESS
    // ---------------------------------------------------------------------

    /// @notice Free, non-logging read of a record's metadata. Subject to the
    ///         same access rules as `viewRecord`: the owning patient, the
    ///         creating doctor, the originating hospital, or an admin.
    /// @dev Use this for cheap off-chain reads (dashboards, list views)
    ///      where an on-chain access trail isn't required. Being a `view`
    ///      function it can never write to AuditLog.
    function getMedicalRecord(uint256 recordId)
        external
        view
        existingRecord(recordId)
        returns (MedicalRecordView memory)
    {
        StoredRecord storage record = _records[recordId];
        _authorizeRead(record);
        return _toView(recordId, record);
    }

    /// @notice Same access rules and return value as `getMedicalRecord`, but
    ///         also writes a VIEW_RECORD entry to AuditLog.
    /// @dev Not a `view` function (it performs a state-changing external
    ///      call), so it costs gas and requires a transaction rather than a
    ///      free `eth_call`. Use this path when the access itself needs to
    ///      be part of the tamper-evident history — e.g. a hospital
    ///      compliance officer opening a record, or any access that may
    ///      later need to be demonstrated to an auditor or regulator.
    function viewRecord(uint256 recordId)
        external
        existingRecord(recordId)
        returns (MedicalRecordView memory)
    {
        StoredRecord storage record = _records[recordId];
        _authorizeRead(record);

        auditLog.createAudit(recordId, msg.sender, IAuditLog.Action.VIEW_RECORD, "Record viewed");

        return _toView(recordId, record);
    }

    /// @notice Returns the record IDs belonging to a patient. Callable by
    ///         the patient themselves or an admin.
    function getPatientRecords(address patient) external view returns (uint256[] memory) {
        if (msg.sender != patient && !accessControl.isAdmin(msg.sender)) revert Unauthorized();
        return _patientRecordIds[patient];
    }

    /// @notice Returns the record IDs created by a doctor. Callable by the
    ///         doctor themselves or an admin.
    function getDoctorRecords(address doctor) external view returns (uint256[] memory) {
        if (msg.sender != doctor && !accessControl.isAdmin(msg.sender)) revert Unauthorized();
        return _doctorRecordIds[doctor];
    }

    /// @notice Returns the record IDs originating from a hospital. Callable
    ///         by the hospital itself or an admin.
    function getHospitalRecords(address hospital) external view returns (uint256[] memory) {
        if (msg.sender != hospital && !accessControl.isAdmin(msg.sender)) revert Unauthorized();
        return _hospitalRecordIds[hospital];
    }

    /// @notice Returns whether a given record ID has ever been created.
    function recordExists(uint256 recordId) external view returns (bool) {
        return _records[recordId].patient != address(0);
    }

    // ---------------------------------------------------------------------
    // INTERNAL VALIDATION HELPERS
    // ---------------------------------------------------------------------

    function _validatePatient(address patient) internal view {
        if (patient == address(0)) revert InvalidPatient();
        if (!patientRegistry.isPatientActive(patient)) revert PatientInactive();
    }

    function _validateDoctor(address doctor) internal view {
        if (doctor == address(0)) revert InvalidDoctor();
        if (!doctorRegistry.isDoctorActive(doctor)) revert DoctorInactive();
        if (!doctorRegistry.isDoctorVerified(doctor)) revert DoctorNotVerified();
    }

    function _validateHospital(address hospital) internal view {
        if (hospital == address(0)) revert InvalidHospital();
        if (!hospitalRegistry.isHospitalActive(hospital)) revert HospitalInactive();
        if (!hospitalRegistry.isHospitalVerified(hospital)) revert HospitalNotVerified();
    }

    function _validateCategory(string calldata category) internal pure {
        if (bytes(category).length == 0) revert InvalidCategory();
    }

    function _validateHashes(string calldata ipfsHash, string calldata fileHash) internal pure {
        if (bytes(ipfsHash).length == 0) revert EmptyIPFSHash();
        if (bytes(fileHash).length == 0) revert EmptyFileHash();
    }

    /// @dev Read-access gate shared by every record-retrieval path.
    function _authorizeRead(StoredRecord storage record) internal view {
        bool isPatientOwner = msg.sender == record.patient;
        bool isTreatingDoctor = msg.sender == record.doctor;
        bool isOriginatingHospital = msg.sender == record.hospital;
        bool isAdminCaller = accessControl.isAdmin(msg.sender);

        if (!isPatientOwner && !isTreatingDoctor && !isOriginatingHospital && !isAdminCaller) {
            revert Unauthorized();
        }
    }

    function _toView(uint256 recordId, StoredRecord storage record)
        internal
        view
        returns (MedicalRecordView memory)
    {
        return MedicalRecordView({
            recordId: recordId,
            patient: record.patient,
            doctor: record.doctor,
            hospital: record.hospital,
            ipfsHash: record.ipfsHash,
            fileHash: record.fileHash,
            category: record.category,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            version: record.version,
            active: record.active,
            emergency: record.emergency
        });
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    function totalRecords() external view returns (uint256) {
        return _nextRecordId - 1;
    }
}
