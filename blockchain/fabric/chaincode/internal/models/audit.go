package models

type Audit struct {
	ID           string `json:"id"`
	Action       string `json:"action"`
	ActorID      string `json:"actorId"`
	ActorType    string `json:"actorType"`
	ResourceID   string `json:"resourceId"`
	ResourceType string `json:"resourceType"`
	Timestamp    string `json:"timestamp"`
	Details      string `json:"details"`
}
