# renewal_daemon.py
import time
import subprocess
from datetime import datetime
import psycopg2

class CertRenewalDaemon:
    def __init__(self, renewal_threshold=0.80):
        self.threshold = renewal_threshold
        self.db = psycopg2.connect("host=localhost dbname=ncba user=ncba password=ncba_secret")

    def get_certificates(self):
        cursor = self.db.cursor()
        cursor.execute("SELECT spiffe_id, issued_at, ttl_seconds FROM certificates WHERE active=true")
        return cursor.fetchall()

    def needs_renewal(self, issued_at, ttl_seconds):
        elapsed = (datetime.utcnow() - issued_at).total_seconds()
        return elapsed >= (ttl_seconds * self.threshold)

    def renew(self, spiffe_id):
        print(f"[RENEWAL] Triggering renewal for {spiffe_id}")
        subprocess.run([
            "./spire-server", "entry", "refresh",
            "-spiffeID", spiffe_id
        ])

    def run(self):
        while True:
            for spiffe_id, issued_at, ttl in self.get_certificates():
                if self.needs_renewal(issued_at, ttl):
                    self.renew(spiffe_id)
            time.sleep(60)  # check every minute

if __name__ == "__main__":
    CertRenewalDaemon().run()