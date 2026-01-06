declare global {
  interface Window {
    netlifyIdentity?: any;
  }
}

export function initIdentity() {
  // Netlify Identity widget se carga con <script> en index.html (lo inyecta Netlify si lo activás)
  // Si no existe, no hacemos nada.
  const ni = window.netlifyIdentity;
  if (!ni) return;

  ni.on("init", (user: any) => {
    if (!user) {
      // no logueado
    }
  });
}

export function openLogin() {
  window.netlifyIdentity?.open?.("login");
}

export function openSignup() {
  window.netlifyIdentity?.open?.("signup");
}

export function logout() {
  window.netlifyIdentity?.logout?.();
}

export function currentUser(): any | null {
  return window.netlifyIdentity?.currentUser?.() ?? null;
}

export function hasRole(user: any, role: "admin" | "seller"): boolean {
  // roles suelen ir en app_metadata.roles si usás GoTrue con roles; esto es un fallback.
  const roles: string[] =
    user?.app_metadata?.roles ??
    user?.user_metadata?.roles ??
    [];
  return Array.isArray(roles) && roles.includes(role);
}
