import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { fetchProducts, Product } from "./lib/products";
import { addToCart, CartItem, loadCart, removeFromCart, saveCart, setQty, total } from "./lib/cart";
import { currentUser, initIdentity, logout, openLogin, openSignup } from "./lib/identity";

const CSV_URL = (import.meta.env.VITE_PRODUCTS_CSV_URL as string | undefined) ?? "https://docs.google.com/spreadsheets/d/e/2PACX-1vQj2ccOLSKCkrLKF6k8P_h1FYwTf3xq6oQKjNpm5wt59w-5fsuXw5cL0iDSqfq0navgbogMbU63R3Aw/pub?output=csv";
const LOGO_URL = "/logo-st.svg";

const STORE_NAME = (import.meta.env.VITE_STORE_NAME as string | undefined) ?? "ST Importados";

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function PlaceholderImg({ name }: { name: string }) {
  return (
    <div className="ph" aria-label={name}>
      <img src={LOGO_URL} alt="" style={{width:"72%", height:"72%", objectFit:"contain", opacity:0.9}} />

    </div>
  );
}


function Nav({ q, setQ, cartCount }: { q: string; setQ: (v: string) => void; cartCount: number }) {
  const user = currentUser();
  return (
    <div className="nav">
      <div className="row">
        <Link className="brand" to="/">{STORE_NAME}</Link>
      </div>

      <div className="row">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar (ej: oud, vainilla, fresco...)"
        />
        <Link className="btn" to="/cart">Carrito ({cartCount})</Link>
        {!user ? (
          <>
            <button className="btn" onClick={openLogin}>Entrar</button>
            <button className="btn primary" onClick={openSignup}>Crear cuenta</button>
          </>
        ) : (
          <>
            <Link className="btn" to="/dashboard">Panel</Link>
            <button className="btn" onClick={logout}>Salir</button>
          </>
        )}
      </div>

    </div>
  );
}

