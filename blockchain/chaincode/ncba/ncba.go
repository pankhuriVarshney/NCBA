package main

import (
    "encoding/json"
    "fmt"
    "time"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// CertificateEvent logged to blockchain
type CertificateEvent struct {
    SpiffeID    string    `json:"spiffe_id"`
    EventType   string    `json:"event_type"` // ISSUED, BEHAVIORAL, REVOKED
    Timestamp   time.Time `json:"timestamp"`
    RiskScore   float64   `json:"risk_score"`
    RevokedBy   []string  `json:"revoked_by,omitempty"` // multi-sig
    Evidence    string    `json:"evidence"`
}

type NCBAContract struct {
    contractapi.Contract
}

// LogIssuance — called when SPIRE issues a new certificate
func (c *NCBAContract) LogIssuance(ctx contractapi.TransactionContextInterface,
    spiffeID string, evidence string) error {

    event := CertificateEvent{
        SpiffeID:  spiffeID,
        EventType: "ISSUED",
        Timestamp: time.Now(),
        Evidence:  evidence,
    }
    data, _ := json.Marshal(event)
    key := fmt.Sprintf("CERT_%s_%d", spiffeID, time.Now().UnixNano())
    return ctx.GetStub().PutState(key, data)
}

// LogBehavioral — called for every risk scoring event
func (c *NCBAContract) LogBehavioral(ctx contractapi.TransactionContextInterface,
    spiffeID string, riskScore float64, evidence string) error {

    event := CertificateEvent{
        SpiffeID:  spiffeID,
        EventType: "BEHAVIORAL",
        Timestamp: time.Now(),
        RiskScore: riskScore,
        Evidence:  evidence,
    }
    data, _ := json.Marshal(event)
    key := fmt.Sprintf("BEH_%s_%d", spiffeID, time.Now().UnixNano())
    return ctx.GetStub().PutState(key, data)
}

// InitiateRevocation — 2-of-3 multi-sig required
func (c *NCBAContract) InitiateRevocation(ctx contractapi.TransactionContextInterface,
    spiffeID string, signerID string, evidence string) error {

    pendingKey := fmt.Sprintf("PENDING_REVOKE_%s", spiffeID)
    existing, _ := ctx.GetStub().GetState(pendingKey)

    var pending map[string]string
    if existing != nil {
        json.Unmarshal(existing, &pending)
    } else {
        pending = make(map[string]string)
    }

    pending[signerID] = evidence

    // Check if we have 2-of-3 signatures
    if len(pending) >= 2 {
        return c.executeRevocation(ctx, spiffeID, pending)
    }

    data, _ := json.Marshal(pending)
    return ctx.GetStub().PutState(pendingKey, data)
}

func (c *NCBAContract) executeRevocation(ctx contractapi.TransactionContextInterface,
    spiffeID string, signers map[string]string) error {

    signerList := make([]string, 0, len(signers))
    for k := range signers {
        signerList = append(signerList, k)
    }

    event := CertificateEvent{
        SpiffeID:  spiffeID,
        EventType: "REVOKED",
        Timestamp: time.Now(),
        RevokedBy: signerList,
    }
    data, _ := json.Marshal(event)
    key := fmt.Sprintf("REVOKE_%s_%d", spiffeID, time.Now().UnixNano())

    // Clear pending
    ctx.GetStub().DelState(fmt.Sprintf("PENDING_REVOKE_%s", spiffeID))
    return ctx.GetStub().PutState(key, data)
}

func main() {
    chaincode, _ := contractapi.NewChaincode(&NCBAContract{})
    chaincode.Start()
}