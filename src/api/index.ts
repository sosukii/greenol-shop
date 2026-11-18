import { site } from '@/config/site'
import { createHttpApi } from './http'
import { localApi } from './local'
import type { Api } from './types'

/** Единая точка доступа к бэкенду: локальный режим или HTTP (VITE_API_URL) */
export const api: Api = site.apiUrl ? createHttpApi(site.apiUrl) : localApi
export type { Api, PublicOrder, PaymentOutcome } from './types'