function Home({ products }: { products: Product[] }) {
  const [params] = useSearchParams();
  const category = params.get("cat")?.toLowerCase() ?? "";

  const cats = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return Array.from(set).sort((a,b)=>a.localeCompare(b, "es"));
  }, [products]);

  const filtered = category
    ? products.filter(p => (p.category ?? "").toLowerCase() === category)
    : products;

  return (
    <div className="container">
      <div className="hero" id="catalogo">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-kicker">ST Importados</div>
            <h1>Perfumería árabe original</h1>
            <div className="hero-sub">Stock real · Pagos con Mercado Pago · Envíos y retiro</div>
            <div className="hero-actions">
              <a className="btn primary" href="#catalogo-lista">Ver catálogo</a>
              <a className="btn ghost" href="https://wa.me/5492975168695" target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
            </div>
          </div>
          <div className="hero-right" aria-hidden="true"></div>
        </div>
      </div>
      <h2 id="catalogo-lista" style={{marginTop: 18}}>Catálogo</h2>
      <div className="row" style={{flexWrap:"wrap"}}>
        <Link className="badge" to="/">Todo</Link>
        {cats.map(c => (
          <Link key={c} className="badge" to={`/?cat=${encodeURIComponent(c)}`}>{c}</Link>
        ))}
      </div>
      <div className="hr" />
      <div className="grid">
        {filtered.map(p => (
          <Link key={p.id} to={`/p/${encodeURIComponent(p.id)}`} className="card">
            {p.image ? <img className="card-img" src={p.image} alt={p.name} loading="lazy" onError={(e)=>{ const img=e.currentTarget; img.onerror=null; img.src=LOGO_URL; img.style.objectFit="contain"; img.style.padding="18px"; }} /> : <PlaceholderImg name={p.name} />}
            <div className="p">
              <div style={{display:"flex", justifyContent:"space-between", gap: 10}}>
                <div style={{fontWeight: 700}}>{p.name}</div>
                <div className="price">{money(p.price)}</div>
              </div>
              <div className="muted">
                {p.brand ? `${p.brand} · ` : ""}{p.category ?? "Perfume"}
              </div>
              {typeof p.stock === "number" ? (
                <div className="small">{p.stock > 0 ? `Stock: ${p.stock}` : "Sin stock"}</div>
              ) : (
                <div className="small">Stock: consultar</div>
              )}
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

function ProductPage({
  products,
  add
}: {
  products: Product[];
  add: (p: Product) => void;
}) {
  const nav = useNavigate();
  const id = decodeURIComponent(location.pathname.split("/p/")[1] || "");
  const p = products.find(x => x.id === id);

  if (!p) {
    return (
      <div className="container">
        <h2>No encontré ese producto</h2>
        <button className="btn" onClick={() => nav(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="btn" onClick={() => nav(-1)}>← Volver</button>
      <div className="hr" />
      <div className="two">
        <div className="card">
          {p.image ? <img className="detail-img" src={p.image} alt={p.name} onError={(e)=>{ const img=e.currentTarget; img.src=LOGO_URL; img.classList.add("img-fallback"); }} /> : <PlaceholderImg name={p.name} />}
          <div className="p">
            <div style={{display:"flex", justifyContent:"space-between", gap:12}}>
              <h2 style={{margin:0}}>{p.name}</h2>
              <div className="price" style={{fontSize: 18}}>{money(p.price)}</div>
            </div>
            <div className="muted">
              {p.brand ? `${p.brand} · ` : ""}{p.category ?? "Perfume"}
            </div>
            {p.notes ? <div className="badge">Notas: {p.notes}</div> : null}
            <div className="small">
              {typeof p.stock === "number" ? (p.stock > 0 ? `Stock: ${p.stock}` : "Sin stock") : "Stock: consultar"}
            </div>
            {p.description ? <div style={{lineHeight: 1.5}}>{p.description}</div> : null}
            <div className="row">
              <button
                className="btn primary"
                onClick={() => add(p)}
                disabled={typeof p.stock === "number" ? p.stock <= 0 : false}
              >
                Agregar al carrito
              </button>
              <Link className="btn" to="/cart">Ir al carrito</Link>
            </div>
            <div className="small">Tip: si después querés “vendedores”, agregá una columna <b>seller</b> en el sheet.</div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{marginTop:0}}>Datos rápidos</h3>
          <div className="small">ID / SKU: {p.id}</div>
          <div className="small">Categoría: {p.category ?? "—"}</div>
          <div className="small">Marca: {p.brand ?? "—"}</div>
          <div className="small">Precio: {money(p.price)}</div>
          <div className="hr" />
          <div className="small">
            Checkout: Mercado Pago (Checkout Pro). Si falla, avisame y lo ajustamos.
          </div>
        </div>
      </div>

    </div>
  );
}

function CartPage({
  items,
  setItems
}: {
  items: CartItem[];
  setItems: (x: CartItem[]) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
  setLoading(true);

  try {
    const res = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items })
    });

    const data = await res.json();

    const url = data?.sandbox_init_point || data?.init_point;

    if (!url) {
      throw new Error("Sin URL de Mercado Pago");
    }

    // IMPORTANTE: return para que NO siga ejecutando nada
    window.location.href = url;
    return;
  } catch (e) {
    console.error(e);
    alert("Mercado Pago: no se pudo crear la preferencia.");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="container">
      <h1>Carrito</h1>
      <div className="hr" />
      {items.length === 0 ? (
        <div className="panel">
          <div>Tu carrito está vacío.</div>
          <div className="hr" />
          <Link className="btn primary" to="/">Ver catálogo</Link>
        </div>
      ) : (
        <div className="two">
          <div className="panel">
            {items.map(it => (
              <div key={it.id} style={{display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:"1px solid #23232b"}}>
                <div style={{width: 64, height: 64, borderRadius: 14, overflow:"hidden", border:"1px solid #23232b", background:"#12121a"}}>
                  {it.image ? <img src={it.image} alt={it.name} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : null}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight: 700}}>{it.name}</div>
                  <div className="small">{money(it.price)} c/u</div>
                </div>
                <input
                  className="input"
                  style={{minWidth: 90, width: 90}}
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={(e) => setItems(setQty(items, it.id, Number(e.target.value)))}
                />
                <button className="btn" onClick={() => setItems(removeFromCart(items, it.id))}>Quitar</button>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3 style={{marginTop:0}}>Resumen</h3>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div className="muted">Total</div>
              <div className="price" style={{fontSize: 18}}>{money(total(items))}</div>
            </div>
            <div className="hr" />
            <button className="btn primary" onClick={checkout} disabled={loading}>
              {loading ? "Redirigiendo..." : "Pagar"}
            </button>
            <div className="small" style={{marginTop: 10}}>
              Nota: el checkout usa Mercado Pago. Si todavía no cargaste tus credenciales de MP (Access Token), te va a dar error.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Dashboard() {
  const user = currentUser();
  if (!user) {
    return (
      <div className="container">
        <h2>Necesitás iniciar sesión</h2>
        <div className="row">
          <button className="btn primary" onClick={openLogin}>Entrar</button>
          <button className="btn" onClick={openSignup}>Crear cuenta</button>
        </div>
        <div className="hr" />
        <div className="small">
          Para “vendedores”, lo ideal es agregar roles (admin/seller) en Netlify Identity.
          Esta plantilla ya deja el panel listo para crecer.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Panel</h1>
      <div className="panel">
        <div><b>Usuario:</b> {user.email}</div>
        <div className="small">Acá se agrega: órdenes, productos por vendedor, comisiones, etc.</div>
        <div className="hr" />
        <div className="small">
          Siguiente paso (si querés marketplace): conectar una DB (Supabase) para guardar órdenes y asignarlas a vendedores.
        </div>
      </div>

    </div>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return loadCart();
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    initIdentity();
  }, []);

  useEffect(() => saveCart(items), [items]);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        if (!CSV_URL) throw new Error("Falta VITE_PRODUCTS_CSV_URL");
        const ps = await fetchProducts(CSV_URL);
        setProducts(ps);
        document.title = STORE_NAME;
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando catálogo");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      [p.name, p.brand, p.category, p.notes, p.description].filter(Boolean).some(s =>
        String(s).toLowerCase().includes(term)
      )
    );
  }, [products, q]);

  function add(p: Product) {
    setItems(addToCart(items, p, 1));
  }

  return (
    <div>
      <Nav q={q} setQ={setQ} cartCount={items.reduce((s, x) => s + x.qty, 0)} />
      {err ? (
        <div className="container">
          <div className="panel">
            <b>No pude cargar el catálogo.</b>
            <div className="hr" />
            <div className="small">{err}</div>
            <div className="small">
              Si tu CSV abre en el navegador pero acá no, avisame y lo adaptamos.
            </div>
          </div>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Home products={filtered} />} />
        <Route path="/p/:id" element={<ProductPage products={products} add={add} />} />
        <Route path="/cart" element={<CartPage items={items} setItems={setItems} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/success"
          element={
            <div className="container">
              <h1>¡Pago confirmado!</h1>
              <div className="panel">
                <div>Gracias por tu compra.</div>
                <div className="hr" />
                <Link className="btn primary" to="/">Volver al catálogo</Link>
              </div>
            </div>
          }
        />
        <Route
          path="/cancel"
          element={
            <div className="container">
              <h1>Pago cancelado</h1>
              <div className="panel">
                <div>Podés intentar de nuevo cuando quieras.</div>
                <div className="hr" />
                <Link className="btn" to="/cart">Volver al carrito</Link>
              </div>
            </div>
          }
        />
        <Route
          path="/pending"
          element={
            <div className="container">
              <h1>Pago pendiente</h1>
              <div className="panel">
                <div>Tu pago quedó en estado pendiente. Si necesitás ayuda, escribinos por WhatsApp.</div>
                <div className="hr" />
                <a className="btn primary" href="https://wa.me/5492975168695" target="_blank" rel="noreferrer">Hablar por WhatsApp</a>
                <Link className="btn" to="/">Volver al catálogo</Link>
              </div>
            </div>
          }
        />
      </Routes>

      <div className="container" style={{paddingTop: 30, paddingBottom: 40}}>
        <div className="small" style={{textAlign:"center"}}>
          Hecho para Netlify · Catálogo desde Google Sheets · Checkout con Stripe
        </div>
      </div>
      <a className="wa-float" href="https://wa.me/5492975168695" target="_blank" rel="noreferrer" aria-label="WhatsApp">WhatsApp</a>

    </div>
  );
}
