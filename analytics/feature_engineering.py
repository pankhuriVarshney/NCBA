import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from influxdb_client import InfluxDBClient

load_dotenv()

class NPEFeatureExtractor:
    def __init__(self):
        token = os.getenv("INFLUX_TOKEN")
        if not token:
            raise RuntimeError("INFLUX_TOKEN not set in environment or .env")
        
        self.client = InfluxDBClient(
            url=os.getenv("INFLUX_URL", "http://localhost:8086"),
            token=token,
            org=os.getenv("INFLUX_ORG", "ncba")
        )
        self.bucket = os.getenv("INFLUX_BUCKET", "telemetry")

    def _run_query(self, spiffe_id: str, start_h: int, stop_h: int = 0) -> list:
        query_api = self.client.query_api()
        stop_clause = f', stop: -{stop_h}h' if stop_h > 0 else ''
        
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{start_h}h{stop_clause})
          |> filter(fn: (r) => r.spiffe_id == "{spiffe_id}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"])
        '''
        try:
            tables = query_api.query(query)
            return [r.values for table in tables for r in table.records]
        except Exception as e:
            print(f"[FEATURES] Query failed: {e}")
            return []

    def extract_features(self, spiffe_id: str, window_hours: int = 24) -> dict:
        records = self._run_query(spiffe_id, window_hours, 0)
        return self._compute_features(spiffe_id, records, window_hours)

    def extract_features_at_offset(self, spiffe_id: str, window_hours: int = 1, offset_hours: int = 0) -> dict:
        """Pull a feature vector from a specific slice of the past."""
        records = self._run_query(spiffe_id, offset_hours + window_hours, offset_hours)
        return self._compute_features(spiffe_id, records, window_hours)

    def _compute_features(self, spiffe_id: str, records: list, window_hours: int) -> dict:
        if not records:
            return {}

        df = pd.DataFrame(records)
        if '_time' not in df.columns:
            return {}

        timestamps = pd.to_datetime(df['_time'])

        inter_arrival = timestamps.diff().dt.total_seconds().dropna()
        iat_mean = float(inter_arrival.mean()) if len(inter_arrival) > 0 else 0.0
        iat_std = float(inter_arrival.std()) if len(inter_arrival) > 0 else 0.0
        iat_cv = iat_std / iat_mean if iat_mean > 0 else 0.0

        unique_dst = df['dst_ip'].nunique() if 'dst_ip' in df.columns else 0
        unique_ciphers = df['cipher_suite'].nunique() if 'cipher_suite' in df.columns else 0

        hourly_counts = timestamps.dt.hour.value_counts().reindex(range(24), fill_value=0)

        total_requests = len(df)
        bytes_per_min = 0.0
        if 'bytes' in df.columns:
            total_bytes = pd.to_numeric(df['bytes'], errors='coerce').sum()
            bytes_per_min = float(total_bytes) / (window_hours * 60)

        result = {
            "spiffe_id": spiffe_id,
            "iat_mean": iat_mean,
            "iat_std": iat_std,
            "iat_cv": iat_cv,
            "unique_dst_ips": int(unique_dst),
            "unique_ciphers": int(unique_ciphers),
            "total_requests": int(total_requests),
            "bytes_per_min": bytes_per_min,
            "hourly_entropy": self._entropy(hourly_counts.values),
            "active_hours": int((hourly_counts > 0).sum()),
        }

        # SANITIZE: NaN/Inf breaks scikit-learn
        for k, v in list(result.items()):
            if isinstance(v, float) and (pd.isna(v) or np.isinf(v)):
                result[k] = 0.0

        return result

    def _entropy(self, counts):
        total = counts.sum()
        if total == 0:
            return 0.0
        probs = counts / total
        probs = probs[probs > 0]
        return float(-np.sum(probs * np.log2(probs)))