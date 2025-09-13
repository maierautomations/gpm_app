// =====================================================
// SHARED CORS HEADERS FOR EDGE FUNCTIONS
// =====================================================
// Place this file in supabase/functions/_shared/cors.ts
// =====================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}