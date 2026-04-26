#!/usr/bin/env python3
"""
Response Orchestrator — LIVE MODE
Executes: CHALLENGE → re-attest | RATE_LIMIT → iptables | REVOKE → SPIRE + block
"""
import os
import sys
import subprocess
import logging
import time
from dotenv import load_dotenv
load_dotenv()

from kafka import KafkaConsumer, KafkaProducer
import json

logger = logging.getLogger("NCBA.Response")
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

SPIRE_CONTAINER = "ncba-spire-server-1"
SPIRE_BIN = "/opt/spire/bin/spire-server"

class ResponseOrchestrator:
    def __init__(self):
        self.consumer = KafkaConsumer(
            'risk-decisions',
            bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
            value_deserializer=lambda m: json.loads(m.decode()),
            auto_offset_reset='latest',
            group_id='ncba-response'
        )
        self.producer = KafkaProducer(
            bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
            value_serializer=lambda v: json.dumps(v).encode()
        )

    def handle(self, decision: dict):
        spiffe_id = decision["spiffe_id"]
        level = decision["level"]
        src_ip = decision.get("src_ip", "unknown")
        score = decision.get("score", 0)
        start_time = time.time()

        logger.info(f"[DECISION] {spiffe_id} → {level} (score={score:.1f})")

        if level == "GREEN":
            self._log_event(spiffe_id, level, f"Nominal behavior (score={score:.1f})")

        elif level == "CHALLENGE":
            self._trigger_re_attestation(spiffe_id)

        elif level == "RATE_LIMIT":
            self._apply_rate_limit(src_ip, spiffe_id)

        elif level == "REVOKE":
            self._revoke_certificate(spiffe_id)
            if src_ip and src_ip != "unknown":
                self._block_ip(src_ip)
            self._publish_to_blockchain(spiffe_id, level, decision)

        elapsed = time.time() - start_time
        logger.info(f"[RESPONSE] {level} executed in {elapsed:.2f}s")

    def _revoke_certificate(self, spiffe_id: str):
        cmd = [
            "docker", "exec", SPIRE_CONTAINER,
            SPIRE_BIN, "entry", "delete",
            "-spiffeID", spiffe_id
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            logger.warning(f"[REVOKE] ✓ {spiffe_id} certificate REVOKED")
        else:
            logger.error(f"[REVOKE] ✗ {spiffe_id}: {result.stderr.strip()}")

    def _block_ip(self, ip: str):
        for cmd in [
            ["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"],
            ["sudo", "iptables", "-A", "OUTPUT", "-d", ip, "-j", "DROP"]
        ]:
            subprocess.run(cmd, capture_output=True)
        logger.warning(f"[BLOCK] ✓ IP {ip} blocked via iptables")

    def _apply_rate_limit(self, ip: str, spiffe_id: str):
        if not ip or ip == "unknown":
            logger.warning(f"[RATE_LIMIT] No IP for {spiffe_id}, skipping")
            return
        for cmd in [
            ["sudo", "iptables", "-A", "INPUT", "-s", ip, "-m", "limit", "--limit", "10/min", "-j", "ACCEPT"],
            ["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"]
        ]:
            subprocess.run(cmd, capture_output=True)
        logger.warning(f"[RATE_LIMIT] ✓ {ip} throttled to 10/min")

    def _trigger_re_attestation(self, spiffe_id: str):
        self.producer.send('re-attestation-requests', {"spiffe_id": spiffe_id})
        logger.warning(f"[CHALLENGE] ✓ Re-attestation triggered for {spiffe_id}")

    def _publish_to_blockchain(self, spiffe_id: str, level: str, data: dict):
        self.producer.send('blockchain-events', {
            "type": "REVOCATION",
            "spiffe_id": spiffe_id,
            "risk_level": level,
            "evidence": data
        })
        logger.info(f"[BLOCKCHAIN] Revocation event queued for {spiffe_id}")

    def _log_event(self, spiffe_id, level, message):
        self.producer.send('audit-log', {
            "spiffe_id": spiffe_id, "level": level, "message": message
        })

    def run(self):
        logger.info("[RESPONSE] Orchestrator LIVE — listening on risk-decisions")
        for message in self.consumer:
            self.handle(message.value)

if __name__ == "__main__":
    ResponseOrchestrator().run()