import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => /^\/(?!\/)/.test(value) || /^https?:\/\//.test(value),
      'Use an absolute HTTP(S) URL or a path starting with /',
    )
    .default('/api'),
  VITE_APP_NAME: z.string().trim().min(1).default('Inventory & PR Management'),
})

export const env = envSchema.parse(import.meta.env)
