from fastapi import FastAPI

app = FastAPI(
    title="CareLink Ledger Analytics Service",
    version="1.0.0",
    description="Analytics microservice for the CareLink Ledger platform."
)


@app.get("/")
def root():
    return {
        "service": "CareLink Ledger Analytics",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }