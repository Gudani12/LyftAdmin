import { createClient } from '@supabase/supabase-js'

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined
const processEnv = typeof process !== 'undefined' ? process.env : undefined
const supabaseUrl = viteEnv?.VITE_SUPABASE_URL || processEnv?.VITE_SUPABASE_URL
const supabaseKey = viteEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || viteEnv?.VITE_SUPABASE_ANON_KEY || processEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || processEnv?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined in the project root .env file.\n' +
    'Restart the Vite dev server after updating .env.'
  )
}

let accessTokenProvider = async () => null
let refreshedAccessToken = null

export const setSupabaseAccessTokenProvider = (provider) => {
  accessTokenProvider = provider || (async () => null)
}

const getSupabaseAccessToken = async () => {
  if (refreshedAccessToken) {
    const token = refreshedAccessToken
    refreshedAccessToken = null
    return token
  }
  return accessTokenProvider()
}

const refreshSupabaseAccessToken = async () => {
  refreshedAccessToken = await accessTokenProvider({ skipCache: true })
}

export async function retrySupabaseRequestOnInvalidToken(request) {
  const result = await request()
  const errorMessage = `${result.error?.message || ''} ${result.error?.details || ''}`.trim()
  const invalidTokenPattern = /JWT\s+(?:not yet valid|expired|invalid|malformed|signature|missing)|token(?:\s+is)?\s+(?:expired|invalid|missing)|authorization.*failed|unauthorized/i

  if (!invalidTokenPattern.test(errorMessage)) return result

  await new Promise((resolve) => setTimeout(resolve, 1000))
  await refreshSupabaseAccessToken()
  return request()
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: getSupabaseAccessToken,
})
export const safetySupabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: getSupabaseAccessToken,
})
