# Perfumes (Netlify + Google Sheets)

Este proyecto es una tienda sencilla (tipo Shopify en lo visible) hosteada en **Netlify**:
- Catálogo desde tu Google Sheets publicado como CSV
- Búsqueda + filtros por categoría
- Carrito (localStorage)
- Checkout con **Stripe** (Netlify Function)
- Login / Panel (base) para crecer a multi-vendedor

## 1) Requisitos
- Node 18+
- Cuenta Netlify
- (Para cobrar) Stripe

## 2) Configurar variables
Copiá `.env.example` a `.env` para desarrollo local.

En Netlify (Site settings → Environment variables) seteá:
- `STRIPE_SECRET_KEY`
- `PUBLIC_SITE_URL` (ej: https://tusitio.netlify.app)

En el frontend:
- `VITE_PRODUCTS_CSV_URL` (tu URL del CSV)

Tu CSV actual:








`VITE_PRODUCTS_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQj2ccOLSKCkrLKF6k8P_h1FYwTf3xq6oQKjNpm5wt59w-5fsuXw5cL0iDSqfq0navgbogMbU63R3Aw/pub?output=csv`

## 3) Correr local
```bash
npm install
npm run dev
```

Para probar functions en local, lo más cómodo es:
```bash
npm i -g netlify-cli
netlify dev
```

## 4) Columnas esperadas en tu Google Sheet
La app intenta **auto-detectar** columnas, por ejemplo:
- nombre / name / producto
- precio / price
- stock (opcional)
- imagen (URL) (opcional)
- categoria (opcional)
- marca (opcional)
- notas (opcional)

### Para galería de imágenes
Podés crear una columna `imagenes` con URLs separadas por `|`:
`https://.../1.jpg | https://.../2.jpg`

## 5) Imágenes desde Drive
Drive puede servir para arrancar, pero a veces no es ideal como CDN.
Si me pasás una carpeta, luego lo migramos a Cloudinary/Supabase Storage para que cargue más rápido.

## 6) Multi-vendedor (siguiente paso)
Esta plantilla deja el login/panel listo.
Para marketplace real (órdenes por vendedor + comisiones):
- sumar DB (ej Supabase)
- guardar órdenes y asociarlas a seller_id
- roles (admin/seller) en Identity

Si querés, lo armamos en la fase 2.


## Nota
Si no seteás `VITE_PRODUCTS_CSV_URL`, el proyecto trae un fallback con tu CSV publicado (para que no se rompa el deploy).
