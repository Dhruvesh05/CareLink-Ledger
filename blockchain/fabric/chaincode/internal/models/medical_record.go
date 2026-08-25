package models

type MedicalRecord struct {
	ID         string `json:"id"`
	PatientID  string `json:"patientId"`
	DoctorID   string `json:"doctorId"`
	HospitalID string `json:"hospitalId"`
	CID        string `json:"cid"`
	FileHash   string `json:"fileHash"`
	Category   string `json:"category"`
	Emergency  bool   `json:"emergency"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
	Active     bool   `json:"active"`
}
