# blockchain_bridge.py
from hfc.fabric import Client as FabricClient
from kafka import KafkaConsumer
import json, asyncio

class BlockchainBridge:
    """Listens to Kafka and writes events to Hyperledger Fabric"""

    def __init__(self):
        self.fabric = FabricClient(net_profile="network.json")
        self.consumer = KafkaConsumer(
            'blockchain-events',
            bootstrap_servers='localhost:9092',
            value_deserializer=lambda m: json.loads(m.decode())
        )

    async def log_to_chain(self, event: dict):
        org1_admin = self.fabric.get_user('org1.example.com', 'Admin')
        channel = self.fabric.new_channel('ncba-channel')

        event_type = event.get("type")
        spiffe_id = event.get("spiffe_id")

        if event_type == "ISSUED":
            fcn, args = "LogIssuance", [spiffe_id, json.dumps(event)]
        elif event_type == "BEHAVIORAL":
            fcn, args = "LogBehavioral", [spiffe_id,
                str(event.get("risk_score", 0)), json.dumps(event)]
        elif event_type == "REVOCATION":
            fcn, args = "InitiateRevocation", [spiffe_id, "system", json.dumps(event)]
        else:
            return

        response = await channel.chaincode_invoke(
            requestor=org1_admin,
            channel_name='ncba-channel',
            peers=['peer0.org1.example.com'],
            args=args,
            cc_name='ncba',
            fcn=fcn
        )
        print(f"[BCT] {event_type} logged for {spiffe_id}: {response}")

    def run(self):
        loop = asyncio.get_event_loop()
        for msg in self.consumer:
            loop.run_until_complete(self.log_to_chain(msg.value))