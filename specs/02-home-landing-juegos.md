# SPEC 02 — Home (landing) de Arcade Vault en `/` y Biblioteca en `/juegos`

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-26
> **Objective:** Portar la página Home de `reference/templates/home-about/home.jsx` a la ruta `/`, moviendo la Biblioteca actual a `/juegos`.

---

## Por qué existe este spec

Hoy `/juegos` devuelve 404 y `/` renderiza la Biblioteca (SPEC 01). La referencia `reference/templates/home-about/` añade una landing (Home) que no se portó. El Home pasa a ser la puerta de entrada en `/`, así que la Biblioteca se mueve a `/juegos` y los enlaces que hoy apuntan a `/` deben reasignarse según su intención. El CSS del Home no existe aún en `app/globals.css`.

---

## Scope

**In:**

- Ruta `/` que renderiza el Home con sus 7 bloques, igual que `home.jsx`:
  - **Hero:** siluetas pixel flotantes (8 SVG), eyebrow "▸ INSERTA UNA MONEDA_", título en 3 líneas, subtítulo, CTAs "▶ EXPLORAR JUEGOS" y "✦ CREAR CUENTA", indicador "DESLIZA ▼".
  - **// 01 ¿POR QUÉ ARCADE VAULT?:** 4 feature cards con icono pixel SVG (`GAMEPAD`, `FREE`, `TROPHY`, `ROCKET`).
  - **// 02 JUEGOS DISPONIBLES AHORA:** rail con `GAMES.slice(0, 6)` como mini-cards + botón "VER TODOS LOS JUEGOS →".
  - **Stats:** 3 bloques (12+ JUEGOS, MILES DE PARTIDAS, GLOBAL RANKING).
  - **// 03 ACTIVIDAD EN VIVO:** ticker de 7 últimas puntuaciones y top 5 jugadores con enlace "VER SALÓN →".
  - **// 04 PRECIOS:** tarjeta "JUGADOR VAULT $0" con CTA "EMPEZAR GRATIS →" y 3 FAQs.
  - **CTA final:** "¿LISTO PARA JUGAR?" + "INSERTAR MONEDA →".
- Animación de aparición al hacer scroll (`.reveal` → `.in`) con `IntersectionObserver`, igual que `useReveal()` de la referencia.
- Mover la Biblioteca de `/` a `/juegos`.
- Nav: nuevo enlace "Inicio" → `/` (escritorio y panel móvil), activo solo en `/`; enlace "Biblioteca" → `/juegos`. El logo sigue apuntando a `/`.
- Reasignar enlaces existentes que hoy apuntan a `/` con intención de "volver a la Biblioteca" (ver tabla en el plan).
- Portar a `app/globals.css` las secciones CSS "HOME PAGE", "ACTIVITY" y "PRICING" de `reference/templates/home-about/styles.css`.

**Out of scope (para futuros specs):**

- Página "Acerca de" (`about.jsx`) y su enlace en el Nav.
- Gamepad decorativo, temas de gamepad y demás secciones CSS de `styles.css` no usadas por el Home (`GAMEPAD`, `ABOUT PAGE`, `tweaks`, `spinner`).
- Datos reales en ticker, top jugadores y stats (siguen siendo mock estáticos).
- Sistema de precios o créditos funcional.
- Redirecciones (no se necesitan: `/` y `/juegos` son páginas reales).
- Tests automatizados.

---

## Data model

Este feature no introduce estructuras de datos persistentes. Reutiliza `GAMES` y `Game` de `lib/data.ts` (SPEC 01) para el rail de mini-cards.

Los datos decorativos viven como constantes tipadas al tope de `components/Home.tsx`, copiados literalmente de `home.jsx`:

```ts
type NeonColor = "cyan" | "magenta" | "yellow" | "green";
type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

const FEATURES: { i: FeatureIconKind; t: string; d: string; c: NeonColor }[];        // 4 items
const STATS: { n: string; u: string; s: string }[];                                  // 3 items
const RECENT_SCORES: { p: string; g: string; s: number; t: string; c: NeonColor }[]; // 7 items
const TOP_PLAYERS: { r: number; p: string; s: number }[];                            // 5 items
```

Los números se formatean con `toLocaleString("es-ES")`, igual que la referencia.

---

## Implementation plan

1. **CSS del Home.** Añadir al final de `app/globals.css` las secciones `/* ===== HOME PAGE ===== */` (líneas 930–1070), `/* ===== ACTIVITY ===== */` (1621–1671) y `/* ===== PRICING ===== */` (1672–1730) de `reference/templates/home-about/styles.css`, sin modificar. Verificar que no redefinen clases ya existentes en `globals.css`.
2. **Mover Biblioteca.** Crear `app/juegos/page.tsx` que renderiza `<Library />` (contenido actual de `app/page.tsx`). Verificar: `/juegos` muestra la Biblioteca.
3. **Componente Home.** Crear `components/Home.tsx` (`"use client"`) migrado desde `home.jsx`: `useReveal()`, `FloatingSilhouettes`, `MiniCard`, `FeatureIcon` y `Home`, con las constantes del Data model. Sustituir `navigate(...)` por `next/link` según la tabla del paso 5. `MiniCard` navega a `/juego/[id]`.
4. **Ruta `/`.** Reemplazar el contenido de `app/page.tsx` para que renderice `<Home />`. Verificar: `/` muestra el Home y las secciones aparecen al hacer scroll.
5. **Reasignar enlaces.** Actualizar destinos:

   | Origen | Elemento | Antes | Después |
   | --- | --- | --- | --- |
   | `components/Nav.tsx` | Logo | `/` | `/` (sin cambio) |
   | `components/Nav.tsx` | "Biblioteca" (escritorio y móvil) | `/` | `/juegos` |
   | `components/Auth.tsx` | `router.push` tras login e invitado | `/` | `/juegos` |
   | `components/HallOfFame.tsx` | "VOLVER A LA BIBLIOTECA" | `/` | `/juegos` |
   | `components/GameDetail.tsx` | "Volver al vault" | `/` | `/juegos` |
   | `components/GamePlayer.tsx` | "VOLVER AL VAULT" | `/` | `/juegos` |
   | `components/Home.tsx` | "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS", "INSERTAR MONEDA" | — | `/juegos` |
   | `components/Home.tsx` | "CREAR CUENTA", "EMPEZAR GRATIS" | — | `/auth` |
   | `components/Home.tsx` | "VER SALÓN →" | — | `/salon` |

