package main

import (
	"log"

	"github.com/Dhruvesh05/CareLink-Ledger/blockchain/fabric/chaincode/contracts"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	chaincode, err := contractapi.NewChaincode(
		new(contracts.CareLinkContract),
	)
	if err != nil {
		log.Panicf("failed to create CareLink chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("failed to start CareLink chaincode: %v", err)
	}
}
