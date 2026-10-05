import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

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
  const errorMessage = `${result.error?.message || ''} ${result.error?.details || ''}`
  if (!/JWT not yet valid/i.test(errorMessage)) return result

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
