#!/usr/bin/env python3
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analytics'))

from feature_engineering import NPEFeatureExtractor
from isolation_forest_model import IsolationForestDetector

extractor = NPEFeatureExtractor()
detector = IsolationForestDetector(contamination=0.1)

npe_ids = [
    "spiffe://ncba.local/db/postgres-primary",
    "spiffe://ncba.local/service/payment-api",
    "spiffe://ncba.local/iot/sensor-001"
]

feature_list = [extractor.extract_features(sid, window_hours=72) for sid in npe_ids]
feature_list = [f for f in feature_list if f]

if len(feature_list) < 2:
    print("[ERROR] Need at least 2 NPEs with data. Run seed_telemetry.py first.")
    sys.exit(1)

print(f"[TRAIN] Using {len(feature_list)} samples")
detector.train(feature_list)
detector.save("models/isolation_forest.pkl")

print("\n=== SCORING ===")
for f in feature_list:
    score = detector.score(f)
    level = "ANOMALY" if score > 0.6 else "NORMAL"
    print(f"{f['spiffe_id']}: score={score:.4f} [{level}]")