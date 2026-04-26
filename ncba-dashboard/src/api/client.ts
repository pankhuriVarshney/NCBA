// api/client.ts
import axios from 'axios';
import { NPE, Alert } from '../types/npe';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8088';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

// ── Real API calls ────────────────────────────────────────────────

export const listNPEs = () => api.get<NPE[]>('/api/v1/npes');
export const getAlerts = () => api.get<Alert[]>('/api/v1/alerts');
export const getScore = (spiffe_id: string) => api.get(`/api/v1/score/${spiffe_id}`);
export const evaluate = (spiffe_id: string, src_ip?: string) =>
  api.post('/api/v1/evaluate', { spiffe_id, src_ip });

// ── Mock data (used only when API is unreachable) ─────────────────

export const listNPEsMock = async () => {
  const mock: NPE[] = [
    { spiffe_id: "spiffe://ncba.local/service/postgres-primary", name: "postgres-primary", score: 34.6, level: "CHALLENGE", last_seen: Date.now() / 1000 },
    { spiffe_id: "spiffe://ncba.local/service/payment-api", name: "payment-api", score: 23.5, level: "GREEN", last_seen: Date.now() / 1000 },
    { spiffe_id: "spiffe://ncba.local/iot/sensor-001", name: "sensor-001", score: 17.8, level: "GREEN", last_seen: Date.now() / 1000 },
    { spiffe_id: "spiffe://ncba.local/service/frontend-01", name: "frontend-01", score: 32.3, level: "CHALLENGE", last_seen: Date.now() / 1000 },
    { spiffe_id: "spiffe://ncba.local/service/redis-01", name: "redis-01", score: 23.6, level: "GREEN", last_seen: Date.now() / 1000 },
    { spiffe_id: "spiffe://ncba.local/proxy/proxy-01", name: "proxy-01", score: 18.9, level: "GREEN", last_seen: Date.now() / 1000 },
  ];
  return { data: mock };
};

export const getAlertsMock = async () => {
  const mock: Alert[] = [
    { spiffe_id: "spiffe://ncba.local/service/postgres-primary", level: "CHALLENGE", score: 34.6, timestamp: Date.now() / 1000, msg: "Behavioral deviation detected", action: "Re-attestation triggered" },
    { spiffe_id: "spiffe://ncba.local/service/frontend-01", level: "CHALLENGE", score: 32.3, timestamp: Date.now() / 1000 - 120, msg: "Unusual traffic pattern", action: "Re-attestation triggered" },
  ];
  return { data: mock };
};