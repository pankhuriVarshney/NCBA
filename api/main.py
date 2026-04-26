#!/usr/bin/env python3
# api/main.py
import os
import json
import logging
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NCBA.API")

app = FastAPI(title="NCBA API", version="1.0")

# CORS: allow ALL origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- changed from localhost:3000 to *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    r = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True
    )
    r.ping()
    logger.info("[API] Redis connected")
except Exception as e:
    logger.error(f"[API] Redis connection failed: {e}")
    r = None

class EvaluateRequest(BaseModel):
    spiffe_id: str
    src_ip: str = "unknown"

@app.get("/api/v1/npes")
def list_npes():
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    keys = r.keys("risk:*")
    results = []
    for k in keys:
        try:
            data = json.loads(r.get(k))
            sid = k.replace("risk:", "")
            results.append({
                "spiffe_id": sid,
                "name": sid.split("/")[-1],
                "score": data.get("total", 0),
                "level": data.get("level", "UNKNOWN"),
                "last_seen": data.get("timestamp", 0)
            })
        except Exception as e:
            logger.warning(f"Bad key {k}: {e}")
    return sorted(results, key=lambda x: x["score"], reverse=True)

@app.get("/api/v1/score/{spiffe_id}")
def get_score(spiffe_id: str):
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    cached = r.get(f"risk:{spiffe_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="No score found")
    return json.loads(cached)

@app.post("/api/v1/evaluate")
def evaluate(req: EvaluateRequest):
    cached = r.get(f"risk:{req.spiffe_id}") if r else None
    if cached:
        return json.loads(cached)
    raise HTTPException(status_code=404, detail="No telemetry for this NPE")

@app.get("/api/v1/alerts")
def get_alerts():
    if not r:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    keys = r.keys("risk:*")
    alerts = []
    for k in keys:
        data = json.loads(r.get(k))
        if data.get("level", "GREEN") != "GREEN":
            alerts.append({
                "spiffe_id": k.replace("risk:", ""),
                "level": data["level"],
                "score": data.get("total", 0),
                "timestamp": data.get("timestamp", 0)
            })
    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)[:50]

@app.get("/api/v1/health")
def health():
    redis_ok = r.ping() if r else False
    return {"status": "ok", "redis": redis_ok}

@app.get("/")
def root():
    return {"message": "NCBA API", "docs": "/docs"}