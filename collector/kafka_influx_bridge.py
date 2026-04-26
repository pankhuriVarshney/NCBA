#!/usr/bin/env python3
"""
Kafka → InfluxDB Bridge
Links Phase 3 (Snort SCI / Kafka) to Phase 4 (InfluxDB queries)
"""
import os
import json
from dotenv import load_dotenv
load_dotenv()

from kafka import KafkaConsumer
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

class KafkaInfluxBridge:
    def __init__(self):
        self.consumer = KafkaConsumer(
            'tls-events',
            bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest',
            group_id='ncba-influx-bridge'
        )
        self.influx = InfluxDBClient(
            url=os.getenv('INFLUX_URL'),
            token=os.getenv('INFLUX_TOKEN'),
            org=os.getenv('INFLUX_ORG')
        )
        self.write_api = self.influx.write_api(write_options=SYNCHRONOUS)
        self.bucket = os.getenv('INFLUX_BUCKET', 'telemetry')

    def run(self):
        print("[BRIDGE] Kafka → InfluxDB bridge running. Waiting for tls-events...")
        for msg in self.consumer:
            data = msg.value
            point = Point("tls_events") \
                .tag("src_ip", data.get("src_ip", "unknown")) \
                .tag("dst_ip", data.get("dst_ip", "unknown")) \
                .tag("spiffe_id", data.get("spiffe_id", "unknown")) \
                .tag("cipher_suite", data.get("cipher_suite", "unknown")) \
                .tag("sni", data.get("sni", "unknown")) \
                .field("bytes", data.get("bytes", 0))

            ts = data.get("timestamp")
            if ts:
                point = point.time(float(ts))

            self.write_api.write(bucket=self.bucket, record=point)
            print(f"[BRIDGE] {data.get('src_ip')} → InfluxDB "
                  f"(spiffe={data.get('spiffe_id','?')}, cipher={data.get('cipher_suite','N/A')})")

if __name__ == "__main__":
    KafkaInfluxBridge().run()