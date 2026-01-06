/**
 * Netlify Function (v2) – Mercado Pago Checkout Pro
 *
 * ⚠️ Netlify runtime expects the handler to return a WHATWG `Response` (or `undefined`).
 * Returning `{ statusCode, body }` will crash with:
 * "Function returned an unsupported value. Accepted types are 'Response' or 'undefined'".
 */
import mercadopago from 'mercadopago';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export default async function handler(request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return json({ error: 'Falta MP_ACCESS_TOKEN en variables de entorno (Netlify).' }, 500);
  }

  mercadopago.configure({ access_token: accessToken });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Body inválido: se esperaba JSON.' }, 400);
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) {
    return json({ error: 'items es requerido (array con productos).' }, 400);
  }

  // Netlify provides the current site URL in production
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';

  const preference = {
    items: items.map((it) => ({
      title: String(it.title ?? 'Producto'),
      quantity: Number(it.quantity ?? 1) || 1,
      unit_price: Number(it.unit_price ?? 0) || 0,
      currency_id: 'ARS',
      picture_url: it.picture_url ? String(it.picture_url) : undefined,
    })),
    payer: payload?.buyer?.email ? { email: String(payload.buyer.email) } : undefined,
    back_urls: {
      success: `${siteUrl}/checkout/success`,
      failure: `${siteUrl}/checkout/failure`,
      pending: `${siteUrl}/checkout/pending`,
    },
    auto_return: 'approved',
  };

  try {
    const mpRes = await mercadopago.preferences.create(preference);
    const body = mpRes?.body || {};
    return json(
      {
        id: body.id,
        init_point: body.init_point,
        sandbox_init_point: body.sandbox_init_point,
      },
      200
    );
  } catch (err) {
    // Don't leak secrets; provide a readable message
    return json(
      {
        error: 'Mercado Pago: no se pudo crear la preferencia.',
        details: err?.message || String(err),
      },
      500
    );
  }
}
