package contracts

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const bridgeMessagePrefix = "BRIDGE_MESSAGE_"

type BridgeMessage struct {
	MessageID        string `json:"messageId"`
	SourceChain      string `json:"sourceChain"`
	DestinationChain string `json:"destinationChain"`
	MessageType      string `json:"messageType"`
	ProcessedAt      string `json:"processedAt"`
}

func bridgeMessageKey(messageID string) string {
	return bridgeMessagePrefix + messageID
}

func validateBridgeMessageID(messageID string) error {
	if strings.TrimSpace(messageID) == "" {
		return fmt.Errorf("bridge message id is required")
	}

	return nil
}

func isBridgeMessageProcessed(
	ctx contractapi.TransactionContextInterface,
	messageID string,
) (bool, error) {
	if err := validateBridgeMessageID(messageID); err != nil {
		return false, err
	}

	data, err := ctx.GetStub().GetState(bridgeMessageKey(messageID))
	if err != nil {
		return false, fmt.Errorf("failed to check bridge message: %w", err)
	}

	return data != nil, nil
}

func markBridgeMessageProcessed(
	ctx contractapi.TransactionContextInterface,
	messageID string,
	sourceChain string,
	destinationChain string,
	messageType string,
) error {
	if err := validateBridgeMessageID(messageID); err != nil {
		return err
	}

	existing, err := ctx.GetStub().GetState(bridgeMessageKey(messageID))
	if err != nil {
		return fmt.Errorf("failed to check bridge message: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("bridge message %s has already been processed", messageID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	record := BridgeMessage{
		MessageID:        messageID,
		SourceChain:      sourceChain,
		DestinationChain: destinationChain,
		MessageType:      messageType,
		ProcessedAt:      txTimestamp.String(),
	}

	data, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to serialize bridge message: %w", err)
	}

	if err := ctx.GetStub().PutState(bridgeMessageKey(messageID), data); err != nil {
		return fmt.Errorf("failed to store bridge message: %w", err)
	}

	return nil
}

func emitChaincodeEvent(
	ctx contractapi.TransactionContextInterface,
	eventName string,
	payload interface{},
) error {
	if strings.TrimSpace(eventName) == "" {
		return fmt.Errorf("event name is required")
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to serialize event payload: %w", err)
	}

	if err := ctx.GetStub().SetEvent(eventName, data); err != nil {
		return fmt.Errorf("failed to emit chaincode event %s: %w", eventName, err)
	}

	return nil
}
