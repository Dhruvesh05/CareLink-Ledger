package models

type Hospital struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
	Wallet  string `json:"wallet"`
	Active  bool   `json:"active"`
}
