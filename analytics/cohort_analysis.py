from sklearn.cluster import KMeans
import numpy as np

class CohortAnalyzer:
    """
    Groups NPEs by type (DB, gateway, IoT, API) so a database's
    normal behavior doesn't look anomalous vs a web server.
    """
    COHORT_LABELS = {
        0: "database", 1: "api_gateway", 2: "iot_sensor",
        3: "microservice", 4: "legacy_proxy"
    }

    def __init__(self, n_clusters=5):
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.cohort_baselines = {}

    def assign_cohorts(self, all_features: list):
        """Cluster NPEs into cohorts based on behavior"""
        if len(all_features) < 2:
            # Not enough to cluster — assign all to cohort 0
            for f in all_features:
                f["cohort"] = 0
                f["cohort_label"] = self.COHORT_LABELS.get(0, "unknown")
            self.cohort_baselines[0] = {}
            return all_features

        X = np.array([[f.get("iat_cv", 0), f.get("unique_dst_ips", 0),
                       f.get("hourly_entropy", 0), f.get("bytes_per_min", 0)]
                      for f in all_features])
        labels = self.kmeans.fit_predict(X)

        for i, features in enumerate(all_features):
            features["cohort"] = int(labels[i])
            features["cohort_label"] = self.COHORT_LABELS.get(labels[i], "unknown")

        # Compute per-cohort baselines
        unique_labels = set(labels)
        for cohort_id in unique_labels:
            cohort_features = [f for f, l in zip(all_features, labels) if l == cohort_id]
            if cohort_features:
                self.cohort_baselines[cohort_id] = {
                    "iat_mean_avg": np.mean([f.get("iat_mean", 0) for f in cohort_features]),
                    "bytes_per_min_p95": np.percentile([f.get("bytes_per_min", 0) for f in cohort_features], 95),
                    "unique_dst_avg": np.mean([f.get("unique_dst_ips", 0) for f in cohort_features]),
                }

        return all_features

    def peer_deviation_score(self, features: dict) -> float:
        """How much does this NPE deviate from its cohort peers?"""
        cohort_id = features.get("cohort", 0)
        baseline = self.cohort_baselines.get(cohort_id, {})
        if not baseline:
            return 0.0

        deviations = []
        if baseline.get("bytes_per_min_p95", 0) > 0:
            ratio = features.get("bytes_per_min", 0) / baseline["bytes_per_min_p95"]
            deviations.append(min(ratio, 3.0) / 3.0)

        if baseline.get("unique_dst_avg", 0) > 0:
            ratio = features.get("unique_dst_ips", 0) / (baseline["unique_dst_avg"] + 1)
            deviations.append(min(ratio, 5.0) / 5.0)

        return float(np.mean(deviations)) if deviations else 0.0