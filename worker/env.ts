export interface Env {
  GENERATION_STATE: DurableObjectNamespace;
  GENERATIONS?: R2Bucket;
  ASSETS?: Fetcher;
  FAL_KEY?: string;
  APP_SECRET?: string;
  APP_ORIGIN: string;
  GENERATION_ENABLED: string;
  DAILY_PIXEL_LIMIT: string;
  LOCAL_DEV?: string;
  AUTH_ENABLED?: string;
  EMAIL?: SendEmail;
  AUTH_EMAIL_FROM?: string;
  ADMIN_EMAIL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_CREDIT_PACK_30?: string;
  STRIPE_PRICE_PRO_MONTHLY_80?: string;
  STRIPE_PRICE_PRO_ANNUAL_800?: string;
}
