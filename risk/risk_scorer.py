import os
import json
import redis
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class RiskScore:
    total: float
    behavioral: float
    temporal: float
    peer: float
    threat_intel: float
    level: str

class RiskScorer:
    WEIGHTS = {
        "behavioral": 0.40,
        "temporal": 0.30,
        "peer": 0.20,
        "threat_intel": 0.10
    }

    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            decode_responses=True
        )

    def score(self, spiffe_id: str, behavioral: float, temporal: float,
              peer: float, threat_intel: float = 0.0) -> RiskScore:

        total = (
            behavioral  * self.WEIGHTS["behavioral"] +
            temporal    * self.WEIGHTS["temporal"] +
            peer        * self.WEIGHTS["peer"] +
            threat_intel * self.WEIGHTS["threat_intel"]
        ) * 100

        level = self._get_level(total)

        result = RiskScore(
            total=round(total, 2),
            behavioral=behavioral * 100,
            temporal=temporal * 100,
            peer=peer * 100,
            threat_intel=threat_intel * 100,
            level=level
        )

        try:
            self.redis_client.setex(
                f"risk:{spiffe_id}", 
                300, 
                json.dumps({"total": result.total, "level": result.level})
            )
        except redis.ConnectionError:
            print(f"[WARN] Redis unavailable, score not cached for {spiffe_id}")

        return result

    def _get_level(self, score: float) -> str:
        if score < 30:   return "GREEN"
        if score < 60:   return "CHALLENGE"
        if score < 85:   return "RATE_LIMIT"
        return "REVOKE"