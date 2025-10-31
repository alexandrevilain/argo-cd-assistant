import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),

  MODEL: z.string().min(1).default('gpt-5-mini'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),

  ARGOCD_API_TOKEN: z.string().min(1, 'ARGOCD_API_TOKEN is required'),
  CUSTOM_PROMPT_FILE: z.string().optional(),
});

const config = ConfigSchema.parse(process.env);

export type Config = z.infer<typeof ConfigSchema>;
export default config;
