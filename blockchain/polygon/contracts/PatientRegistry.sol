// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "./AccessControl.sol";

/// @title IPatientRegistry
/// @notice Minimal external interface consumed by MedicalRecord and other
///         downstream contracts so they never need the full PatientRegistry
///         bytecode/ABI just to validate a patient.
interface IPatientRegistry {
    function isPatientActive(address wallet) external view returns (bool);
    function incrementRecordCount(address patient) external;
    function getRecordCount(address wallet) external view returns (uint256);
}

/// @title PatientRegistry
/// @notice Owns the patient identity domain for CareLink Ledger: registration,
///         profile metadata and record-count bookkeeping.
/// @dev Administrative authorization is fully delegated to AccessControl.
///      This contract never stores its own `owner` and never re-implements
///      role checks, per the single-responsibility design of the system.
contract PatientRegistry is IPatientRegistry {

    // ---------------------------------------------------------------------
    // TYPES
    // ---------------------------------------------------------------------

    struct Patient {
        uint256 patientId;
        address wallet;
        string fullNameHash;
        string dobHash;
        string bloodGroup;
        string gender;
        uint256 recordCount;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
    }

    // ---------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------

    /// @notice The AccessControl contract this registry defers to for admin
    ///         authorization.
    IAccessControl public immutable accessControl;

    /// @notice The only address permitted to call `incrementRecordCount`.
    ///         Set by an admin once MedicalRecord is deployed.
    address public medicalRecordContract;

    uint256 private _nextPatientId = 1;

    mapping(address => Patient) private _patients;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event PatientRegistered(uint256 indexed patientId, address indexed wallet, uint256 timestamp);
    event BloodGroupUpdated(address indexed patient, string newBloodGroup, uint256 timestamp);
    event PatientDeactivated(address indexed patient, uint256 timestamp);
    event PatientReactivated(address indexed patient, uint256 timestamp);
    event RecordCountIncremented(address indexed patient, uint256 totalRecords);
    event MedicalRecordContractUpdated(address indexed previous, address indexed current);

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error EmptyField();
    error PatientAlreadyExists();
    error PatientNotFound();
    error PatientInactive();
    error PatientAlreadyActive();
    error MedicalRecordContractNotSet();

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------

    modifier onlyAdmin() {
        if (!accessControl.isAdmin(msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyMedicalRecord() {
        if (medicalRecordContract == address(0)) revert MedicalRecordContractNotSet();
        if (msg.sender != medicalRecordContract) revert Unauthorized();
        _;
    }

    modifier patientRegistered(address wallet) {
        if (_patients[wallet].wallet == address(0)) revert PatientNotFound();
        _;
    }

    // ---------------------------------------------------------------------
    // CONSTRUCTOR
    // ---------------------------------------------------------------------

    /// @param accessControlAddress Deployed AccessControl contract address.
    constructor(address accessControlAddress) {
        if (accessControlAddress == address(0)) revert ZeroAddress();
        accessControl = IAccessControl(accessControlAddress);
    }

    // ---------------------------------------------------------------------
    // ADMIN FUNCTIONS
    // ---------------------------------------------------------------------

    /// @notice Points this registry at the MedicalRecord contract that is
    ///         authorized to increment patient record counts.
    /// @dev Only an admin (per AccessControl) may call this. Can be called
    ///      again to rotate to an upgraded MedicalRecord deployment.
    function setMedicalRecordContract(address contractAddress) external onlyAdmin {
        if (contractAddress == address(0)) revert ZeroAddress();
        address previous = medicalRecordContract;
        medicalRecordContract = contractAddress;
        emit MedicalRecordContractUpdated(previous, contractAddress);
    }

    /// @notice Reactivates a previously deactivated patient record.
    function reactivatePatient(address wallet)
        external
        onlyAdmin
        patientRegistered(wallet)
    {
        if (_patients[wallet].active) revert PatientAlreadyActive();

        _patients[wallet].active = true;
        _patients[wallet].updatedAt = block.timestamp;

        emit PatientReactivated(wallet, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // PATIENT SELF-SERVICE
    // ---------------------------------------------------------------------

    /// @notice Registers the caller as a patient.
    /// @dev Off-chain identity fields (name, date of birth) are stored only
    ///      as hashes; no PII is ever written on-chain.
    function registerPatient(
        string calldata fullNameHash,
        string calldata dobHash,
        string calldata bloodGroup,
        string calldata gender
    ) external {
        if (_patients[msg.sender].wallet != address(0)) revert PatientAlreadyExists();

        if (
            bytes(fullNameHash).length == 0 ||
            bytes(dobHash).length == 0 ||
            bytes(bloodGroup).length == 0 ||
            bytes(gender).length == 0
        ) revert EmptyField();

        uint256 patientId = _nextPatientId++;

        _patients[msg.sender] = Patient({
            patientId: patientId,
            wallet: msg.sender,
            fullNameHash: fullNameHash,
            dobHash: dobHash,
            bloodGroup: bloodGroup,
            gender: gender,
            recordCount: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        emit PatientRegistered(patientId, msg.sender, block.timestamp);
    }

    /// @notice Updates the caller's blood group.
    function updateBloodGroup(string calldata newBloodGroup)
        external
        patientRegistered(msg.sender)
    {
        if (!_patients[msg.sender].active) revert PatientInactive();
        if (bytes(newBloodGroup).length == 0) revert EmptyField();

        _patients[msg.sender].bloodGroup = newBloodGroup;
        _patients[msg.sender].updatedAt = block.timestamp;

        emit BloodGroupUpdated(msg.sender, newBloodGroup, block.timestamp);
    }

    /// @notice Soft-deactivates the caller's own patient profile.
    function deactivatePatient() external patientRegistered(msg.sender) {
        if (!_patients[msg.sender].active) revert PatientInactive();

        _patients[msg.sender].active = false;
        _patients[msg.sender].updatedAt = block.timestamp;

        emit PatientDeactivated(msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // MEDICAL RECORD INTEGRATION
    // ---------------------------------------------------------------------

    /// @inheritdoc IPatientRegistry
    /// @dev Only callable by the registered MedicalRecord contract. This is
    ///      the single write path MedicalRecord ever uses on this registry;
    ///      it never touches any other patient field directly.
    function incrementRecordCount(address patient)
        external
        override
        onlyMedicalRecord
        patientRegistered(patient)
    {
        if (!_patients[patient].active) revert PatientInactive();

        unchecked {
            _patients[patient].recordCount++;
        }

        emit RecordCountIncremented(patient, _patients[patient].recordCount);
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    function getPatient(address wallet)
        external
        view
        patientRegistered(wallet)
        returns (Patient memory)
    {
        return _patients[wallet];
    }

    /// @inheritdoc IPatientRegistry
    function isPatientActive(address wallet) external view override returns (bool) {
        return _patients[wallet].active;
    }

    /// @inheritdoc IPatientRegistry
    function getRecordCount(address wallet)
        external
        view
        override
        patientRegistered(wallet)
        returns (uint256)
    {
        return _patients[wallet].recordCount;
    }

    function totalPatients() external view returns (uint256) {
        return _nextPatientId - 1;
    }
}
