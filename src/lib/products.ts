import Papa from "papaparse";

export type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  description?: string;
  brand?: string;
  notes?: string;
  category?: string;
  image?: string;
  images?: string[];
  seller?: string; // id o nombre del vendedor (opcional)
};

const pick = (row: Record<string, any>, keys: string[]) => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

const toNumber = (v: any): number | undefined => {
  if (v === undefined || v === null) return undefined;
  const s0 = String(v).trim();
  if (!s0) return undefined;

  // Normaliza precios tipo: "$ 98.000,00", "98,000.00", "98000", "98 000", etc.
  // Regla: el separador decimal suele ser el ÚLTIMO (coma o punto) que aparece.
  let s = s0.replace(/\s/g, "").replace(/[^0-9,\.\-]/g, "");
  if (!s) return undefined;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  let normalized = s;

  if (lastComma !== -1 && lastDot !== -1) {
    // Tiene ambos: elegimos el último como decimal
    if (lastComma > lastDot) {
      // decimal coma -> quitamos puntos (miles) y cambiamos coma por punto
      normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // decimal punto -> quitamos comas (miles)
      normalized = normalized.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Solo coma
    const commas = (normalized.match(/,/g) || []).length;
    if (commas > 1) {
      normalized = normalized.replace(/,/g, "");
    } else {
      const parts = normalized.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        normalized = parts[0].replace(/\./g, "") + "." + parts[1];
      } else {
        // coma como miles
        normalized = normalized.replace(/,/g, "");
      }
    }
  } else {
    // Solo punto o ninguno
    const dots = (normalized.match(/\./g) || []).length;
    if (dots > 1) {
      const last = normalized.lastIndexOf(".");
      normalized = normalized.slice(0, last).replace(/\./g, "") + normalized.slice(last);
    }
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};






const toDriveThumb = (url: string): string => {
  const u = url.trim();
  const m =
    u.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const id = m?.[1];
  if (!id) return u;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
};

const normalizeImageUrl = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (s.includes("drive.google.com")) return toDriveThumb(s);
  return s;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function fetchProducts(csvUrl: string): Promise<Product[]> {
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude descargar el CSV (${res.status})`);
  const text = await res.text();

  const parsed = Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors?.length) {
    // no tiramos abajo la app; devolvemos lo que se pueda
    console.warn("CSV parse errors:", parsed.errors);
  }

  const rows = (parsed.data || []).filter(Boolean);

  // Auto-detección de columnas comunes (podés renombrar en tu sheet sin romper todo)
  return rows
    .map((row, idx) => {
      const name = String(
        pick(row, ["nombre", "name", "producto", "titulo", "title"]) ?? ""
      ).trim();

      const idRaw =
        pick(row, ["id", "sku", "codigo", "code", "ref"]) ??
        (name ? slugify(name) : `prod-${idx + 1}`);

      const price = toNumber(pick(row, ["precio", "price", "importe"]));
      const stock = toNumber(pick(row, ["stock", "cantidad", "qty", "inventory"]));

      const description = pick(row, ["descripcion", "description", "desc"]);
      const brand = pick(row, ["marca", "brand"]);
      const notes = pick(row, ["notas", "notes", "acorde", "acordes"]);
      const category = pick(row, ["categoria", "category", "coleccion", "collection"]);
      const seller = pick(row, ["vendedor", "seller", "seller_id"]);

      // Imágenes: soporta "imagen", "image", "img", "imagen_1", "imagen1", etc.
      const image = normalizeImageUrl(
        pick(row, ["imagen", "image", "img", "foto", "imagen_1", "imagen1", "image_1"]) ??
        undefined
      );

      const imagesRaw =
        pick(row, ["imagenes", "images", "gallery", "galeria"]) ?? undefined;

      const images = imagesRaw
        ? String(imagesRaw)
            .split("|")
            .map((s) => normalizeImageUrl(s)).filter(Boolean)
        : undefined;

      if (!name || price === undefined) return null;

      return {
        id: String(idRaw),
        name,
        price,
        stock: stock ?? undefined,
        description: description ? String(description) : undefined,
        brand: brand ? String(brand) : undefined,
        notes: notes ? String(notes) : undefined,
        category: category ? String(category) : undefined,
        image: image ? String(image) : undefined,
        images: images ? images : undefined,
        seller: seller ? String(seller) : undefined
      } satisfies Product;
    })
    .filter((p): p is Product => Boolean(p));
}
