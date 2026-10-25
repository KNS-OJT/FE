import axios from 'axios'
import { env } from '@/config/env'

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
})
