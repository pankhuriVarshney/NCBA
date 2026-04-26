#!/bin/bash
set -e
cd "$(dirname "$0")/.."

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Load environment variables
if [ -f ".env" ]; then
    set -a && source .env && set +a
fi

cleanup() {
    echo "[*] Shutting down pipeline..."
    kill $DAEMON_PID $BRIDGE_PID $RESPONSE_PID $SIM_PID 2>/dev/null || true
    exit
}
trap cleanup INT TERM

echo "[*] NCBA Phase 3→4 Integration Launcher"
echo "[*] DRY_RUN=${NCBA_DRY_RUN:-true} (safe mode — no revocations or iptables changes)"
echo "[*] API_URL=${REACT_APP_API_URL:-http://127.0.0.1:8088}"

# Create logs directory
mkdir -p logs

# 0. Analytics Pipeline Daemon (NEW — writes real-time risk scores to Redis)
echo "[*] (0/4) Starting Analytics Pipeline Daemon..."
python pipeline_daemon.py > logs/pipeline.log 2>&1 &
DAEMON_PID=$!

# 1. Kafka → InfluxDB Bridge
echo "[*] (1/4) Starting Kafka→InfluxDB Bridge..."
python collector/kafka_influx_bridge.py > logs/bridge.log 2>&1 &
BRIDGE_PID=$!

# 2. Response Orchestrator (DRY_RUN for safety)
echo "[*] (2/4) Starting Response Orchestrator..."
NCBA_DRY_RUN=true python risk/response_orchestrator.py > logs/response.log 2>&1 &
RESPONSE_PID=$!

# 3. Traffic Simulator (creates live data)
echo "[*] (3/4) Starting Traffic Simulator (anomaly at t=120s)..."
python tests/traffic_simulator.py > logs/simulator.log 2>&1 &
SIM_PID=$!

echo "[*] (4/4) Pipeline components started. Watching logs..."
echo "[*] Redis keys will be populated at: risk:<spiffe_id>"
echo "[*] API endpoint: http://127.0.0.1:8088/api/v1/npes"
echo "------------------------------------------------"

# Tail the pipeline log so you can see scores in real-time
tail -f logs/pipeline.log

# If tail exits, cleanup
cleanup