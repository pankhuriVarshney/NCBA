#!/usr/bin/env python3
"""
Live Traffic Simulator
Replaces physical Snort/NetFlow by publishing synthetic events to Kafka and InfluxDB.
"""
import os
import time
import random
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from kafka import KafkaProducer
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

NPES = {
    "spiffe://ncba.local/db/postgres-primary": {
        "src_ip": "10.0.0.10", "dst": ["10.0.0.5"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 900, "bytes_base": 5000
    },
    "spiffe://ncba.local/service/payment-api": {
        "src_ip": "10.0.1.20", "dst": ["10.0.1.10", "10.0.1.11"],
        "cipher": "TLS_AES_128_GCM_SHA256", "period": 60, "bytes_base": 1200
    },
    "spiffe://ncba.local/iot/sensor-001": {
        "src_ip": "10.0.2.30", "dst": ["10.0.2.1"],
        "cipher": "TLS_AES_128_GCM_SHA256", "period": 300, "bytes_base": 200
    },
    "spiffe://ncba.local/web/frontend-01": {
        "src_ip": "10.0.3.40", "dst": ["10.0.3.5", "10.0.3.6"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 30, "bytes_base": 800
    },
    "spiffe://ncba.local/cache/redis-01": {
        "src_ip": "10.0.0.50", "dst": ["10.0.0.5"],
        "cipher": "TLS_AES_256_GCM_SHA384", "period": 120, "bytes_base": 3000
    },
    "spiffe://ncba.local/legacy/proxy-01": {
        "src_ip": "10.0.4.60", "dst": ["10.0.4.1"],
        "cipher": "TLS_RSA_WITH_AES_256_GCM_SHA384", "period": 600, "bytes_base": 1000
    },
}

producer = KafkaProducer(
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

influx = InfluxDBClient(
    url=os.getenv('INFLUX_URL'),
    token=os.getenv('INFLUX_TOKEN'),
    org=os.getenv('INFLUX_ORG')
)
write_api = influx.write_api(write_options=SYNCHRONOUS)
bucket = os.getenv('INFLUX_BUCKET', 'telemetry')

def simulate_event(spiffe_id, profile, anomaly=False):
    now = datetime.now(timezone.utc)
    dst = random.choice(profile["dst"])
    bytes_val = int(random.gauss(profile["bytes_base"], profile["bytes_base"] * 0.1))
    cipher = profile["cipher"]

    if anomaly:
        if "postgres-primary" in spiffe_id:
            dst = "10.99.99.99"
            bytes_val = 50000
        elif "frontend-01" in spiffe_id:
            cipher = "TLS_RSA_WITH_RC4_128_SHA"
            bytes_val = profile["bytes_base"] * 3

    # 1. Kafka (simulates Snort SCI output)
    producer.send('tls-events', {
        "src_ip": profile["src_ip"],
        "dst_ip": dst,
        "spiffe_id": spiffe_id,
        "cipher_suite": cipher,
        "sni": dst,
        "bytes": bytes_val,
        "timestamp": now.timestamp()
    })

    # 2. InfluxDB (simulates NetFlow enrichment)
    point = Point("tls_events") \
        .tag("spiffe_id", spiffe_id) \
        .tag("src_ip", profile["src_ip"]) \
        .tag("dst_ip", dst) \
        .tag("cipher_suite", cipher) \
        .field("bytes", max(0, bytes_val)) \
        .time(now)
    write_api.write(bucket=bucket, record=point)

def run(duration_seconds=300, anomaly_start=120):
    print(f"[SIM] Running for {duration_seconds}s | Anomaly starts at t={anomaly_start}s")
    start = time.time()
    # INITIAL BURST: every NPE emits 5 events immediately so pipeline has data
    print("[SIM] Initial burst: 5 events per NPE")
    for _ in range(5):
        for sid, profile in NPES.items():
            simulate_event(sid, profile, anomaly=False)
    time.sleep(2)

    event_count = 30  # account for burst

    while time.time() - start < duration_seconds:
        elapsed = time.time() - start
        anomaly_mode = (elapsed > anomaly_start)

        for sid, profile in NPES.items():
            if random.random() < (5.0 / profile["period"]):
                simulate_event(sid, profile, anomaly=anomaly_mode)
                event_count += 1

        if anomaly_mode and int(elapsed) % 10 == 0:
            print(f"[SIM] t={int(elapsed):03d}s | ANOMALY ACTIVE | events={event_count}")

        time.sleep(1)

    print(f"[SIM] Finished. Total events: {event_count}")

if __name__ == "__main__":
    run(duration_seconds=300, anomaly_start=120)