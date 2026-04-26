sudo apt update && sudo apt install -y docker.io docker-compose kubectl helm snort nmap

pip install scikit-learn tensorflow keras pandas numpy influxdb-client kafka-python redis psycopg2 fastapi uvicorn

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -s bash -
sudo apt install -y nodejs

# Download SPIRE
wget https://github.com/spiffe/spire/releases/download/v1.9.0/spire-1.9.0-linux-amd64-musl.tar.gz
tar -xzvf spire-1.9.0-linux-amd64-musl.tar.gz
cd spire-1.9.0/


docker compose exec spire-server /opt/spire/bin/spire-server token generate \
  -spiffeID spiffe://ncba.local/agent/ncba-agent

  