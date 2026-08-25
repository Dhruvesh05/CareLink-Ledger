// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "./AccessControl.sol";

/// @title IDoctorRegistry
/// @notice Minimal external interface consumed by MedicalRecord and other
///         downstream contracts so they never need the full DoctorRegistry
///         bytecode/ABI just to validate a doctor.
interface IDoctorRegistry {
    function isDoctorActive(address wallet) external view returns (bool);
    function isDoctorVerified(address wallet) external view returns (bool);
    function getDoctorHospital(address wallet) external view returns (address);
}

/// @title DoctorRegistry
/// @notice Owns the doctor identity and credentialing domain for CareLink
///         Ledger: self-registration plus admin-gated verification.
/// @dev Verification authority is fully delegated to AccessControl (Admin
///      role). This contract holds no authorization logic of its own.
contract DoctorRegistry is IDoctorRegistry {

    // ---------------------------------------------------------------------
    // TYPES
    // ---------------------------------------------------------------------

    struct Doctor {
        uint256 doctorId;
        address wallet;
        string fullNameHash;
        string licenseNumberHash;
        string specialization;
        address hospital;
        bool verified;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ---------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------

    IAccessControl public immutable accessControl;

    uint256 private _nextDoctorId = 1;

    mapping(address => Doctor) private _doctors;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event DoctorRegistered(uint256 indexed doctorId, address indexed wallet, address indexed hospital, uint256 timestamp);
    event DoctorVerified(address indexed wallet, uint256 timestamp);
    event DoctorVerificationRevoked(address indexed wallet, uint256 timestamp);
    event DoctorUpdated(address indexed wallet, uint256 timestamp);
    event DoctorDeactivated(address indexed wallet, uint256 timestamp);
    event DoctorReactivated(address indexed wallet, uint256 timestamp);

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error EmptyField();
    error DoctorAlreadyExists();
    error DoctorNotFound();
    error DoctorInactive();
    error DoctorAlreadyActive();
    error AlreadyVerified();
    error NotVerified();

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------

    modifier onlyAdmin() {
        if (!accessControl.isAdmin(msg.sender)) revert Unauthorized();
        _;
    }

    modifier doctorRegistered(address wallet) {
        if (_doctors[wallet].wallet == address(0)) revert DoctorNotFound();
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
    // REGISTRATION
    // ---------------------------------------------------------------------

    /// @notice Registers the caller as a doctor, pending admin verification.
    /// @dev `hospital` is the wallet address of the hospital the doctor
    ///      claims affiliation with; it is self-attested here and is
    ///      re-derived (not trusted) by MedicalRecord at record-creation
    ///      time via `getDoctorHospital`.
    function registerDoctor(
        string calldata fullNameHash,
        string calldata licenseNumberHash,
        string calldata specialization,
        address hospital
    ) external {
        if (_doctors[msg.sender].wallet != address(0)) revert DoctorAlreadyExists();
        if (hospital == address(0)) revert ZeroAddress();

        if (
            bytes(fullNameHash).length == 0 ||
            bytes(licenseNumberHash).length == 0 ||
            bytes(specialization).length == 0
        ) revert EmptyField();

        uint256 doctorId = _nextDoctorId++;

        _doctors[msg.sender] = Doctor({
            doctorId: doctorId,
            wallet: msg.sender,
            fullNameHash: fullNameHash,
            licenseNumberHash: licenseNumberHash,
            specialization: specialization,
            hospital: hospital,
            verified: false,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit DoctorRegistered(doctorId, msg.sender, hospital, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // ADMIN FUNCTIONS
    // ---------------------------------------------------------------------

    function verifyDoctor(address wallet) external onlyAdmin doctorRegistered(wallet) {
        if (_doctors[wallet].verified) revert AlreadyVerified();

        _doctors[wallet].verified = true;
        _doctors[wallet].updatedAt = block.timestamp;

        emit DoctorVerified(wallet, block.timestamp);
    }

    /// @notice Revokes a doctor's verification (e.g. license lapse, fraud).
    function revokeVerification(address wallet) external onlyAdmin doctorRegistered(wallet) {
        if (!_doctors[wallet].verified) revert NotVerified();

        _doctors[wallet].verified = false;
        _doctors[wallet].updatedAt = block.timestamp;

        emit DoctorVerificationRevoked(wallet, block.timestamp);
    }

    function reactivateDoctor(address wallet) external onlyAdmin doctorRegistered(wallet) {
        if (_doctors[wallet].active) revert DoctorAlreadyActive();

        _doctors[wallet].active = true;
        _doctors[wallet].updatedAt = block.timestamp;

        emit DoctorReactivated(wallet, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // DOCTOR SELF-SERVICE
    // ---------------------------------------------------------------------

    function updateSpecialization(string calldata specialization)
        external
        doctorRegistered(msg.sender)
    {
        if (!_doctors[msg.sender].active) revert DoctorInactive();
        if (bytes(specialization).length == 0) revert EmptyField();

        _doctors[msg.sender].specialization = specialization;
        _doctors[msg.sender].updatedAt = block.timestamp;

        emit DoctorUpdated(msg.sender, block.timestamp);
    }

    function deactivateDoctor() external doctorRegistered(msg.sender) {
        if (!_doctors[msg.sender].active) revert DoctorInactive();

        _doctors[msg.sender].active = false;
        _doctors[msg.sender].updatedAt = block.timestamp;

        emit DoctorDeactivated(msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    function getDoctor(address wallet)
        external
        view
        doctorRegistered(wallet)
        returns (Doctor memory)
    {
        return _doctors[wallet];
    }

    /// @inheritdoc IDoctorRegistry
    function isDoctorActive(address wallet) external view override returns (bool) {
        return _doctors[wallet].active;
    }

    /// @inheritdoc IDoctorRegistry
    function isDoctorVerified(address wallet) external view override returns (bool) {
        return _doctors[wallet].verified;
    }

    /// @inheritdoc IDoctorRegistry
    function getDoctorHospital(address wallet)
        external
        view
        override
        doctorRegistered(wallet)
        returns (address)
    {
        return _doctors[wallet].hospital;
    }

    function totalDoctors() external view returns (uint256) {
        return _nextDoctorId - 1;
    }
}
