// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "./AccessControl.sol";

/// @title IAuditLog
/// @notice External interface consumed by MedicalRecord. Kept separate from
///         the contract so MedicalRecord only ever needs the ABI surface,
///         never AuditLog's full bytecode.
interface IAuditLog {
    /// @notice Every action type CareLink Ledger records an audit trail for.
    enum Action {
        CREATE_RECORD,
        UPDATE_RECORD,
        VIEW_RECORD,
        DOWNLOAD_RECORD,
        GRANT_ACCESS,
        REVOKE_ACCESS,
        DEACTIVATE_RECORD
    }

    function createAudit(
        uint256 recordId,
        address performer,
        Action action,
        string calldata details
    ) external returns (uint256 logId);
}

/// @title AuditLog
/// @notice Immutable, append-only activity trail for CareLink Ledger.
///         `MedicalRecord` stores WHAT happened to a record; `AuditLog`
///         stores WHO touched it, WHEN, and WHY — kept as a separate
///         contract so the two concerns never mix and so AuditLog can be
///         reused by future contracts without touching MedicalRecord.
/// @dev Only the registered MedicalRecord contract may write entries, so
///      audit history can never be forged by an arbitrary wallet. The
///      `performer` is passed in explicitly by the caller rather than
///      inferred from `msg.sender` (which, from AuditLog's point of view,
///      is always the MedicalRecord contract) or from `tx.origin` (an
///      unsafe pattern this contract deliberately avoids).
contract AuditLog is IAuditLog {

    // ---------------------------------------------------------------------
    // TYPES
    // ---------------------------------------------------------------------

    struct AuditEntry {
        uint256 logId;
        uint256 recordId;
        address performedBy;
        Action action;
        uint256 timestamp;
        string details;
    }

    // ---------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------

    /// @notice The AccessControl contract this log defers to for admin
    ///         authorization (e.g. rotating the authorized writer).
    IAccessControl public immutable accessControl;

    /// @notice The only address permitted to call `createAudit`. Set by an
    ///         admin after MedicalRecord is deployed (see deployment order
    ///         note on `setMedicalRecordContract`).
    address public medicalRecordContract;

    uint256 private _nextLogId = 1;

    mapping(uint256 => AuditEntry) private _auditLogs;
    mapping(uint256 => uint256[]) private _recordAuditLogs;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event AuditRecorded(
        uint256 indexed logId,
        uint256 indexed recordId,
        address indexed performedBy,
        Action action,
        uint256 timestamp
    );

    event MedicalRecordContractUpdated(address indexed previous, address indexed current);

    // ---------------------------------------------------------------------
    // CUSTOM ERRORS
    // ---------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error AuditNotFound();
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

    /// @notice Authorizes the MedicalRecord contract that is allowed to
    ///         write audit entries.
    /// @dev IMPORTANT DEPLOYMENT-ORDER NOTE: AuditLog must be deployed
    ///      BEFORE MedicalRecord (MedicalRecord's constructor takes the
    ///      AuditLog address as a dependency). This setter must then be
    ///      called with the freshly deployed MedicalRecord address BEFORE
    ///      any record is created — otherwise every MedicalRecord write
    ///      function will revert, since each one calls `createAudit`
    ///      unconditionally. See the deployment script for the full order.
    function setMedicalRecordContract(address contractAddress) external onlyAdmin {
        if (contractAddress == address(0)) revert ZeroAddress();
        address previous = medicalRecordContract;
        medicalRecordContract = contractAddress;
        emit MedicalRecordContractUpdated(previous, contractAddress);
    }

    // ---------------------------------------------------------------------
    // WRITE
    // ---------------------------------------------------------------------

    /// @inheritdoc IAuditLog
    function createAudit(
        uint256 recordId,
        address performer,
        Action action,
        string calldata details
    )
        external
        override
        onlyMedicalRecord
        returns (uint256 logId)
    {
        logId = _nextLogId++;

        _auditLogs[logId] = AuditEntry({
            logId: logId,
            recordId: recordId,
            performedBy: performer,
            action: action,
            timestamp: block.timestamp,
            details: details
        });

        _recordAuditLogs[recordId].push(logId);

        emit AuditRecorded(logId, recordId, performer, action, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------------------

    function getAudit(uint256 logId) external view returns (AuditEntry memory) {
        if (logId == 0 || logId >= _nextLogId) revert AuditNotFound();
        return _auditLogs[logId];
    }

    /// @notice Returns every audit log ID recorded against a given record,
    ///         in chronological order.
    function getRecordAuditLogs(uint256 recordId) external view returns (uint256[] memory) {
        return _recordAuditLogs[recordId];
    }

    function totalAuditLogs() external view returns (uint256) {
        return _nextLogId - 1;
    }
}
