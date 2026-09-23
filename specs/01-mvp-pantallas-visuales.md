# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Status:** Aprobado
> **Depends on:** ninguno
> **Date:** 2026-09-20
> **Objective:** Portar las 5 pantallas del prototipo estático en `reference/templates/` (Biblioteca, Detalle, Reproductor, Salón de la Fama y Autenticación) a rutas reales de Next.js App Router, sin implementar lógica real de ningún juego.

---

## Por qué existe este spec

`reference/templates/` contiene un prototipo funcional en React+Babel servido como HTML estático (enrutamiento por `location.hash`, sin build, CDN de React 18). El objetivo de este spec es trasladar esa misma experiencia visual e interactiva al proyecto Next.js 16 real (React 19, App Router, TypeScript estricto, Tailwind v4), usando rutas reales en vez de hash-routing. `app/globals.css` y las fuentes en `app/layout.tsx` ya fueron portadas en un commit previo (`a08dd8a`) y sirven de base; este spec cubre el resto: páginas, componentes, datos y estado compartido (sesión falsa, filtros, tabs).

---

## Scope

**In:**

- 5 pantallas visuales, con interacciones de UI (sin backend real):
  - **Biblioteca** (`/`): hero, buscador, chips de categoría, grid de tarjetas de juego con tilt al hover.
  - **Detalle** (`/juego/[id]`): portada, tags, descripción, stats, tabla de mejores puntuaciones, botones "Jugar ahora" / "Volver al vault".
  - **Reproductor** (`/juego/[id]/jugar`): HUD (jugador, puntuación, vidas, nivel), simulación visual tipo CRT con puntuación que sube sola, pausa/reanudar, fin de juego, modal de guardado de puntuación.
  - **Salón de la fama** (`/salon`): tabs por juego, podio (oro/plata/bronce), tabla de ranking, fila destacada "tu marca" si hay sesión.
  - **Autenticación** (`/auth`): tabs "iniciar sesión" / "crear cuenta", formulario, botón "jugar como invitado", botones sociales decorativos (sin OAuth real).
- Navegación (`Nav`) con logo, enlaces activos por ruta, contador de créditos estático, botón de sesión, menú hamburguesa responsive.
- Fondo decorativo global (grid en perspectiva + scanlines + ruido) y footer, igual que la referencia.
- Sesión falsa de usuario y puntuaciones guardadas persistidas en `localStorage` (mismas claves que la referencia: `av_user`, `av_scores`), compartidas entre pantallas mediante un contexto de React en el layout raíz.
- Simulación decorativa del reproductor (puntuación con `setInterval`, nave y enemigos con animaciones CSS) tal como en `reproductor.jsx`, sin lógica de colisión ni reglas de juego real.
- Datos mock de juegos, jugadores y puntuaciones (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) migrados a TypeScript.
- Rutas en español, alineadas con los textos de la UI y el README.

**Out of scope (para futuros specs):**

- Lógica real de cualquier juego (Bloque Buster, Caída, Serpentina, etc.). El reproductor sigue siendo una maqueta visual.
- Autenticación real (backend, OAuth con Google/GitHub, validación de credenciales).
- Persistencia de puntuaciones en un backend o base de datos; sincronización entre dispositivos.
- Sistema de créditos/monedas funcional (el contador "CRÉDITOS · 03" sigue siendo estático).
- Página de cuenta de usuario (el botón con el nombre de usuario solo cierra sesión, como en la referencia).
- Tests automatizados (no hay test runner configurado en el repo).
- Internacionalización / soporte multi-idioma.

---

## Data model

```ts
// lib/data.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string; // kebab-case, usado también como segmento de ruta /juego/[id]
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // nombre de clase CSS "cover-*" (arte generado por CSS puro)
  color: GameColor;
  best: number;
  plays: string;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA"
}
```

```ts
// lib/user.ts
export interface SessionUser {
  name: string;
}

export interface SavedScoreEntry {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}
```

`GAMES`, `CATS`, `PLAYERS` y la función `seededScores(seed, count)` se migran literalmente desde `reference/templates/data.jsx` a `lib/data.ts`, tipados según lo anterior. La lógica del generador pseudoaleatorio (`seededScores`) no cambia.

Claves de `localStorage` (idénticas a la referencia):

