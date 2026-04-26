#!/usr/bin/env python3
"""
Phase 4 Integration Test (Fixed)
Pipeline: InfluxDB → Features → IF + LSTM + Cohort → Risk Score
"""
from dotenv import load_dotenv
load_dotenv()

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analytics'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'risk'))

import numpy as np
from feature_engineering import NPEFeatureExtractor
from isolation_forest_model import IsolationForestDetector
from lstm_autoencoder import LSTMAutoencoder
from cohort_analysis import CohortAnalyzer
from risk_scorer import RiskScorer

NPE_IDS = [
    "spiffe://ncba.local/db/postgres-primary",
    "spiffe://ncba.local/service/payment-api",
    "spiffe://ncba.local/iot/sensor-001",
    "spiffe://ncba.local/web/frontend-01",
    "spiffe://ncba.local/cache/redis-01",
    "spiffe://ncba.local/legacy/proxy-01",
]

def build_lstm_sequence(extractor, spiffe_id, seq_len=48):
    """Build (seq_len, 9) array from hourly snapshots. Oldest first."""
    seq = []
    for offset in range(seq_len):
        feat = extractor.extract_features_at_offset(spiffe_id, window_hours=1, offset_hours=offset)
        if feat:
            vec = [
                feat.get("iat_mean", 0), feat.get("iat_std", 0),
                feat.get("iat_cv", 0), feat.get("unique_dst_ips", 0),
                feat.get("unique_ciphers", 0), feat.get("total_requests", 0),
                feat.get("bytes_per_min", 0), feat.get("hourly_entropy", 0),
                feat.get("active_hours", 0),
            ]
        else:
            vec = [0.0] * 9
        seq.append(vec)
    # offset=0 is newest, offset=47 is oldest → reverse
    return np.array(list(reversed(seq)))

def synthesize_training_sequences(base_seq, n_samples=25, noise=0.07):
    """Create synthetic normal sequences by perturbing a clean baseline."""
    synth = []
    for _ in range(n_samples):
        perturbed = base_seq * (1 + np.random.normal(0, noise, base_seq.shape))
        synth.append(perturbed)
    return np.array(synth)

print("=" * 60)
print("PHASE 4 INTEGRATION TEST (FIXED)")
print("=" * 60)

# 1. Feature Engineering (72h window = more baseline + catches 6h anomaly)
print("\n[1/5] Extracting features (72h window)...")
extractor = NPEFeatureExtractor()
feature_list = [extractor.extract_features(sid, window_hours=72) for sid in NPE_IDS]
feature_list = [f for f in feature_list if f]

if len(feature_list) < 4:
    print("[FATAL] Need >= 4 NPEs with telemetry. Run seed_telemetry.py first.")
    sys.exit(1)
print(f"      Extracted features for {len(feature_list)} NPEs")

# 2. Isolation Forest
print("\n[2/5] Training Isolation Forest...")
# 2 anomalies out of 6 NPEs ≈ 0.33, but IF expects ratio of outliers in training set.
# We use 0.15 to make it sensitive; with 6 samples it will flag ~1.
if_detector = IsolationForestDetector(contamination=0.15)
if_detector.train(feature_list)
os.makedirs("models", exist_ok=True)
if_detector.save("models/isolation_forest.pkl")
print("      Saved to models/isolation_forest.pkl")

# 3. Cohort Analysis
print("\n[3/5] Running cohort analysis...")
# 3 clusters for 6 NPEs = 2 per cluster on average (meaningful)
cohort_analyzer = CohortAnalyzer(n_clusters=3)
assigned = cohort_analyzer.assign_cohorts(feature_list)
for f in assigned:
    print(f"      {f['spiffe_id']}: cohort={f['cohort']} ({f['cohort_label']})")

# 4. LSTM Autoencoder
print("\n[4/5] LSTM Autoencoder...")
# Train on clean IoT data, test on anomalous DB/Web
iot_seq = build_lstm_sequence(extractor, "spiffe://ncba.local/iot/sensor-001")
db_seq = build_lstm_sequence(extractor, "spiffe://ncba.local/db/postgres-primary")
web_seq = build_lstm_sequence(extractor, "spiffe://ncba.local/web/frontend-01")

X_train = synthesize_training_sequences(iot_seq, n_samples=25, noise=0.07)
lstm = LSTMAutoencoder(sequence_length=48, n_features=9)
lstm.train(X_train, epochs=30)

lstm_scores = {}
for label, seq in [("DB (anomaly)", db_seq), ("IoT (clean)", iot_seq), ("Web (anomaly)", web_seq)]:
    sid = {
        "DB (anomaly)": "spiffe://ncba.local/db/postgres-primary",
        "IoT (clean)": "spiffe://ncba.local/iot/sensor-001",
        "Web (anomaly)": "spiffe://ncba.local/web/frontend-01"
    }[label]
    score = lstm.score(seq.reshape(1, 48, 9))
    lstm_scores[sid] = score
    print(f"      {label}: LSTM score={score:.4f}")

# 5. Risk Scoring
print("\n[5/5] Computing risk scores...")
scorer = RiskScorer()

for f in assigned:
    sid = f['spiffe_id']
    if_score = if_detector.score(f)
    lstm_score = lstm_scores.get(sid, 0.0)
    # Combine IF and LSTM: if either fires, behavioral is elevated
    behavioral = max(if_score, lstm_score * 0.9)

    peer = cohort_analyzer.peer_deviation_score(f)
    temporal = 0.12
    # Threat intel bump for anomalous indicators
    threat_intel = 0.0
    if f.get("unique_dst_ips", 0) > 2:
        threat_intel += 0.08
    if f.get("unique_ciphers", 0) > 1:
        threat_intel += 0.06

    result = scorer.score(sid, behavioral, temporal, peer, threat_intel)
    print(f"\n  {sid}")
    print(f"    Total: {result.total:.1f} | Level: {result.level}")
    print(f"    IF={if_score:.3f} LSTM={lstm_score:.3f} Behavioral={result.behavioral:.1f} "
          f"Temporal={result.temporal:.1f} Peer={result.peer:.1f} Intel={result.threat_intel:.1f}")

print("\n" + "=" * 60)
print("PHASE 4 TEST COMPLETE")
print("=" * 60)