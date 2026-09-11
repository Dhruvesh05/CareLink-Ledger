package models

type Patient struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DateOfBirth string `json:"dateOfBirth"`
	Gender      string `json:"gender"`
	BloodGroup  string `json:"bloodGroup"`
	Wallet      string `json:"wallet"`
	Active      bool   `json:"active"`
}
