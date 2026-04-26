# netflow_collector.py
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import socket, struct, time

client = InfluxDBClient(url="http://localhost:8086", token="your-token", org="ncba")
write_api = client.write_api(write_options=SYNCHRONOUS)

def parse_netflow_v9(data, src_addr):
    # Simplified NetFlow v9 parser
    # In production use python-netflow library
    header = struct.unpack('!HHIIII', data[:20])
    version, count, uptime, timestamp, seq, source_id = header

    point = (Point("netflow")
             .tag("src_ip", src_addr[0])
             .field("flow_count", count)
             .field("sequence", seq)
             .time(timestamp))
    write_api.write(bucket="telemetry", record=point)

def start_netflow_listener(port=2055):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", port))
    print(f"[NetFlow] Listening on UDP {port}")
    while True:
        data, addr = sock.recvfrom(65535)
        parse_netflow_v9(data, addr)