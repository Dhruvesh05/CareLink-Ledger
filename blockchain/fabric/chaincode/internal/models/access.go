package models

type AccessGrant struct {
	ID        string `json:"id"`
	PatientID string `json:"patientId"`
	GranteeID string `json:"granteeId"`
	GrantedBy string `json:"grantedBy"`
	GrantedAt string `json:"grantedAt"`
	Active    bool   `json:"active"`
}
