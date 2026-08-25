// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IAccessControl
/// @notice Interface exposing role queries so dependent contracts never need
///         to duplicate authorization logic of their own.
interface IAccessControl {
    enum Role {
        None,
        Patient,
        Doctor,
        Hospital,
        Admin
    }

    function getRole(address account) external view returns (Role);
    function isAdmin(address account) external view returns (bool);
    function isDoctor(address account) external view returns (bool);
    function isHospital(address account) external view returns (bool);
    function isPatient(address account) external view returns (bool);
}

/// @title AccessControl
/// @notice Single source of truth for role-based access control across every
///         CareLink Ledger contract. PatientRegistry, DoctorRegistry,
///         HospitalRegistry and MedicalRecord all defer to this contract for
///         admin authorization instead of maintaining their own `owner`
///         state, satisfying the "no duplicated authorization logic"
///         requirement of the system design.
/// @dev The deploying address is granted the first Admin role. The contract
///      tracks the number of active admins so the last remaining admin can
///      never be revoked or downgraded, which would otherwise permanently
///      brick administration of the whole system.
contract AccessControl is IAccessControl {

    // ---------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------

    /// @notice The address that deployed this contract.
    address public immutable deployer;

    mapping(address => Role) private _roles;

    /// @dev Number of accounts currently holding the Admin role.
    uint256 private _adminCount;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event RoleAssigned(address indexed account, Role role);
    event RoleUpdated(address indexed account, Role oldRole, Role newRole);
    event RoleRevoked(address indexed account, Role previousRole);

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error AlreadyAssigned();
    error InvalidRole();
    error NoRoleAssigned();
    error CannotRevokeLastAdmin();

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------

    modifier onlyAdmin() {
        if (_roles[msg.sender] != Role.Admin) revert Unauthorized();
        _;
    }

    modifier onlyDoctor() {
        if (_roles[msg.sender] != Role.Doctor) revert Unauthorized();
        _;
    }

    modifier onlyHospital() {
        if (_roles[msg.sender] != Role.Hospital) revert Unauthorized();
        _;
    }

    modifier onlyPatient() {
        if (_roles[msg.sender] != Role.Patient) revert Unauthorized();
        _;
    }

    modifier notZeroAddress(address account) {
        if (account == address(0)) revert ZeroAddress();
        _;
    }

    // ---------------------------------------------------------------------
    // CONSTRUCTOR
    // ---------------------------------------------------------------------

    constructor() {
        deployer = msg.sender;
        _roles[msg.sender] = Role.Admin;
        _adminCount = 1;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    // ---------------------------------------------------------------------
    // ROLE MANAGEMENT
    // ---------------------------------------------------------------------

    /// @notice Assigns a role to an account that currently holds no role.
    /// @dev Use `updateRole` to change an existing assignment; this keeps
    ///      accidental re-assignment (and silent overwrite) impossible.
    function assignRole(address account, Role role)
        external
        onlyAdmin
        notZeroAddress(account)
    {
        if (role == Role.None) revert InvalidRole();
        if (_roles[account] != Role.None) revert AlreadyAssigned();

        _roles[account] = role;
        if (role == Role.Admin) {
            unchecked { _adminCount++; }
        }

        emit RoleAssigned(account, role);
    }

    /// @notice Changes the role of an account that already has a role.
    function updateRole(address account, Role newRole)
        external
        onlyAdmin
        notZeroAddress(account)
    {
        Role oldRole = _roles[account];
        if (oldRole == Role.None) revert NoRoleAssigned();
        if (newRole == Role.None) revert InvalidRole();

        if (oldRole == Role.Admin && newRole != Role.Admin) {
            if (_adminCount <= 1) revert CannotRevokeLastAdmin();
            unchecked { _adminCount--; }
        } else if (oldRole != Role.Admin && newRole == Role.Admin) {
            unchecked { _adminCount++; }
        }

        _roles[account] = newRole;
        emit RoleUpdated(account, oldRole, newRole);
    }

    /// @notice Revokes whatever role an account currently holds.
    function revokeRole(address account)
        external
        onlyAdmin
        notZeroAddress(account)
    {
        Role previousRole = _roles[account];
        if (previousRole == Role.None) revert NoRoleAssigned();

        if (previousRole == Role.Admin) {
            if (_adminCount <= 1) revert CannotRevokeLastAdmin();
            unchecked { _adminCount--; }
        }

        _roles[account] = Role.None;
        emit RoleRevoked(account, previousRole);
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    /// @inheritdoc IAccessControl
    function getRole(address account) external view override returns (Role) {
        return _roles[account];
    }

    /// @inheritdoc IAccessControl
    function isAdmin(address account) external view override returns (bool) {
        return _roles[account] == Role.Admin;
    }

    /// @inheritdoc IAccessControl
    function isDoctor(address account) external view override returns (bool) {
        return _roles[account] == Role.Doctor;
    }

    /// @inheritdoc IAccessControl
    function isHospital(address account) external view override returns (bool) {
        return _roles[account] == Role.Hospital;
    }

    /// @inheritdoc IAccessControl
    function isPatient(address account) external view override returns (bool) {
        return _roles[account] == Role.Patient;
    }

    /// @notice Number of accounts currently holding the Admin role.
    function adminCount() external view returns (uint256) {
        return _adminCount;
    }
}
