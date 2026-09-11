package models

type Doctor struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Specialization string `json:"specialization"`
	HospitalID     string `json:"hospitalId"`
	Wallet         string `json:"wallet"`
	Active         bool   `json:"active"`
	Verified       bool   `json:"verified"`
}
