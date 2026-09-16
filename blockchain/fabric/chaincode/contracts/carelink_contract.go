package contracts

import (
	"encoding/json"
	"fmt"
	"strconv"
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

	if err := emitChaincodeEvent(ctx, "PatientRegistered", patient); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RegisterPatientFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	wallet string,
	fullNameHash string,
	dobHash string,
	bloodGroup string,
	gender string,
) error {

	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(wallet) == "" {
		return fmt.Errorf("patient wallet is required")
	}

	if strings.TrimSpace(fullNameHash) == "" ||
		strings.TrimSpace(dobHash) == "" ||
		strings.TrimSpace(bloodGroup) == "" ||
		strings.TrimSpace(gender) == "" {
		return fmt.Errorf("patient registration fields are required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return nil
	}

	patientID := sourceChain + "_" + wallet
	key := patientKey(patientID)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check bridged patient: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("bridged patient %s already exists", patientID)
	}

	patient := models.Patient{
		ID:          patientID,
		Name:        fullNameHash,
		DateOfBirth: dobHash,
		Gender:      gender,
		BloodGroup:  bloodGroup,
		Wallet:      wallet,
		Active:      true,
	}

	data, err := json.Marshal(patient)
	if err != nil {
		return fmt.Errorf("failed to serialize bridged patient: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store bridged patient: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"PatientRegistered",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID   string         `json:"messageId"`
		SourceChain string         `json:"sourceChain"`
		Wallet      string         `json:"wallet"`
		Patient     models.Patient `json:"patient"`
	}{
		MessageID:   messageID,
		SourceChain: sourceChain,
		Wallet:      wallet,
		Patient:     patient,
	}

	return emitChaincodeEvent(
		ctx,
		"BridgePatientRegistered",
		eventPayload,
	)
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

func (c *CareLinkContract) UpdateBloodGroup(
	ctx contractapi.TransactionContextInterface,
	id string,
	bloodGroup string,
) error {

	if id == "" {
		return fmt.Errorf("patient id is required")
	}

	if strings.TrimSpace(bloodGroup) == "" {
		return fmt.Errorf("blood group is required")
	}

	patient, err := c.GetPatient(ctx, id)
	if err != nil {
		return err
	}

	patient.BloodGroup = bloodGroup

	data, err := json.Marshal(patient)
	if err != nil {
		return fmt.Errorf("failed to serialize patient: %w", err)
	}

	if err := ctx.GetStub().PutState(patientKey(id), data); err != nil {
		return fmt.Errorf("failed to update patient: %w", err)
	}

	if err := emitChaincodeEvent(ctx, "BloodGroupUpdated", patient); err != nil {
		return err
	}

	return nil
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

	if err := emitChaincodeEvent(ctx, "PatientDeactivated", patient); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "PatientReactivated", patient); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "DoctorRegistered", doctor); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RegisterDoctorFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	wallet string,
	fullNameHash string,
	licenseNumberHash string,
	specialization string,
	hospitalWallet string,
) error {

	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(wallet) == "" {
		return fmt.Errorf("doctor wallet is required")
	}

	if strings.TrimSpace(hospitalWallet) == "" {
		return fmt.Errorf("hospital wallet is required")
	}

	if strings.TrimSpace(fullNameHash) == "" ||
		strings.TrimSpace(licenseNumberHash) == "" ||
		strings.TrimSpace(specialization) == "" {
		return fmt.Errorf("doctor registration fields are required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return nil
	}

	doctorID := sourceChain + "_" + wallet
	doctorKeyValue := doctorKey(doctorID)

	existing, err := ctx.GetStub().GetState(doctorKeyValue)
	if err != nil {
		return fmt.Errorf("failed to check bridged doctor: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("bridged doctor %s already exists", doctorID)
	}

	hospitalID := sourceChain + "_" + hospitalWallet
	hospital, err := c.GetHospital(ctx, hospitalID)
	if err != nil {
		return fmt.Errorf(
			"bridged doctor hospital %s not found: %w",
			hospitalID,
			err,
		)
	}

	if !hospital.Active {
		return fmt.Errorf("hospital %s is inactive", hospitalID)
	}

	doctor := models.Doctor{
		ID:             doctorID,
		Name:           fullNameHash,
		Specialization: specialization,
		HospitalID:     hospitalID,
		Wallet:         wallet,
		Active:         true,
		Verified:       false,
	}

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize bridged doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(doctorKeyValue, data); err != nil {
		return fmt.Errorf("failed to store bridged doctor: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"DoctorRegistered",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID      string        `json:"messageId"`
		SourceChain    string        `json:"sourceChain"`
		Wallet         string        `json:"wallet"`
		HospitalWallet string        `json:"hospitalWallet"`
		Doctor         models.Doctor `json:"doctor"`
	}{
		MessageID:      messageID,
		SourceChain:    sourceChain,
		Wallet:         wallet,
		HospitalWallet: hospitalWallet,
		Doctor:         doctor,
	}

	return emitChaincodeEvent(
		ctx,
		"BridgeDoctorRegistered",
		eventPayload,
	)
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

func (c *CareLinkContract) VerifyDoctor(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return err
	}

	if doctor.Verified {
		return fmt.Errorf("doctor %s is already verified", id)
	}

	doctor.Verified = true

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(doctorKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "DoctorVerified", doctor); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RevokeDoctorVerification(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return err
	}

	if !doctor.Verified {
		return fmt.Errorf("doctor %s is not verified", id)
	}

	doctor.Verified = false

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	if err := ctx.GetStub().PutState(doctorKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "DoctorVerificationRevoked", doctor); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) IsDoctorVerified(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {
	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return false, err
	}

	return doctor.Verified, nil
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

	if err := emitChaincodeEvent(ctx, "DoctorDeactivated", doctor); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "DoctorReactivated", doctor); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "HospitalRegistered", hospital); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RegisterHospitalFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	wallet string,
	hospitalNameHash string,
	registrationNumberHash string,
	locationHash string,
) error {

	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(wallet) == "" {
		return fmt.Errorf("hospital wallet is required")
	}

	if strings.TrimSpace(hospitalNameHash) == "" ||
		strings.TrimSpace(registrationNumberHash) == "" ||
		strings.TrimSpace(locationHash) == "" {
		return fmt.Errorf("hospital registration fields are required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return nil
	}

	hospitalID := sourceChain + "_" + wallet
	key := hospitalKey(hospitalID)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check bridged hospital: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("bridged hospital %s already exists", hospitalID)
	}

	hospital := models.Hospital{
		ID:       hospitalID,
		Name:     hospitalNameHash,
		Address:  locationHash,
		Wallet:   wallet,
		Active:   true,
		Verified: false,
	}

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize bridged hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store bridged hospital: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"HospitalRegistered",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID   string          `json:"messageId"`
		SourceChain string          `json:"sourceChain"`
		Wallet      string          `json:"wallet"`
		Hospital    models.Hospital `json:"hospital"`
	}{
		MessageID:   messageID,
		SourceChain: sourceChain,
		Wallet:      wallet,
		Hospital:    hospital,
	}

	return emitChaincodeEvent(
		ctx,
		"BridgeHospitalRegistered",
		eventPayload,
	)
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

func (c *CareLinkContract) UpdateSpecialization(
	ctx contractapi.TransactionContextInterface,
	id string,
	specialization string,
) error {
	if id == "" {
		return fmt.Errorf("doctor id is required")
	}

	if strings.TrimSpace(specialization) == "" {
		return fmt.Errorf("specialization is required")
	}

	doctor, err := c.GetDoctor(ctx, id)
	if err != nil {
		return err
	}

	doctor.Specialization = specialization

	data, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to serialize doctor: %w", err)
	}

	return ctx.GetStub().PutState(doctorKey(id), data)
}

