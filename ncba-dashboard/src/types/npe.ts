export type RiskLevel = "GREEN" | "CHALLENGE" | "RATE_LIMIT" | "REVOKE";

export interface NPE {
  spiffe_id: string;
  name: string;
  score: number;
  level: RiskLevel;
  last_seen: number;
  // Extended fields for detail view
  type?: string;
  ip?: string;
  cohort?: string;
  ttl?: string;
  status?: "active" | "revoked" | "expiring";
}

export interface Alert {
  spiffe_id: string;
  level: string;
  score: number;
  timestamp: number;
  msg?: string;
  action?: string;
}

export interface Certificate {
  serial: string;
  npe: string;
  issued: string;
  expires: string;
  pct: number;
  status: "active" | "expiring" | "revoked";
}

export interface BlockchainEvent {
  block: number;
  hash: string;
  type: "REVOCATION" | "BEHAVIORAL" | "ISSUED" | "RENEWAL";
  npe: string;
  ts: string;
  sigs: number;
}

export interface Incident {
  id: string;
  npe: string;
  risk: number;
  level: RiskLevel;
  time: string;
  summary: string;
  factors: Record<string, number>;
  action: string;
}