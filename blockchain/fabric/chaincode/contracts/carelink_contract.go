package contracts

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dhruvesh05/CareLink-Ledger/blockchain/fabric/chaincode/internal/models"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type CareLinkContract struct {
	contractapi.Contract
}

func patientKey(id string) string {
	return "PATIENT_" + id
}

func (c *CareLinkContract) RegisterPatient(
	ctx contractapi.TransactionContextInterface,
	id string,
	name string,
	dateOfBirth string,
	gender string,
	wallet string,
) error {

	if id == "" {
		return fmt.Errorf("patient id is required")
	}

	if name == "" {
		return fmt.Errorf("patient name is required")
	}

	if wallet == "" {
		return fmt.Errorf("patient wallet is required")
	}

	key := patientKey(id)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check patient: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("patient %s already exists", id)
	}

	patient := models.Patient{
		ID:          id,
		Name:        name,
		DateOfBirth: dateOfBirth,
		Gender:      gender,
		Wallet:      wallet,
		Active:      true,
	}

	data, err := json.Marshal(patient)
	if err != nil {
		return fmt.Errorf("failed to serialize patient: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store patient: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetPatient(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.Patient, error) {

	if id == "" {
		return nil, fmt.Errorf("patient id is required")
	}

	data, err := ctx.GetStub().GetState(patientKey(id))
	if err != nil {
		return nil, fmt.Errorf("failed to read patient: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("patient %s does not exist", id)
	}

	var patient models.Patient

	if err := json.Unmarshal(data, &patient); err != nil {
		return nil, fmt.Errorf("failed to deserialize patient: %w", err)
	}

	return &patient, nil
}

func (c *CareLinkContract) IsPatientActive(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {

	patient, err := c.GetPatient(ctx, id)
	if err != nil {
		return false, err
	}

	return patient.Active, nil
}

func (c *CareLinkContract) DeactivatePatient(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	patient, err := c.GetPatient(ctx, id)
	if err != nil {
		return err
	}

	if !patient.Active {
		return fmt.Errorf("patient %s is already inactive", id)
	}

	patient.Active = false

	data, err := json.Marshal(patient)
	if err != nil {
		return fmt.Errorf("failed to serialize patient: %w", err)
	}

	if err := ctx.GetStub().PutState(patientKey(id), data); err != nil {
		return fmt.Errorf("failed to update patient: %w", err)
	}

	return nil
}

func (c *CareLinkContract) ReactivatePatient(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	patient, err := c.GetPatient(ctx, id)
	if err != nil {
		return err
	}

	if patient.Active {
		return fmt.Errorf("patient %s is already active", id)
	}

	patient.Active = true

	data, err := json.Marshal(patient)
	if err != nil {
		return fmt.Errorf("failed to serialize patient: %w", err)
	}

	if err := ctx.GetStub().PutState(patientKey(id), data); err != nil {
		return fmt.Errorf("failed to update patient: %w", err)
	}

	return nil
}

func doctorKey(id string) string {
	return "DOCTOR_" + id
}

func hospitalKey(id string) string {
	return "HOSPITAL_" + id
}

func (c *CareLinkContract) RegisterDoctor(
	ctx contractapi.TransactionContextInterface,
	id string,
	name string,
	specialization string,
	hospitalID string,
	wallet string,
) error {

	if id == "" {
		return fmt.Errorf("doctor id is required")
	}
	if name == "" {
		return fmt.Errorf("doctor name is required")
	}
	if wallet == "" {
		return fmt.Errorf("doctor wallet is required")
	}

	key := doctorKey(id)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check doctor: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("doctor %s already exists", id)
	}

	if hospitalID != "" {
		hospital, err := c.GetHospital(ctx, hospitalID)
		if err != nil {
			return fmt.Errorf("hospital validation failed: %w", err)
		}

		if !hospital.Active {
			return fmt.Errorf("hospital %s is inactive", hospitalID)
		}
	}

	doctor := models.Doctor{
		ID:             id,
		Name:           name,
		Specialization: specialization,
		HospitalID:     hospitalID,
		Wallet:         wallet,
		Active:         true,
	}

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store doctor: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetDoctor(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.Doctor, error) {

	if id == "" {
		return nil, fmt.Errorf("doctor id is required")
	}

	data, err := ctx.GetStub().GetState(doctorKey(id))
	if err != nil {
		return nil, fmt.Errorf("failed to read doctor: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("doctor %s does not exist", id)
	}

	var doctor models.Doctor

	if err := json.Unmarshal(data, &doctor); err != nil {
		return nil, fmt.Errorf("failed to deserialize doctor: %w", err)
	}

	return &doctor, nil
}

func (c *CareLinkContract) IsDoctorActive(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {

	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return false, err
	}

	return doctor.Active, nil
}

func (c *CareLinkContract) DeactivateDoctor(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return err
	}

	if !doctor.Active {
		return fmt.Errorf("doctor %s is already inactive", id)
	}

	doctor.Active = false

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(doctorKey(id), data); err != nil {
		return fmt.Errorf("failed to update doctor: %w", err)
	}

	return nil
}

func (c *CareLinkContract) ReactivateDoctor(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return err
	}

	if doctor.Active {
		return fmt.Errorf("doctor %s is already active", id)
	}

	doctor.Active = true

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(doctorKey(id), data); err != nil {
		return fmt.Errorf("failed to update doctor: %w", err)
	}

	return nil
}

func (c *CareLinkContract) RegisterHospital(
	ctx contractapi.TransactionContextInterface,
	id string,
	name string,
	address string,
	wallet string,
) error {

	if id == "" {
		return fmt.Errorf("hospital id is required")
	}
	if name == "" {
		return fmt.Errorf("hospital name is required")
	}
	if wallet == "" {
		return fmt.Errorf("hospital wallet is required")
	}

	key := hospitalKey(id)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check hospital: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("hospital %s already exists", id)
	}

	hospital := models.Hospital{
		ID:      id,
		Name:    name,
		Address: address,
		Wallet:  wallet,
		Active:  true,
	}

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store hospital: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetHospital(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.Hospital, error) {

	if id == "" {
		return nil, fmt.Errorf("hospital id is required")
	}

	data, err := ctx.GetStub().GetState(hospitalKey(id))
	if err != nil {
		return nil, fmt.Errorf("failed to read hospital: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("hospital %s does not exist", id)
	}

	var hospital models.Hospital

	if err := json.Unmarshal(data, &hospital); err != nil {
		return nil, fmt.Errorf("failed to deserialize hospital: %w", err)
	}

	return &hospital, nil
}

func (c *CareLinkContract) IsHospitalActive(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {

	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return false, err
	}

	return hospital.Active, nil
}

func (c *CareLinkContract) DeactivateHospital(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return err
	}

	if !hospital.Active {
		return fmt.Errorf("hospital %s is already inactive", id)
	}

	hospital.Active = false

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(hospitalKey(id), data); err != nil {
		return fmt.Errorf("failed to update hospital: %w", err)
	}

	return nil
}

func (c *CareLinkContract) ReactivateHospital(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {

	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return err
	}

	if hospital.Active {
		return fmt.Errorf("hospital %s is already active", id)
	}

	hospital.Active = true

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(hospitalKey(id), data); err != nil {
		return fmt.Errorf("failed to update hospital: %w", err)
	}

	return nil
}

func medicalRecordKey(id string) string {
	return "RECORD_" + id
}

func accessKey(patientID string, granteeID string) string {
	return "ACCESS_" + patientID + "_" + granteeID
}

func auditKey(id string) string {
	return "AUDIT_" + id
}

func (c *CareLinkContract) CreateMedicalRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
	patientID string,
	doctorID string,
	hospitalID string,
	cid string,
	fileHash string,
	category string,
	emergency bool,
) error {

	if id == "" {
		return fmt.Errorf("record id is required")
	}
	if patientID == "" {
		return fmt.Errorf("patient id is required")
	}
	if cid == "" {
		return fmt.Errorf("record CID is required")
	}
	if fileHash == "" {
		return fmt.Errorf("record file hash is required")
	}
	if category == "" {
		return fmt.Errorf("record category is required")
	}

	existing, err := ctx.GetStub().GetState(medicalRecordKey(id))
	if err != nil {
		return fmt.Errorf("failed to check medical record: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("medical record %s already exists", id)
	}

	patient, err := c.GetPatient(ctx, patientID)
	if err != nil {
		return fmt.Errorf("patient validation failed: %w", err)
	}

	if !patient.Active {
		return fmt.Errorf("patient %s is inactive", patientID)
	}

	if doctorID != "" {
		doctor, err := c.GetDoctor(ctx, doctorID)
		if err != nil {
			return fmt.Errorf("doctor validation failed: %w", err)
		}

		if !doctor.Active {
			return fmt.Errorf("doctor %s is inactive", doctorID)
		}
	}

	if hospitalID != "" {
		hospital, err := c.GetHospital(ctx, hospitalID)
		if err != nil {
			return fmt.Errorf("hospital validation failed: %w", err)
		}

		if !hospital.Active {
			return fmt.Errorf("hospital %s is inactive", hospitalID)
		}
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	timestamp := txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	record := models.MedicalRecord{
		ID:         id,
		PatientID:  patientID,
		DoctorID:   doctorID,
		HospitalID: hospitalID,
		CID:        cid,
		FileHash:   fileHash,
		Category:   category,
		Emergency:  emergency,
		CreatedAt:  timestamp,
		UpdatedAt:  timestamp,
		Active:     true,
	}

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(medicalRecordKey(id), data); err != nil {
		return fmt.Errorf("failed to store medical record: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetMedicalRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.MedicalRecord, error) {

	if id == "" {
		return nil, fmt.Errorf("record id is required")
	}

	data, err := ctx.GetStub().GetState(medicalRecordKey(id))
	if err != nil {
		return nil, fmt.Errorf("failed to read medical record: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("medical record %s does not exist", id)
	}

	var record models.MedicalRecord

	if err := json.Unmarshal(data, &record); err != nil {
		return nil, fmt.Errorf("failed to deserialize medical record: %w", err)
	}

	return &record, nil
}

func (c *CareLinkContract) UpdateMedicalRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
	cid string,
	fileHash string,
	category string,
	emergency bool,
) error {

	record, err := c.GetMedicalRecord(ctx, id)
	if err != nil {
		return err
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is inactive", id)
	}

	if cid == "" {
		return fmt.Errorf("record CID is required")
	}

	if fileHash == "" {
		return fmt.Errorf("record file hash is required")
	}

	if category == "" {
		return fmt.Errorf("record category is required")
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	record.CID = cid
	record.FileHash = fileHash
	record.Category = category
	record.Emergency = emergency
	record.UpdatedAt = txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(medicalRecordKey(id), data); err != nil {
		return fmt.Errorf("failed to update medical record: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GrantAccess(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	granteeID string,
) error {

	if patientID == "" {
		return fmt.Errorf("patient id is required")
	}

	if granteeID == "" {
		return fmt.Errorf("grantee id is required")
	}

	patient, err := c.GetPatient(ctx, patientID)
	if err != nil {
		return fmt.Errorf("patient validation failed: %w", err)
	}

	if !patient.Active {
		return fmt.Errorf("patient %s is inactive", patientID)
	}

	key := accessKey(patientID, granteeID)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check access grant: %w", err)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	timestamp := txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	if existing != nil {
		var grant models.AccessGrant

		if err := json.Unmarshal(existing, &grant); err != nil {
			return fmt.Errorf("failed to deserialize access grant: %w", err)
		}

		if grant.Active {
			return fmt.Errorf("access already granted to %s", granteeID)
		}

		grant.Active = true
		grant.GrantedAt = timestamp

		data, err := json.Marshal(grant)
		if err != nil {
			return fmt.Errorf("failed to serialize access grant: %w", err)
		}

		return ctx.GetStub().PutState(key, data)
	}

	grant := models.AccessGrant{
		ID:        key,
		PatientID: patientID,
		GranteeID: granteeID,
		GrantedBy: patientID,
		GrantedAt: timestamp,
		Active:    true,
	}

	data, err := json.Marshal(grant)
	if err != nil {
		return fmt.Errorf("failed to serialize access grant: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store access grant: %w", err)
	}

	return nil
}

func (c *CareLinkContract) RevokeAccess(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	granteeID string,
) error {

	if patientID == "" {
		return fmt.Errorf("patient id is required")
	}

	if granteeID == "" {
		return fmt.Errorf("grantee id is required")
	}

	key := accessKey(patientID, granteeID)

	data, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to read access grant: %w", err)
	}

	if data == nil {
		return fmt.Errorf("access grant does not exist")
	}

	var grant models.AccessGrant

	if err := json.Unmarshal(data, &grant); err != nil {
		return fmt.Errorf("failed to deserialize access grant: %w", err)
	}

	if !grant.Active {
		return fmt.Errorf("access is already revoked")
	}

	grant.Active = false

	data, err = json.Marshal(grant)
	if err != nil {
		return fmt.Errorf("failed to serialize access grant: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to update access grant: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetAccess(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	granteeID string,
) (*models.AccessGrant, error) {

	if patientID == "" || granteeID == "" {
		return nil, fmt.Errorf("patient id and grantee id are required")
	}

	data, err := ctx.GetStub().GetState(accessKey(patientID, granteeID))
	if err != nil {
		return nil, fmt.Errorf("failed to read access grant: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("access grant does not exist")
	}

	var grant models.AccessGrant

	if err := json.Unmarshal(data, &grant); err != nil {
		return nil, fmt.Errorf("failed to deserialize access grant: %w", err)
	}

	return &grant, nil
}

func (c *CareLinkContract) CreateAudit(
	ctx contractapi.TransactionContextInterface,
	id string,
	action string,
	actorID string,
	actorType string,
	resourceID string,
	resourceType string,
	details string,
) error {

	if id == "" {
		return fmt.Errorf("audit id is required")
	}

	if action == "" {
		return fmt.Errorf("audit action is required")
	}

	if actorID == "" {
		return fmt.Errorf("audit actor id is required")
	}

	existing, err := ctx.GetStub().GetState(auditKey(id))
	if err != nil {
		return fmt.Errorf("failed to check audit: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("audit %s already exists", id)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	audit := models.Audit{
		ID:           id,
		Action:       action,
		ActorID:      actorID,
		ActorType:    actorType,
		ResourceID:   resourceID,
		ResourceType: resourceType,
		Timestamp:    txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z"),
		Details:      details,
	}

	data, err := json.Marshal(audit)
	if err != nil {
		return fmt.Errorf("failed to serialize audit: %w", err)
	}

	if err := ctx.GetStub().PutState(auditKey(id), data); err != nil {
		return fmt.Errorf("failed to store audit: %w", err)
	}

	return nil
}

func (c *CareLinkContract) GetAudit(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.Audit, error) {

	if id == "" {
		return nil, fmt.Errorf("audit id is required")
	}

	data, err := ctx.GetStub().GetState(auditKey(id))
	if err != nil {
		return nil, fmt.Errorf("failed to read audit: %w", err)
	}

	if data == nil {
		return nil, fmt.Errorf("audit %s does not exist", id)
	}

	var audit models.Audit

	if err := json.Unmarshal(data, &audit); err != nil {
		return nil, fmt.Errorf("failed to deserialize audit: %w", err)
	}

	return &audit, nil
}

func (c *CareLinkContract) GetPatientRecords(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) ([]*models.MedicalRecord, error) {

	if patientID == "" {
		return nil, fmt.Errorf("patient id is required")
	}

	results, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to query ledger: %w", err)
	}
	defer results.Close()

	records := make([]*models.MedicalRecord, 0)

	for results.HasNext() {
		result, err := results.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ledger: %w", err)
		}

		if !strings.HasPrefix(result.Key, "RECORD_") {
			continue
		}

		var record models.MedicalRecord

		if err := json.Unmarshal(result.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to deserialize medical record: %w", err)
		}

		if record.PatientID == patientID && record.Active {
			records = append(records, &record)
		}
	}

	return records, nil
}

func (c *CareLinkContract) GetDoctorRecords(
	ctx contractapi.TransactionContextInterface,
	doctorID string,
) ([]*models.MedicalRecord, error) {

	if doctorID == "" {
		return nil, fmt.Errorf("doctor id is required")
	}

	results, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to query ledger: %w", err)
	}
	defer results.Close()

	records := make([]*models.MedicalRecord, 0)

	for results.HasNext() {
		result, err := results.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ledger: %w", err)
		}

		if !strings.HasPrefix(result.Key, "RECORD_") {
			continue
		}

		var record models.MedicalRecord

		if err := json.Unmarshal(result.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to deserialize medical record: %w", err)
		}

		if record.DoctorID == doctorID && record.Active {
			records = append(records, &record)
		}
	}

	return records, nil
}

func (c *CareLinkContract) GetHospitalRecords(
	ctx contractapi.TransactionContextInterface,
	hospitalID string,
) ([]*models.MedicalRecord, error) {

	if hospitalID == "" {
		return nil, fmt.Errorf("hospital id is required")
	}

	results, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to query ledger: %w", err)
	}
	defer results.Close()

	records := make([]*models.MedicalRecord, 0)

	for results.HasNext() {
		result, err := results.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ledger: %w", err)
		}

		if !strings.HasPrefix(result.Key, "RECORD_") {
			continue
		}

		var record models.MedicalRecord

		if err := json.Unmarshal(result.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to deserialize medical record: %w", err)
		}

		if record.HospitalID == hospitalID && record.Active {
			records = append(records, &record)
		}
	}

	return records, nil
}
