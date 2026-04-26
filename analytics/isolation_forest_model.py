import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class IsolationForestDetector:
    def __init__(self, contamination=0.01):
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            "iat_mean", "iat_std", "iat_cv",
            "unique_dst_ips", "unique_ciphers",
            "total_requests", "bytes_per_min",
            "hourly_entropy", "active_hours"
        ]

    def prepare_features(self, feature_dict: dict) -> np.ndarray:
        return np.array([[feature_dict.get(f, 0) for f in self.feature_names]])

    def train(self, feature_list: list):
        """Train on 7+ days of normal behavior per NPE cohort"""
        if len(feature_list) < 2:
            raise ValueError(f"Need >= 2 samples, got {len(feature_list)}")
            
        X = np.array([[f.get(feat, 0) for feat in self.feature_names]
                      for f in feature_list])
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        print(f"[IF] Trained on {len(X)} samples")

    def score(self, features: dict) -> float:
        """Returns anomaly score 0-1 (higher = more anomalous)"""
        X = self.prepare_features(features)
        X_scaled = self.scaler.transform(X)
        raw_score = self.model.decision_function(X_scaled)[0]
        # Normalize to 0-1 range (negative = anomalous in sklearn)
        normalized = 1 / (1 + np.exp(raw_score * 5))
        return float(normalized)

    def save(self, path="models/isolation_forest.pkl"):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        joblib.dump({"model": self.model, "scaler": self.scaler}, path)

    def load(self, path="models/isolation_forest.pkl"):
        data = joblib.load(path)
        self.model = data["model"]
        self.scaler = data["scaler"]