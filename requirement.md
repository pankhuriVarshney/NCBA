sudo apt update && sudo apt install -y docker.io docker-compose kubectl helm snort nmap

pip install scikit-learn tensorflow keras pandas numpy influxdb-client kafka-python redis psycopg2 fastapi uvicorn

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -s bash -
sudo apt install -y nodejs

# Download SPIRE
wget https://github.com/spiffe/spire/releases/download/v1.9.0/spire-1.9.0-linux-amd64-musl.tar.gz
tar -xzvf spire-1.9.0-linux-amd64-musl.tar.gz
cd spire-1.9.0/

# Start SPIRE server
./bin/spire-server run -config server.conf &

# Generate join token for agents
./bin/spire-server token generate -spiffeID spiffe://ncba.local/agent/ncba-agent

# Register a microservice NPE
./bin/spire-server entry create \
  -parentID spiffe://ncba.local/agent/ncba-agent \
  -spiffeID spiffe://ncba.local/service/payment-api \
  -selector unix:user:payment \
  -ttl 3600  # 1 hour

# Register an IoT device (via proxy)
./bin/spire-server entry create \
  -parentID spiffe://ncba.local/agent/ncba-agent \
  -spiffeID spiffe://ncba.local/iot/sensor-001 \
  -selector unix:user:iot-proxy \
  -ttl 1800  # 30 min