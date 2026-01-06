import { Product } from "./products";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

const KEY = "perfume_cart_v1";

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(items: CartItem[], p: Product, qty = 1): CartItem[] {
  const next = [...items];
  const i = next.findIndex((x) => x.id === p.id);
  if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + qty };
  else next.push({ id: p.id, name: p.name, price: p.price, qty, image: p.image });
  return next;
}

export function removeFromCart(items: CartItem[], id: string): CartItem[] {
  return items.filter((x) => x.id !== id);
}

export function setQty(items: CartItem[], id: string, qty: number): CartItem[] {
  const q = Math.max(1, Math.floor(qty));
  return items.map((x) => (x.id === id ? { ...x, qty: q } : x));
}

export function total(items: CartItem[]): number {
  return items.reduce((sum, x) => sum + x.price * x.qty, 0);
}
