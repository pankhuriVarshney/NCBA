#!/usr/bin/env python3
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analytics'))

import numpy as np
from feature_engineering import NPEFeatureExtractor
from lstm_autoencoder import LSTMAutoencoder

extractor = NPEFeatureExtractor()
npe_id = "spiffe://ncba.local/db/postgres-primary"

sequences = []
for offset in range(48, 0, -1):
    features = extractor.extract_features(npe_id, window_hours=offset)
    if features:
        vec = [
            features.get("iat_mean", 0),
            features.get("iat_std", 0),
            features.get("iat_cv", 0),
            features.get("unique_dst_ips", 0),
            features.get("unique_ciphers", 0),
            features.get("total_requests", 0),
            features.get("bytes_per_min", 0),
            features.get("hourly_entropy", 0),
            features.get("active_hours", 0),
        ]
        sequences.append(vec)

print(f"[INFO] Collected {len(sequences)} hourly snapshots")

if len(sequences) < 48:
    print(f"[WARN] Only {len(sequences)} hours of data. Padding with zeros.")
    while len(sequences) < 48:
        sequences.insert(0, [0.0]*9)

X = np.array(sequences[-48:]).reshape(1, 48, 9)
print(f"[INPUT] Shape: {X.shape}")

model = LSTMAutoencoder(sequence_length=48, n_features=9)
model.train(X, epochs=20)

score = model.score(X)
print(f"[SCORE] Reconstruction error ratio: {score:.4f} (threshold={model.threshold:.4f})")

# Simulate drift
X_drift = X.copy()
X_drift[0, -6:, 6] *= 5.0
drift_score = model.score(X_drift)
print(f"[DRIFT] After bytes spike: {drift_score:.4f}")