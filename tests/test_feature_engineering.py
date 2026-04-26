#!/usr/bin/env python3
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analytics'))

from feature_engineering import NPEFeatureExtractor

extractor = NPEFeatureExtractor()

for spiffe_id in [
    "spiffe://ncba.local/db/postgres-primary",
    "spiffe://ncba.local/service/payment-api",
    "spiffe://ncba.local/iot/sensor-001"
]:
    features = extractor.extract_features(spiffe_id, window_hours=72)
    print(f"\n=== {spiffe_id} ===")
    if not features:
        print("  (no data)")
        continue
    for k, v in features.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
        else:
            print(f"  {k}: {v}")