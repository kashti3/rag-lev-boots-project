export interface GatekeeperResult {
  isInformative: boolean;
  score: number;
  reason: string;
  processedContent: string;
  metadata?: {
    originalLength: number;
    processedLength: number;
    rejectedParts?: string[];
  };
}

export interface GatekeeperEvaluation {
  score: number;
  reason: string;
  keepContent: boolean;
}

export interface BaseGatekeeper {
  evaluate(content: string): Promise<GatekeeperResult>;
  getSourceType(): string;
}

export type SourceType = 'pdf' | 'slack' | 'web-article';