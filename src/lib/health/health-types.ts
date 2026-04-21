/** GET /health */
export type HealthLiveness = {
  status: string;
  timestamp: string;
};

/** GET /health/ready */
export type HealthReadiness = {
  status: string;
  timestamp: string;
  checks?: {
    redis_connected?: boolean;
    supabase_reachable?: boolean;
    l1_cache_size?: number;
    [key: string]: unknown;
  };
};