- `av_user`: `SessionUser | null`, serializado con `JSON.stringify`.
- `av_scores`: `SavedScoreEntry[]`, serializado con `JSON.stringify`. Se escribe al guardar una puntuación en el reproductor; ninguna pantalla lo lee de vuelta (igual que en la referencia — el Salón de la Fama y el Detalle siguen usando `seededScores`, no `av_scores`).

---

## Implementation plan

1. **Datos y tipos.** Crear `lib/data.ts` con `Game`, `GameCategory`, `GameColor`, `ScoreRow`, `GAMES`, `CATS`, `PLAYERS`, `seededScores`, migrados desde `reference/templates/data.jsx`.
2. **Contexto de sesión.** Crear `lib/user-context.tsx` (`"use client"`) con `UserProvider` y el hook `useUser()`. Inicializa `user` en `null`, lo carga desde `localStorage("av_user")` en un `useEffect` (evita mismatch de hidratación SSR), y expone `login(user: SessionUser | null)` y `signOut()` que actualizan estado + `localStorage`.
3. **Guardado de puntuación.** Crear `lib/scores.ts` con `saveScore(entry: Omit<SavedScoreEntry, "at">)`, que agrega la entrada a `av_scores` en `localStorage` (misma lógica que `handleSaveScore` en `app.jsx`).
4. **Layout raíz.** Editar `app/layout.tsx`: envolver `children` en `<UserProvider>`, añadir los divs decorativos `.av-bg` y `.av-noise`, montar `<Nav />` y el `<footer>` (texto y estilo idénticos a `app.jsx`), y envolver el contenido de página en un `<main className="av-main">`. Confirmar visualmente que la app carga sin pantalla (build limpio).
5. **Componente Nav.** Crear `components/Nav.tsx` (`"use client"`), migrado desde `nav.jsx`: usa `usePathname()` de `next/navigation` para resaltar el enlace activo (`/` y `/juego/*` → Biblioteca; `/salon` → Salón), `useUser()` para sesión, `next/link` para navegación, y estado local para el panel móvil.
6. **Pantalla Biblioteca.** Crear `components/GameCard.tsx` y `components/Library.tsx` (migrados desde `biblioteca.jsx`, incluyendo el efecto de tilt con `onMouseMove`). Reemplazar `app/page.tsx` (boilerplate actual) para renderizar `<Library />`. Verificar: buscador y chips de categoría filtran el grid.
7. **Pantalla Detalle.** Crear `components/GameDetail.tsx` (migrado desde `detalle.jsx`) y la ruta `app/juego/[id]/page.tsx` que resuelve el juego por `id` con `GAMES.find` y llama `notFound()` si no existe. Verificar: navegar desde una tarjeta de Biblioteca abre el detalle correcto.
8. **Pantalla Reproductor.** Crear `components/GamePlayer.tsx` (migrado desde `reproductor.jsx`, incluyendo el `setInterval` de puntuación, pausa, fin de juego y modal de guardado usando `saveScore`) y la ruta `app/juego/[id]/jugar/page.tsx`. Verificar: pausar detiene el incremento de puntaje, "FIN" abre el modal, guardar puntuación persiste en `localStorage` y no rompe si se repite.
9. **Pantalla Salón de la Fama.** Crear `components/HallOfFame.tsx` (migrado desde `salon.jsx`) y la ruta `app/salon/page.tsx`. El tab inicial es `GAMES[0].id`; cambiar de tab solo actualiza estado local (no la URL). Verificar: podio y tabla se regeneran al cambiar de tab, la fila "tu marca" aparece solo con sesión iniciada.
10. **Pantalla Autenticación.** Crear `components/Auth.tsx` (migrado desde `auth.jsx`) y la ruta `app/auth/page.tsx`. Al enviar el formulario o pulsar "jugar como invitado", llama a `login()` del contexto y navega a `/` con `useRouter().push`. Verificar: iniciar sesión actualiza el `Nav` sin recargar la página.
11. **Limpieza final.** Eliminar el contenido boilerplate de `create-next-app` que ya no se use (imágenes `public/*.svg` sin referencias, si quedaron huérfanas) y correr `npm run lint` y `npm run build` hasta que pasen sin errores.

---

## Acceptance criteria

