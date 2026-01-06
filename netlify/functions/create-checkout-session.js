export default async (req) => {
  try {
    if (req.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta MP_ACCESS_TOKEN" }) };
    }

    const siteUrl = process.env.PUBLIC_SITE_URL || "http://localhost:8888";
    const body = JSON.parse(req.body || "{}");
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Carrito vacío" }) };
    }

    const mpItems = items.map((it) => ({
      title: String(it.title || "Producto"),
      quantity: Number(it.quantity || 1),
      unit_price: Number(it.unit_price || 0),
      currency_id: "ARS"
    })).filter(x => x.unit_price > 0 && x.quantity > 0);

    const payload = {
      items: mpItems,
      back_urls: {
        success: `${siteUrl}/success`,
        failure: `${siteUrl}/cancel`,
        pending: `${siteUrl}/pending`
      },
      auto_return: "approved",
      statement_descriptor: "ST IMPORTADOS",
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data?.message || "Error Mercado Pago", details: data }) };
    }

    // init_point (prod) / sandbox_init_point (test)
    const url = data?.init_point || data?.sandbox_init_point;
    if (!url) {
      return { statusCode: 500, body: JSON.stringify({ error: "No se generó link de pago" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Error" }) };
  }
};
