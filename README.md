# NCBA
Non-Person Entity Certificate Behavior Analysis Framework




# SPIRE Verifivation

## 1. Agent healthcheck
docker compose exec spire-agent /opt/spire/bin/spire-agent healthcheck \
  -socketPath /tmp/spire-agent/public/api.sock

## 2. Server sees the agent
docker compose exec spire-server /opt/spire/bin/spire-server agent list

## 3. List registered workload entries
docker compose exec spire-server /opt/spire/bin/spire-server entry show

## 4. Fetch an SVID directly from the agent
docker compose exec spire-agent /opt/spire/bin/spire-agent api fetch \
  -socketPath /tmp/spire-agent/public/api.sock

## Create Token
docker compose exec spire-server /opt/spire/bin/spire-server token generate \
  -spiffeID spiffe://ncba.local/agent/ncba-agent

## Create Entry
docker compose exec spire-server /opt/spire/bin/spire-server entry create \
  -parentID spiffe://ncba.local/agent/test-agent \
  -spiffeID spiffe://ncba.local/service/test-api \
  -selector unix:uid:0 \
  -ttl 300



 docker compose exec kafka kafka-topics \
  --bootstrap-server kafka:9092 \
  --create --topic tls-events \
  --partitions 3 --replication-factor 1

# Check kafka topic exists
docker compose exec kafka kafka-topics --bootstrap-server kafka:9092 --list | grep tls-events


# Get API Token of influxdb
docker compose exec influxdb influx auth list

TOKEN="rmKDTmSbieLetXbA6Yb71go1VilnD0R_ro90bCK2-sWVbm7xh9jNI-L8pr0-74Jj6mqdXidpRWY0RX_NKWpB_Q=="


curl -X POST "http://localhost:8086/api/v2/query?org=ncba" \
  -H "Authorization: Token $TOKEN" \
  -H "Accept: application/csv" \
  -H "Content-type: application/vnd.flux" \
  --data 'from(bucket:"telemetry") |> range(start:-1h)'


# Get SPIRE Tables
docker compose exec postgres psql -U ncba -d ncba -c "\dt"

