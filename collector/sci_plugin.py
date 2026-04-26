# sci_plugin.py  — Snort Certificate Inspector
import socket
import struct
import json
from kafka import KafkaProducer
from cryptography import x509
from cryptography.hazmat.backends import default_backend
import scapy.all as scapy
from scapy.layers.tls.all import TLS, TLSClientHello, TLSServerHello

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def extract_cert_metadata(packet):
    """Extract certificate serial, cipher, SNI from TLS handshake"""
    try:
        if packet.haslayer(TLS):
            tls_layer = packet[TLS]
            metadata = {
                "src_ip": packet["IP"].src,
                "dst_ip": packet["IP"].dst,
                "timestamp": float(packet.time),
                "tls_version": None,
                "cipher_suite": None,
                "sni": None,
                "cert_serial": None,
            }

            if packet.haslayer(TLSClientHello):
                hello = packet[TLSClientHello]
                metadata["tls_version"] = str(hello.version)
                # Extract SNI extension
                if hasattr(hello, 'ext'):
                    for ext in hello.ext:
                        if hasattr(ext, 'servernames'):
                            metadata["sni"] = ext.servernames[0].servername.decode()

            # Publish to Kafka for BAE
            producer.send('tls-events', metadata)
            print(f"[SCI] Captured TLS event from {metadata['src_ip']} SNI={metadata['sni']}")

    except Exception as e:
        print(f"[SCI] Error: {e}")

def start_capture(interface="eth0"):
    print(f"[SCI] Starting capture on {interface}")
    scapy.sniff(iface=interface, filter="tcp port 443", prn=extract_cert_metadata, store=0)

if __name__ == "__main__":
    start_capture()