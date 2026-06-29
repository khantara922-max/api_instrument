export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return new Response(JSON.stringify({ error: 'missing ?url= param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch (_) {
      return new Response(JSON.stringify({ error: 'invalid url', received: target }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let resp;
    try {
      resp = await fetch(parsed.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': parsed.href,
          'Origin': parsed.origin,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'sec-fetch-dest': 'iframe',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'cross-site',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'fetch failed', detail: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const body = await resp.text();

    // always return 200 to caller, pass upstream status in header
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'text/plain',
        'X-Upstream-Status': String(resp.status),
        ...corsHeaders(origin),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}