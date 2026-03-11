const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bridge-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate with BRIDGE_SECRET
  const secret = req.headers.get('x-bridge-secret');
  const expectedSecret = Deno.env.get('BRIDGE_SECRET');

  if (!secret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dbUrl = Deno.env.get('SUPABASE_DB_URL') || 'NOT_SET';

  return new Response(JSON.stringify({ db_url: dbUrl }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
