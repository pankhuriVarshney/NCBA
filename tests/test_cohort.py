#!/usr/bin/env python3
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analytics'))

from feature_engineering import NPEFeatureExtractor
from cohort_analysis import CohortAnalyzer

extractor = NPEFeatureExtractor()
npe_ids = [
    "spiffe://ncba.local/db/postgres-primary",
    "spiffe://ncba.local/service/payment-api",
    "spiffe://ncba.local/iot/sensor-001"
]

features = [extractor.extract_features(sid, window_hours=72) for sid in npe_ids]
features = [f for f in features if f]

if not features:
    print("[ERROR] No telemetry found. Run seed_telemetry.py first.")
    sys.exit(1)

analyzer = CohortAnalyzer(n_clusters=min(3, len(features)))
assigned = analyzer.assign_cohorts(features)

print("\n=== COHORT ASSIGNMENTS ===")
for f in assigned:
    print(f"{f['spiffe_id']}: cohort={f['cohort']} ({f['cohort_label']})")

print("\n=== PEER DEVIATION ===")
for f in assigned:
    dev = analyzer.peer_deviation_score(f)
    print(f"{f['spiffe_id']}: deviation={dev:.4f}")