- [ ] `npm run build` compila sin errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `/` muestra la Biblioteca: el buscador filtra por título y los chips de categoría filtran por `cat`, combinándose entre sí.
- [ ] Al hacer clic en una tarjeta o en su botón "JUGAR" se navega a `/juego/[id]` con el `id` correcto.
- [ ] `/juego/[id]` con un `id` inexistente responde con la página 404 de Next.js.
- [ ] `/juego/[id]` muestra portada, tags, descripción, stats y una tabla de mejores puntuaciones con 10 filas.
- [ ] El botón "▶ JUGAR AHORA" en Detalle navega a `/juego/[id]/jugar`.
- [ ] En `/juego/[id]/jugar`, la puntuación aumenta automáticamente mientras el juego no está en pausa ni terminado.
- [ ] Pulsar "PAUSA" detiene el incremento de puntuación y lo cambia a "REANUDAR"; pulsar de nuevo lo reanuda.
- [ ] Pulsar "FIN" abre el modal de fin de juego mostrando la puntuación final.
- [ ] Guardar la puntuación en el modal (con nombre) agrega una entrada a `localStorage["av_scores"]` y muestra el mensaje "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia puntuación, vidas y nivel sin salir de la pantalla.
- [ ] `/salon` muestra un tab por cada juego de `GAMES`; cambiar de tab regenera el podio y la tabla para ese juego.
- [ ] Con sesión iniciada, `/salon` muestra la fila "▸ TU MEJOR MARCA EN {juego}"; sin sesión, no aparece.
- [ ] `/auth`: enviar el formulario de "iniciar sesión" o "crear cuenta" guarda el usuario en `localStorage["av_user"]`, navega a `/` y el `Nav` muestra el nombre de usuario en mayúsculas (máx. 10 caracteres) sin recargar la página.
- [ ] `/auth`: "JUGAR COMO INVITADO" navega a `/` sin sesión iniciada (usuario `null`).
- [ ] Con sesión iniciada, pulsar el nombre de usuario en el `Nav` cierra la sesión (elimina `av_user` de `localStorage`) y el botón vuelve a mostrar "Iniciar Sesión".
- [ ] Recargar la página (F5) en cualquier ruta conserva la sesión iniciada, si la había.
- [ ] El enlace "Biblioteca" del `Nav` aparece activo (resaltado en cian) en `/`, `/juego/[id]` y `/juego/[id]/jugar`; el enlace "Salón de la Fama" aparece activo solo en `/salon`.
- [ ] En viewport menor a 840px, el menú hamburguesa reemplaza los enlaces de escritorio y abre el panel lateral móvil.

---

## Decisions

- **Sí:** rutas reales de Next.js App Router (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/salon`, `/auth`) en vez de enrutamiento por hash. Es lo idiomático en App Router, da URLs compartibles y botón atrás nativo. Decidido con el usuario.
- **Sí:** nombres de ruta en español, coincidiendo con la UI y el README (que está en español). Decidido con el usuario.
- **Sí:** persistencia de sesión y puntuaciones guardadas vía `localStorage`, con las mismas claves que la referencia (`av_user`, `av_scores`). Decidido con el usuario.
- **Sí:** mantener la simulación decorativa del reproductor (puntuación con `setInterval`, animaciones CSS de nave/enemigos). Es puramente visual, no constituye "un juego" con reglas o colisiones. Decidido con el usuario.
- **Sí:** portar `styles.css` casi literalmente a `app/globals.css` (ya iniciado en el commit `a08dd8a`) en vez de reescribir el diseño con utilidades de Tailwind. El diseño de referencia usa `clip-path`, efectos CRT y neón muy específicos que se pierden fácilmente al traducir a utilidades; el proyecto ya usa `@theme inline` solo para los tokens de color reutilizables por Tailwind.
- **Sí:** contexto de React (`UserProvider`) en el layout raíz para compartir la sesión entre `Nav`, `Auth` y `GamePlayer`, en vez de que cada componente lea `localStorage` de forma aislada. En la referencia esto lo resolvía el único componente `App`; en App Router el layout persiste entre navegaciones, así que un contexto evita que el `Nav` quede desincronizado tras iniciar sesión en `/auth`.
- **No:** sincronizar el tab del Salón de la Fama o los filtros de la Biblioteca con la URL (`?juego=`, `?q=`, `?cat=`). La referencia tampoco lo hace; queda fuera para no ampliar el alcance visual acordado.
- **No:** eliminar `reference/templates/`. Sirve como fuente de verdad visual durante y después de la implementación.

---

## What is **not** in this spec

- Lógica real de cualquier juego jugable.
- Autenticación real, OAuth, backend o base de datos.
- Persistencia de puntuaciones más allá de `localStorage` del navegador.
- Sistema de créditos/monedas funcional.
- Página de cuenta de usuario.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
