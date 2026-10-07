export type Env = {
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
  OPENAI_SERVICE_TIER?: string
  OPENAI_ALLOW_STANDARD_FALLBACK?: string
  ALLOWED_ORIGIN?: string
}

export type RequestBody = {
  message?: unknown
  state?: unknown
}

export type OpenAiUsage = {
  input_tokens?: number
  input_tokens_details?: {
    cached_tokens?: number
    cache_write_tokens?: number
  }
  output_tokens?: number
}
