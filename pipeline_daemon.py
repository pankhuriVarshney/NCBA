#!/usr/bin/env python3
"""
NCBA Pipeline Daemon
Continuously links Phase 3 (telemetry) → Phase 4 (analytics + response)
"""
import os
import sys
import time
import json
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analytics'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'risk'))

from kafka import KafkaProducer
from feature_engineering import NPEFeatureExtractor
from isolation_forest_model import IsolationForestDetector
from cohort_analysis import CohortAnalyzer
from risk_scorer import RiskScorer

NPE_REGISTRY = [
    "spiffe://ncba.local/db/postgres-primary",
    "spiffe://ncba.local/service/payment-api",
    "spiffe://ncba.local/iot/sensor-001",
    "spiffe://ncba.local/web/frontend-01",
    "spiffe://ncba.local/cache/redis-01",
    "spiffe://ncba.local/legacy/proxy-01",
]

class NCBAPipeline:
    def __init__(self):
        self.extractor = NPEFeatureExtractor()
        self.detector = None
        self.cohort = None
        self.scorer = RiskScorer()
        self.producer = KafkaProducer(
            bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        self.models_trained = False

    def train_models(self, features):
        if len(features) < 3:
            print(f"[PIPELINE] Need >= 3 NPEs for training, got {len(features)}")
            return False

        # Adaptive contamination: never force more than 1 outlier in small sets
        contamination = max(0.01, min(0.15, 1.0 / len(features)))
        print(f"[PIPELINE] Training IF with contamination={contamination:.3f}")

        self.detector = IsolationForestDetector(contamination=contamination)
        self.detector.train(features)

        # Cohort clusters: never more than half the sample count
        n_clusters = min(3, len(features) // 2) or 1
        self.cohort = CohortAnalyzer(n_clusters=n_clusters)
        self.cohort.assign_cohorts(features)

        self.models_trained = True
        print(f"[PIPELINE] Models trained on {len(features)} NPEs")
        return True

    def evaluate_all(self):
        features = []
        for sid in NPE_REGISTRY:
            f = self.extractor.extract_features(sid, window_hours=24)
            if f:
                features.append(f)
            else:
                print(f"[PIPELINE] {sid.split('/')[-1]:25s} | NO DATA")

        if len(features) < 3:
            print(f"[PIPELINE] Only {len(features)} NPEs with data, skipping evaluation")
            return

        if not self.models_trained:
            if not self.train_models(features):
                return

        for f in features:
            sid = f['spiffe_id']
            if_score = self.detector.score(f)
            peer = self.cohort.peer_deviation_score(f)

            behavioral = if_score
            temporal = 0.12
            threat_intel = 0.0
            if f.get("unique_dst_ips", 0) > 2:
                threat_intel += 0.08
            if f.get("unique_ciphers", 0) > 1:
                threat_intel += 0.06

            result = self.scorer.score(sid, behavioral, temporal, peer, threat_intel)

            decision = {
                "spiffe_id": sid,
                "level": result.level,
                "score": result.total,
                "src_ip": f.get("src_ip", "unknown"),
                "timestamp": time.time()
            }

            self.producer.send('risk-decisions', decision)
            print(f"[PIPELINE] {sid.split('/')[-1]:25s} | Risk={result.total:5.1f} | {result.level}")

    def run(self, interval=30):
        print(f"[PIPELINE] Monitoring {len(NPE_REGISTRY)} NPEs")
        print(f"[PIPELINE] Waiting 45s for telemetry to accumulate...")
        time.sleep(45)

        while True:
            try:
                self.evaluate_all()
            except Exception as e:
                print(f"[PIPELINE] Error: {e}")
            time.sleep(interval)

if __name__ == "__main__":
    NCBAPipeline().run(interval=30)