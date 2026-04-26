#!/usr/bin/env python3
import os
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

load_dotenv()

URL = os.getenv("INFLUX_URL", "http://localhost:8086")
TOKEN = os.getenv("INFLUX_TOKEN")
ORG = os.getenv("INFLUX_ORG", "ncba")
BUCKET = os.getenv("INFLUX_BUCKET", "telemetry")

if not TOKEN:
    raise RuntimeError("INFLUX_TOKEN not found in .env")

client = InfluxDBClient(url=URL, token=TOKEN, org=ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)

NPES = {
    "spiffe://ncba.local/db/postgres-primary": {
        "cohort": "database", "dst": ["10.0.0.5"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 900, "bytes_base": 5000
    },
    "spiffe://ncba.local/service/payment-api": {
        "cohort": "api_gateway", "dst": ["10.0.1.10", "10.0.1.11"],
        "cipher": "TLS_AES_128_GCM_SHA256", "period": 60, "bytes_base": 1200
    },
    "spiffe://ncba.local/iot/sensor-001": {
        "cohort": "iot_sensor", "dst": ["10.0.2.1"],
        "cipher": "TLS_AES_128_GCM_SHA256", "period": 300, "bytes_base": 200
    },
    "spiffe://ncba.local/web/frontend-01": {
        "cohort": "web_server", "dst": ["10.0.3.5", "10.0.3.6"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 30, "bytes_base": 800
    },
    "spiffe://ncba.local/cache/redis-01": {
        "cohort": "cache", "dst": ["10.0.0.5"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 120, "bytes_base": 3000
    },
    "spiffe://ncba.local/legacy/proxy-01": {
        "cohort": "legacy_proxy", "dst": ["10.0.4.1"],
        "cipher": "TLS_RSA_WITH_AES_256_GCM_SHA384", "period": 600, "bytes_base": 1000
    },
}

def seed_normal(npe_id, profile, days=7):
    now = datetime.now(timezone.utc)
    points = []
    total_events = 0
    blocks = days * 24 * 4  # 4 events per 15-min block

    for i in range(blocks):
        t = now - timedelta(minutes=15 * i)
        jitter = random.gauss(0, profile["period"] * 0.05)
        for j in range(4):
            event_time = t + timedelta(seconds=j * (profile["period"] + jitter))
            dst = random.choice(profile["dst"])
            bytes_val = int(random.gauss(profile["bytes_base"], profile["bytes_base"] * 0.1))
            p = Point("tls_events") \
                .tag("spiffe_id", npe_id) \
                .tag("dst_ip", dst) \
                .tag("cipher_suite", profile["cipher"]) \
                .field("bytes", max(0, bytes_val)) \
                .time(event_time)
            points.append(p)
            total_events += 1
            if len(points) >= 1000:
                write_api.write(bucket=BUCKET, record=points)
                points = []

    if points:
        write_api.write(bucket=BUCKET, record=points)
    print(f"[SEED] {npe_id}: {total_events} normal events")

def seed_anomaly_recent(npe_id, profile, anomaly_type):
    """Inject anomaly within the LAST 6 hours so 24h/72h queries catch it."""
    now = datetime.now(timezone.utc)
    points = []

    for h in range(6):
        t = now - timedelta(hours=h, minutes=random.randint(0, 30))
        if anomaly_type == "lateral_movement":
            dst = "10.99.99.99"
            bytes_val = 50000
            cipher = profile["cipher"]
        elif anomaly_type == "weak_cipher":
            dst = random.choice(profile["dst"])
            bytes_val = profile["bytes_base"] * 3
            cipher = "TLS_RSA_WITH_RC4_128_SHA"
        else:
            continue

        p = Point("tls_events") \
            .tag("spiffe_id", npe_id) \
            .tag("dst_ip", dst) \
            .tag("cipher_suite", cipher) \
            .field("bytes", bytes_val) \
            .time(t)
        points.append(p)

    write_api.write(bucket=BUCKET, record=points)
    print(f"[SEED] {npe_id}: {len(points)} RECENT anomalous events ({anomaly_type})")

if __name__ == "__main__":
    for npe, profile in NPES.items():
        seed_normal(npe, profile, days=7)

    # Inject recent anomalies (visible to 24h/72h queries)
    seed_anomaly_recent("spiffe://ncba.local/db/postgres-primary",
                        NPES["spiffe://ncba.local/db/postgres-primary"],
                        "lateral_movement")
    seed_anomaly_recent("spiffe://ncba.local/web/frontend-01",
                        NPES["spiffe://ncba.local/web/frontend-01"],
                        "weak_cipher")

    print("[DONE] Telemetry seeded.")