6. **Nav: enlace Inicio.** En `components/Nav.tsx`, añadir "Inicio" → `/` como primer enlace (escritorio y panel móvil). Ampliar `isActive` con `"inicio"` (activo si `pathname === "/"`) y cambiar `"biblioteca"` a activo si `pathname === "/juegos"` o `pathname.startsWith("/juego/")`.
7. **Cierre.** Correr `npm run lint` y `npm run build` hasta que pasen sin errores.

---

## Acceptance criteria

- [ ] `npm run build` compila sin errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `/` muestra el Home con hero, // 01, // 02, stats, // 03, // 04 y CTA final.
- [ ] `/juegos` muestra la Biblioteca (no 404) con buscador y filtros funcionando como en SPEC 01.
- [ ] Las secciones `.reveal` son invisibles antes de entrar al viewport y aparecen (clase `in`) al hacer scroll.
- [ ] Las secciones `.reveal` también aparecen al llegar a `/` por navegación cliente desde otra ruta (sin recargar).
- [ ] El rail "JUEGOS DISPONIBLES AHORA" muestra exactamente 6 mini-cards, las primeras 6 de `GAMES`.
- [ ] Clic en una mini-card navega a `/juego/[id]` con el `id` correcto.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/juegos`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] En el Nav, "Inicio" está activo solo en `/`; "Biblioteca" está activo en `/juegos`, `/juego/[id]` y `/juego/[id]/jugar`, y no en `/`.
- [ ] El logo del Nav navega a `/`.
- [ ] En viewport < 840px, el panel móvil incluye "Inicio" y navega a `/`.
- [ ] Iniciar sesión o "JUGAR COMO INVITADO" en `/auth` navega a `/juegos`.
- [ ] "VOLVER A LA BIBLIOTECA" (Salón), "Volver al vault" (Detalle) y "VOLVER AL VAULT" (Reproductor) navegan a `/juegos`.
- [ ] Los únicos `href="/"` en `components/` son el logo y el enlace "Inicio" del Nav; no queda ningún `router.push("/")`.

---

## Decisions

- **Sí:** Home en `/` y Biblioteca en `/juegos`. Decidido con el usuario (revisión del plan inicial).
- **No:** Home en `/juegos` con `/` redirigiendo a `/juegos` y Biblioteca en `/biblioteca`. Fue la primera versión del plan; se descartó a favor de que la landing sea la raíz.
- **No:** redirecciones en `next.config.ts`. Con el Home en `/` y la Biblioteca en `/juegos` ambas son páginas reales.
- **Sí:** enlaces reasignados según intención: logo e "Inicio" → Home; "volver" y post-login → Biblioteca. Decidido con el usuario.
- **Sí:** solo se añade "Inicio" al Nav. Decidido con el usuario.
- **No:** añadir "Acerca de". No existe la página y sería un enlace a 404.
- **Sí:** datos mock del Home como constantes en `components/Home.tsx`. Son decorativos y no se reutilizan. Decidido con el usuario.
- **No:** mover esos mocks a `lib/data.ts`. Más superficie sin reutilización real.
- **Sí:** CSS copiado literal a `app/globals.css`. Mismo criterio que SPEC 01. Decidido con el usuario.
- **No:** CSS Modules o reescritura en Tailwind. Rompe el patrón actual o arriesga perder efectos neón.
- **Sí:** `components/Home.tsx` como Client Component. `useReveal()` usa `IntersectionObserver` y `useEffect`.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| `pathname.startsWith("/juego")` sin barra es ambiguo entre `/juegos` y `/juego/[id]` | Usar `pathname === "/juegos" \|\| pathname.startsWith("/juego/")` (paso 6). |
| CSS copiado redefine clases existentes (`.section-title`, variantes de `.btn`) y altera otras pantallas | En el paso 1, comparar selectores copiados contra `globals.css` y revisar visualmente Biblioteca, Detalle y Salón. |
| Contenido `.reveal` nunca aparece si el observer no se engancha tras navegación cliente | `useReveal()` corre en `useEffect` al montar; hay un criterio de aceptación específico para navegación cliente. |
| Enlaces "volver" olvidados llevan al Home en vez de a la Biblioteca | Criterio de aceptación sobre `href="/"` y `router.push("/")` en `components/`. |

---

## What is **not** in this spec

- Página "Acerca de" y su enlace en el Nav.
- Gamepad decorativo y CSS no usado por el Home.
- Datos reales para ticker, ranking o stats.
- Precios o créditos funcionales.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