func (c *CareLinkContract) UpdateLocation(
	ctx contractapi.TransactionContextInterface,
	id string,
	location string,
) error {
	if id == "" {
		return fmt.Errorf("hospital id is required")
	}

	if strings.TrimSpace(location) == "" {
		return fmt.Errorf("location is required")
	}

	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return err
	}

	hospital.Address = location

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	return ctx.GetStub().PutState(hospitalKey(id), data)
}

func (c *CareLinkContract) VerifyHospital(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return err
	}

	if hospital.Verified {
		return fmt.Errorf("hospital %s is already verified", id)
	}

	hospital.Verified = true

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(hospitalKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "HospitalVerified", hospital); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RevokeHospitalVerification(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return err
	}

	if !hospital.Verified {
		return fmt.Errorf("hospital %s is not verified", id)
	}

	hospital.Verified = false

	data, err := json.Marshal(hospital)
	if err != nil {
		return fmt.Errorf("failed to serialize hospital: %w", err)
	}

	if err := ctx.GetStub().PutState(hospitalKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "HospitalVerificationRevoked", hospital); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) IsHospitalVerified(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {
	hospital, err := c.GetHospital(ctx, id)
	if err != nil {
		return false, err
	}

	return hospital.Verified, nil
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

	if err := emitChaincodeEvent(ctx, "HospitalDeactivated", hospital); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "HospitalReactivated", hospital); err != nil {
		return err
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
		Version:    1,
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

	if err := emitChaincodeEvent(ctx, "MedicalRecordCreated", record); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) CreateMedicalRecordFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	sourceRecordID string,
	patientID string,
	doctorID string,
	hospitalID string,
	cid string,
	fileHash string,
	category string,
	emergency bool,
) error {

	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if sourceChain == "" {
		return fmt.Errorf("source chain is required")
	}

	if sourceRecordID == "" {
		return fmt.Errorf("source record id is required")
	}

	bridgeRecordID := sourceChain + "_" + sourceRecordID

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
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

	existing, err := ctx.GetStub().GetState(medicalRecordKey(bridgeRecordID))
	if err != nil {
		return fmt.Errorf("failed to check medical record: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("medical record %s already exists", bridgeRecordID)
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
		ID:         bridgeRecordID,
		PatientID:  patientID,
		DoctorID:   doctorID,
		HospitalID: hospitalID,
		CID:        cid,
		FileHash:   fileHash,
		Category:   category,
		Emergency:  emergency,
		Version:    1,
		CreatedAt:  timestamp,
		UpdatedAt:  timestamp,
		Active:     true,
	}

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(medicalRecordKey(bridgeRecordID), data); err != nil {
		return fmt.Errorf("failed to store medical record: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"MedicalRecordCreated",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID      string               `json:"messageId"`
		SourceChain    string               `json:"sourceChain"`
		SourceRecordID string               `json:"sourceRecordId"`
		Record         models.MedicalRecord `json:"record"`
	}{
		MessageID:      messageID,
		SourceChain:    sourceChain,
		SourceRecordID: sourceRecordID,
		Record:         record,
	}

	if err := emitChaincodeEvent(ctx, "BridgeMedicalRecordCreated", eventPayload); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) UpdateMedicalRecordFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	sourceRecordID string,
	newCID string,
	newFileHash string,
	newCategory string,
	expectedVersion string,
) error {
	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(sourceRecordID) == "" {
		return fmt.Errorf("source record id is required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
	}

	parsedExpectedVersion, err := strconv.ParseUint(
		strings.TrimSpace(expectedVersion),
		10,
		64,
	)
	if err != nil {
		return fmt.Errorf("invalid expected version: %w", err)
	}

	bridgeRecordID := sourceChain + "_" + sourceRecordID

	record, err := c.GetMedicalRecord(ctx, bridgeRecordID)
	if err != nil {
		return fmt.Errorf("medical record lookup failed: %w", err)
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is inactive", bridgeRecordID)
	}

	if record.Version == 0 {
		return fmt.Errorf(
			"medical record %s has no initialized version",
			bridgeRecordID,
		)
	}

	if parsedExpectedVersion != record.Version {
		return fmt.Errorf(
			"version mismatch: expected %d, current %d",
			parsedExpectedVersion,
			record.Version,
		)
	}

	if strings.TrimSpace(newCID) == "" {
		return fmt.Errorf("cid is required")
	}

	if strings.TrimSpace(newFileHash) == "" {
		return fmt.Errorf("file hash is required")
	}

	if strings.TrimSpace(newCategory) == "" {
		return fmt.Errorf("category is required")
	}

	record.CID = newCID
	record.FileHash = newFileHash
	record.Category = newCategory
	record.Version += 1

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	record.UpdatedAt = txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(
		medicalRecordKey(bridgeRecordID),
		data,
	); err != nil {
		return fmt.Errorf("failed to store medical record: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"MedicalRecordUpdated",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID       string               `json:"messageId"`
		SourceChain     string               `json:"sourceChain"`
		SourceRecordID  string               `json:"sourceRecordId"`
		ExpectedVersion uint64               `json:"expectedVersion"`
		Record          models.MedicalRecord `json:"record"`
	}{
		MessageID:       messageID,
		SourceChain:     sourceChain,
		SourceRecordID:  sourceRecordID,
		ExpectedVersion: parsedExpectedVersion,
		Record:          *record,
	}

	if err := emitChaincodeEvent(
		ctx,
		"BridgeMedicalRecordUpdated",
		eventPayload,
	); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) DeactivateMedicalRecordFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	sourceRecordID string,
	actor string,
) error {
	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(sourceRecordID) == "" {
		return fmt.Errorf("source record id is required")
	}

	if strings.TrimSpace(actor) == "" {
		return fmt.Errorf("actor is required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
	}

	bridgeRecordID := sourceChain + "_" + sourceRecordID

	record, err := c.GetMedicalRecord(ctx, bridgeRecordID)
	if err != nil {
		return fmt.Errorf("medical record lookup failed: %w", err)
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is already inactive", bridgeRecordID)
	}

	record.Active = false

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	record.UpdatedAt = txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(
		medicalRecordKey(bridgeRecordID),
		data,
	); err != nil {
		return fmt.Errorf("failed to store medical record: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"MedicalRecordDeactivated",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID      string               `json:"messageId"`
		SourceChain    string               `json:"sourceChain"`
		SourceRecordID string               `json:"sourceRecordId"`
		Actor          string               `json:"actor"`
		Record         models.MedicalRecord `json:"record"`
	}{
		MessageID:      messageID,
		SourceChain:    sourceChain,
		SourceRecordID: sourceRecordID,
		Actor:          actor,
		Record:         *record,
	}

	if err := emitChaincodeEvent(
		ctx,
		"BridgeMedicalRecordDeactivated",
		eventPayload,
	); err != nil {
		return err
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
	if id == "" {
		return fmt.Errorf("medical record id is required")
	}

	record, err := c.GetMedicalRecord(ctx, id)
	if err != nil {
		return err
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is inactive", id)
	}

	if strings.TrimSpace(cid) == "" {
		return fmt.Errorf("cid is required")
	}

	if strings.TrimSpace(fileHash) == "" {
		return fmt.Errorf("file hash is required")
	}

	if strings.TrimSpace(category) == "" {
		return fmt.Errorf("category is required")
	}

	record.CID = cid
	record.FileHash = fileHash
	record.Category = category
	record.Emergency = emergency

	if record.Version == 0 {
		record.Version = 1
	}
	record.Version += 1

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}
	record.UpdatedAt = txTimestamp.String()

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(medicalRecordKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "MedicalRecordUpdated", record); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) DeactivateMedicalRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	if id == "" {
		return fmt.Errorf("medical record id is required")
	}

	record, err := c.GetMedicalRecord(ctx, id)
	if err != nil {
		return err
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is already inactive", id)
	}

	record.Active = false
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}
	record.UpdatedAt = txTimestamp.String()

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize medical record: %w", err)
	}

	if err := ctx.GetStub().PutState(medicalRecordKey(id), data); err != nil {
		return err
	}

	if err := emitChaincodeEvent(ctx, "MedicalRecordDeactivated", record); err != nil {
		return err
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

		if err := ctx.GetStub().PutState(key, data); err != nil {
			return err
		}

		if err := emitChaincodeEvent(ctx, "AccessGranted", grant); err != nil {
			return err
		}

		return nil
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

	if err := emitChaincodeEvent(ctx, "AccessGranted", grant); err != nil {
		return err
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

	if err := emitChaincodeEvent(ctx, "AccessRevoked", grant); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) GrantAccessFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	sourceRecordID string,
	doctorID string,
) error {
	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(sourceRecordID) == "" {
		return fmt.Errorf("source record id is required")
	}

	if strings.TrimSpace(doctorID) == "" {
		return fmt.Errorf("doctor id is required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
	}

	bridgeRecordID := sourceChain + "_" + sourceRecordID

	record, err := c.GetMedicalRecord(ctx, bridgeRecordID)
	if err != nil {
		return fmt.Errorf("medical record lookup failed: %w", err)
	}

	if !record.Active {
		return fmt.Errorf("medical record %s is inactive", bridgeRecordID)
	}

	patientID := record.PatientID

	patient, err := c.GetPatient(ctx, patientID)
	if err != nil {
		return fmt.Errorf("patient validation failed: %w", err)
	}

	if !patient.Active {
		return fmt.Errorf("patient %s is inactive", patientID)
	}

	doctor, err := c.GetDoctor(ctx, doctorID)
	if err != nil {
		return fmt.Errorf("doctor validation failed: %w", err)
	}

	if !doctor.Active {
		return fmt.Errorf("doctor %s is inactive", doctorID)
	}

	if !doctor.Verified {
		return fmt.Errorf("doctor %s is not verified", doctorID)
	}

	key := accessKey(patientID, doctorID)

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check access grant: %w", err)
	}

	if existing != nil {
		var grant models.AccessGrant

		if err := json.Unmarshal(existing, &grant); err != nil {
			return fmt.Errorf("failed to deserialize access grant: %w", err)
		}

		if grant.Active {
			return fmt.Errorf("access already granted to %s", doctorID)
		}
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	timestamp := txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05.000Z")

	grant := models.AccessGrant{
		ID:        key,
		PatientID: patientID,
		GranteeID: doctorID,
		GrantedBy: patientID,
		GrantedAt: timestamp,
		Active:    true,
	}

	if existing != nil {
		var previousGrant models.AccessGrant

		if err := json.Unmarshal(existing, &previousGrant); err != nil {
			return fmt.Errorf("failed to deserialize existing access grant: %w", err)
		}

		grant.ID = previousGrant.ID
	}

	data, err := json.Marshal(grant)
	if err != nil {
		return fmt.Errorf("failed to serialize access grant: %w", err)
	}

	if err := ctx.GetStub().PutState(key, data); err != nil {
		return fmt.Errorf("failed to store access grant: %w", err)
	}

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"AccessGranted",
	); err != nil {
		return err
	}

	auditID := "bridge_" + messageID

	if err := c.CreateAudit(
		ctx,
		auditID,
		"GRANT_ACCESS",
		patientID,
		"PATIENT",
		bridgeRecordID,
		"MEDICAL_RECORD",
		"Doctor access grant mirrored from another chain",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID      string             `json:"messageId"`
		SourceChain    string             `json:"sourceChain"`
		SourceRecordID string             `json:"sourceRecordId"`
		PatientID      string             `json:"patientId"`
		DoctorID       string             `json:"doctorId"`
		Grant          models.AccessGrant `json:"grant"`
	}{
		MessageID:      messageID,
		SourceChain:    sourceChain,
		SourceRecordID: sourceRecordID,
		PatientID:      patientID,
		DoctorID:       doctorID,
		Grant:          grant,
	}

	if err := emitChaincodeEvent(
		ctx,
		"BridgeAccessGranted",
		eventPayload,
	); err != nil {
		return err
	}

	return nil
}

func (c *CareLinkContract) RevokeAccessFromBridge(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	sourceRecordID string,
	doctorID string,
) error {
	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	if strings.TrimSpace(sourceChain) == "" {
		return fmt.Errorf("source chain is required")
	}

	if strings.TrimSpace(sourceRecordID) == "" {
		return fmt.Errorf("source record id is required")
	}

	if strings.TrimSpace(doctorID) == "" {
		return fmt.Errorf("doctor id is required")
	}

	processed, err := isBridgeMessageProcessed(ctx, messageID)
	if err != nil {
		return err
	}

	if processed {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
	}

	bridgeRecordID := sourceChain + "_" + sourceRecordID

	record, err := c.GetMedicalRecord(ctx, bridgeRecordID)
	if err != nil {
		return fmt.Errorf("medical record lookup failed: %w", err)
	}

	patientID := record.PatientID

	key := accessKey(patientID, doctorID)

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

	if err := markBridgeMessageProcessed(
		ctx,
		messageID,
		sourceChain,
		"fabric",
		"AccessRevoked",
	); err != nil {
		return err
	}

	auditID := "bridge_" + messageID

	if err := c.CreateAudit(
		ctx,
		auditID,
		"REVOKE_ACCESS",
		patientID,
		"PATIENT",
		bridgeRecordID,
		"MEDICAL_RECORD",
		"Doctor access revocation mirrored from another chain",
	); err != nil {
		return err
	}

	eventPayload := struct {
		MessageID      string             `json:"messageId"`
		SourceChain    string             `json:"sourceChain"`
		SourceRecordID string             `json:"sourceRecordId"`
		PatientID      string             `json:"patientId"`
		DoctorID       string             `json:"doctorId"`
		Grant          models.AccessGrant `json:"grant"`
	}{
		MessageID:      messageID,
		SourceChain:    sourceChain,
		SourceRecordID: sourceRecordID,
		PatientID:      patientID,
		DoctorID:       doctorID,
		Grant:          grant,
	}

	if err := emitChaincodeEvent(
		ctx,
		"BridgeAccessRevoked",
		eventPayload,
	); err != nil {
		return err
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

func (c *CareLinkContract) IsAuthorizedDoctor(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	doctorID string,
) (bool, error) {
	if patientID == "" {
		return false, fmt.Errorf("patient id is required")
	}

	if doctorID == "" {
		return false, fmt.Errorf("doctor id is required")
	}

	if _, err := c.GetPatient(ctx, patientID); err != nil {
		return false, err
	}

	if _, err := c.GetDoctor(ctx, doctorID); err != nil {
		return false, err
	}

	grant, err := c.GetAccess(ctx, patientID, doctorID)
	if err != nil {
		return false, nil
	}

	return grant.Active, nil
}

func (c *CareLinkContract) ViewRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*models.MedicalRecord, error) {
	if id == "" {
		return nil, fmt.Errorf("medical record id is required")
	}

	record, err := c.GetMedicalRecord(ctx, id)
	if err != nil {
		return nil, err
	}

	if !record.Active {
		return nil, fmt.Errorf("medical record %s is inactive", id)
	}

	return record, nil
}

func (c *CareLinkContract) LogDownload(
	ctx contractapi.TransactionContextInterface,
	id string,
) error {
	if id == "" {
		return fmt.Errorf("medical record id is required")
	}

	if _, err := c.GetMedicalRecord(ctx, id); err != nil {
		return err
	}

	actorID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get actor identity: %w", err)
	}

	auditID := fmt.Sprintf("download_%s_%s", id, ctx.GetStub().GetTxID())

	return c.CreateAudit(
		ctx,
		auditID,
		"DOWNLOAD",
		actorID,
		"FABRIC",
		id,
		"MEDICAL_RECORD",
		"Medical record downloaded",
	)
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
