# CareLink Ledger

CareLink Ledger is a cross-chain healthcare data interoperability platform designed to synchronize Electronic Health Records across Hyperledger Fabric, Ethereum Sepolia, and Polygon Amoy through a custom relay bridge.

This repository contains active backend/blockchain code and scaffolded modules for bridge, frontend, Fabric, FHIR, deployment, and analytics extensions.

## Service Boundaries

- `backend/`: Node.js + TypeScript API, MongoDB models, IPFS integration, SSI modules, Ethereum adapter.
- `blockchain/evm/`: Solidity contracts, Hardhat config, deployment scripts, and tests.
- `blockchain/polygon/`: Polygon-specific EVM workspace (adapter/deployment boundary).
- `blockchain/fabric/`: Fabric chaincode/network boundary.
- `bridge/`: cross-chain relay service boundary.
- `analytics/`: Python FastAPI analytics service.
- `frontend/`: React application boundary.
- `fhir/`: HAPI FHIR interoperability boundary.
- `configs/`, `scripts/`, `docs/`: shared operational and architecture assets.

## Quick Start (Foundation)

1. Copy environment templates.
2. Start shared infrastructure using Docker Compose.
3. Run backend and analytics from host during development.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d
npm --prefix backend run dev
```

Analytics service:

```bash
uvicorn analytics.main:app --host 0.0.0.0 --port 8000 --reload
```

## Current Scope

Implemented/partially implemented modules include:

- Ethereum registry and medical-record integrations
- Medical record API flow with IPFS upload and Mongo metadata sync
- IPFS service adapters and tests
- SSI module structure and tests

Scaffolded placeholders remain for:

- bridge runtime internals
- frontend application internals
- Fabric and Polygon adapters
- CI/CD workflows and Oracle deployment assets

## Intended Stack

- Hyperledger Fabric
- Solidity
- Go
- Node.js and Express.js
- React.js
- Python and FastAPI
- HAPI FHIR R4
- MongoDB Atlas
- IPFS via Pinata
- Docker and Docker Compose

## Repository Layout

```text
carelink/
├── blockchain/
├── bridge/
├── backend/
├── analytics/
├── frontend/
├── fhir/
├── dataset/
├── generator/
├── docs/
├── scripts/
└── configs/
```

## Foundation Conventions

- Environment: all runtime variables are defined in root `.env.example` and backend `.env.example`.
- Logging: use service loggers in each runtime boundary; never log secrets or raw medical payloads.
- API responses: prefer `{ success, message, data?, error? }` structure.
- Validation: keep request validation in dedicated validators/middleware.
- Health checks: expose liveness/readiness endpoints per service.