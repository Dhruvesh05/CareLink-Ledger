// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "./AccessControl.sol";

/// @title IHospitalRegistry
/// @notice Minimal external interface consumed by MedicalRecord and other
///         downstream contracts so they never need the full HospitalRegistry
///         bytecode/ABI just to validate a hospital.
interface IHospitalRegistry {
    function isHospitalActive(address wallet) external view returns (bool);
    function isHospitalVerified(address wallet) external view returns (bool);
}

/// @title HospitalRegistry
/// @notice Owns the hospital identity and credentialing domain for CareLink
///         Ledger: self-registration plus admin-gated verification.
/// @dev Verification authority is fully delegated to AccessControl (Admin
///      role). This contract holds no authorization logic of its own.
contract HospitalRegistry is IHospitalRegistry {

    // ---------------------------------------------------------------------
    // TYPES
    // ---------------------------------------------------------------------

    struct Hospital {
        uint256 hospitalId;
        address wallet;
        string hospitalNameHash;
        string registrationNumberHash;
        string locationHash;
        bool verified;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ---------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------

    IAccessControl public immutable accessControl;

    uint256 private _nextHospitalId = 1;

    mapping(address => Hospital) private _hospitals;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event HospitalRegistered(uint256 indexed hospitalId, address indexed wallet, uint256 timestamp);
    event HospitalVerified(address indexed wallet, uint256 timestamp);
    event HospitalVerificationRevoked(address indexed wallet, uint256 timestamp);
    event HospitalUpdated(address indexed wallet, uint256 timestamp);
    event HospitalDeactivated(address indexed wallet, uint256 timestamp);
    event HospitalReactivated(address indexed wallet, uint256 timestamp);

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error EmptyField();
    error HospitalAlreadyExists();
    error HospitalNotFound();
    error HospitalInactive();
    error HospitalAlreadyActive();
    error AlreadyVerified();
    error NotVerified();

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------

    modifier onlyAdmin() {
        if (!accessControl.isAdmin(msg.sender)) revert Unauthorized();
        _;
    }

    modifier hospitalRegistered(address wallet) {
        if (_hospitals[wallet].wallet == address(0)) revert HospitalNotFound();
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

    function registerHospital(
        string calldata hospitalNameHash,
        string calldata registrationNumberHash,
        string calldata locationHash
    ) external {
        if (_hospitals[msg.sender].wallet != address(0)) revert HospitalAlreadyExists();

        if (
            bytes(hospitalNameHash).length == 0 ||
            bytes(registrationNumberHash).length == 0 ||
            bytes(locationHash).length == 0
        ) revert EmptyField();

        uint256 hospitalId = _nextHospitalId++;

        _hospitals[msg.sender] = Hospital({
            hospitalId: hospitalId,
            wallet: msg.sender,
            hospitalNameHash: hospitalNameHash,
            registrationNumberHash: registrationNumberHash,
            locationHash: locationHash,
            verified: false,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit HospitalRegistered(hospitalId, msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // ADMIN FUNCTIONS
    // ---------------------------------------------------------------------

    function verifyHospital(address wallet) external onlyAdmin hospitalRegistered(wallet) {
        if (_hospitals[wallet].verified) revert AlreadyVerified();

        _hospitals[wallet].verified = true;
        _hospitals[wallet].updatedAt = block.timestamp;

        emit HospitalVerified(wallet, block.timestamp);
    }

    /// @notice Revokes a hospital's verification (e.g. license lapse, fraud).
    function revokeVerification(address wallet) external onlyAdmin hospitalRegistered(wallet) {
        if (!_hospitals[wallet].verified) revert NotVerified();

        _hospitals[wallet].verified = false;
        _hospitals[wallet].updatedAt = block.timestamp;

        emit HospitalVerificationRevoked(wallet, block.timestamp);
    }

    function reactivateHospital(address wallet) external onlyAdmin hospitalRegistered(wallet) {
        if (_hospitals[wallet].active) revert HospitalAlreadyActive();

        _hospitals[wallet].active = true;
        _hospitals[wallet].updatedAt = block.timestamp;

        emit HospitalReactivated(wallet, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // HOSPITAL SELF-SERVICE
    // ---------------------------------------------------------------------

    function updateLocation(string calldata newLocationHash)
        external
        hospitalRegistered(msg.sender)
    {
        if (!_hospitals[msg.sender].active) revert HospitalInactive();
        if (bytes(newLocationHash).length == 0) revert EmptyField();

        _hospitals[msg.sender].locationHash = newLocationHash;
        _hospitals[msg.sender].updatedAt = block.timestamp;

        emit HospitalUpdated(msg.sender, block.timestamp);
    }

    function deactivateHospital() external hospitalRegistered(msg.sender) {
        if (!_hospitals[msg.sender].active) revert HospitalInactive();

        _hospitals[msg.sender].active = false;
        _hospitals[msg.sender].updatedAt = block.timestamp;

        emit HospitalDeactivated(msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    function getHospital(address wallet)
        external
        view
        hospitalRegistered(wallet)
        returns (Hospital memory)
    {
        return _hospitals[wallet];
    }

    /// @inheritdoc IHospitalRegistry
    function isHospitalActive(address wallet) external view override returns (bool) {
        return _hospitals[wallet].active;
    }

    /// @inheritdoc IHospitalRegistry
    function isHospitalVerified(address wallet) external view override returns (bool) {
        return _hospitals[wallet].verified;
    }

    function totalHospitals() external view returns (uint256) {
        return _nextHospitalId - 1;
    }
}
