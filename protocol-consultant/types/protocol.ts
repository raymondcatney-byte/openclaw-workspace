export interface ProtocolMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProtocolConsultantState {
  messages: ProtocolMessage[];
  loading: boolean;
}

export interface Biomarkers {
  sleep?: number;
  hrv?: number;
  readiness?: number;
  subjective?: string;
}