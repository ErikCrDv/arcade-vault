# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-11-11
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Auth y Salón de la Fama) con datos simulados y sin ningún juego real.

---

## Por qué existe esta spec

El repo solo tiene el scaffold de Create Next App, con el tema arcade ya cargado en `app/globals.css`. Las plantillas son un prototipo React 18 que se ejecuta en el navegador con Babel standalone y un router por hash. Este MVP las convierte en rutas reales de Next 16 para poder iterar la UI antes de construir juegos, backend o autenticación.

---

## Alcance

**Incluye:**

- Cinco rutas del App Router que replican visualmente cada plantilla:
  - `/` → Biblioteca (`biblioteca.jsx`): hero, buscador, chips de categoría, grilla de tarjetas con efecto tilt y estado "NO HAY RESULTADOS".
  - `/juegos/[id]` → Detalle (`detalle.jsx`): portada, tags, descripción, stat-strip, acciones y leaderboard de 10 filas.
  - `/juegos/[id]/jugar` → Reproductor (`reproductor.jsx`): HUD, pantalla CRT con arena animada, **demo simulada** (puntuación que sube sola con `setInterval`), PAUSA/REANUDAR, FIN, SALIR y modal de fin de juego con guardado de puntuación.
  - `/auth` → Auth (`auth.jsx`): pestañas Iniciar sesión / Crear cuenta, formulario, "Jugar como invitado" y botones sociales decorativos.
  - `/salon` → Salón de la Fama (`salon.jsx`): pestañas por juego, podio, tabla de 12 filas y la fila "TU MEJOR MARCA" cuando hay usuario.
- Nav compartido (`nav.jsx`) con links activos, contador de créditos estático, botón de usuario o de iniciar sesión, y panel móvil con hamburguesa.
- Footer compartido (el de `app.jsx`).
- Página 404 temática en `app/not-found.tsx`. Se usa para ids de juego inexistentes y para rutas desconocidas.
- Datos simulados en TypeScript (`lib/data.ts`).
- Sesión y puntuaciones simuladas en `localStorage`, con las mismas claves de la plantilla.

**Fuera de alcance (para specs futuras):**

- Cualquier juego real (lógica, canvas, input de teclado o táctil).
- Autenticación real, OAuth de Google/GitHub y validación de formularios.
- Backend, base de datos o API routes.
- Leer `av_scores` para alimentar leaderboards o el Salón de la Fama. Los rankings siguen viniendo de `seededScores`.
- Sistema de créditos funcional (el contador "CRÉDITOS · 03" es estático).
- Menú desplegable de usuario (el botón `{nombre} ▾` cierra la sesión directamente, como en la plantilla).
- Tests automatizados y configuración de un test runner.
- Reescribir los estilos con utilidades de Tailwind.

---

## Modelo de datos

`lib/data.ts` es la traducción tipada de `references/templates/data.jsx`:

```ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en /juegos/[id]
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;       // clase CSS: "cover-bricks", "cover-tetro", …
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"

export const GAMES: Game[];                                  // los 8 juegos de la plantilla
export const CATS: ("TODOS" | Category)[];                   // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[]; // mismo algoritmo determinista
```

`lib/session.ts` contiene el mock en el cliente:

```ts
export type User = { name: string };  // nombre en MAYÚSCULAS, máx. 10 caracteres
export type ScoreEntry = { game: string; score: number; name: string; at: number };

// localStorage keys (sin versionar, idénticas a la plantilla)
// "av_user"   → User | null
// "av_scores" → ScoreEntry[]
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Las semillas de `seededScores` son las de la plantilla: detalle `id.length * 17 + 3` con 10 filas; salón `id.length * 23 + 7` con 12 filas.
- Las fechas de `seededScores` son fijas y deterministas, así que no hay diferencias de hidratación.

---

## Plan de implementación

1. **Datos.** Crear `lib/data.ts` con los tipos, `GAMES`, `CATS`, `getGame` y `seededScores`. Verificación: `npm run lint` pasa.
2. **Sesión simulada.** Crear `lib/session.ts`. Debe incluir un hook cliente `useUser()` (lee `av_user` después de montar y expone `login(user)` y `logout()`) y una función `saveScore(entry)` que agrega a `av_scores`. Las lecturas van en `try/catch`.
3. **Layout compartido.** Crear `components/nav.tsx` (`"use client"`, con `usePathname` para el link activo y `useUser` para el botón) y `components/footer.tsx`. Montarlos en `app/layout.tsx` y envolver `children` en `<main className="av-main">`. Verificación: `npm run dev` muestra el nav y el footer.
4. **Biblioteca.** Reemplazar `app/page.tsx` por la Biblioteca. Crear `components/game-card.tsx` (cliente, con tilt) y `components/library.tsx` (cliente, con búsqueda y filtro de categoría). La tarjeta y su botón JUGAR enlazan a `/juegos/[id]`. Verificación: filtrar por "PUZZLE" deja solo CAÍDA.
5. **Detalle.** Crear `app/juegos/[id]/page.tsx`. Es un Server Component que lee `params` (es una Promise y hay que esperarla), llama a `notFound()` si `getGame` devuelve `undefined` y exporta `generateStaticParams` con los 8 ids. "JUGAR AHORA" lleva a `/juegos/[id]/jugar` y "VOLVER AL VAULT" a `/`.
6. **404.** Crear `app/not-found.tsx` con estética arcade (texto pixel en magenta tipo "GAME OVER · 404" y un botón que vuelve a `/`). Verificación: `/juegos/no-existe` la muestra.
7. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx`. El servidor resuelve el juego o llama a `notFound()`, y luego renderiza `components/game-player.tsx` (cliente). Ese componente replica `reproductor.jsx`: puntuación simulada, subida de nivel, pausa, FIN, modal con input de iniciales, `saveScore` y los botones "JUGAR DE NUEVO" y "VOLVER AL VAULT". "SALIR" lleva al detalle.
8. **Auth.** Crear `app/auth/page.tsx` con `components/auth-form.tsx` (cliente). Al enviar se hace `login({ name })` con el nombre en mayúsculas, recortado a 10 caracteres y con `PLAYER1` por defecto, y luego `router.push("/")`. "Jugar como invitado" hace `logout()` y luego `push("/")`.
9. **Salón de la Fama.** Crear `app/salon/page.tsx` con `components/hall-of-fame.tsx` (cliente). Incluye pestañas por juego, podio, tabla con animación escalonada y la fila "TU MEJOR MARCA" si `useUser` devuelve un usuario. "VOLVER A LA BIBLIOTECA" lleva a `/`.
10. **Metadata.** Agregar un `title` por ruta (`metadata` estático o `generateMetadata` en las rutas de juego), por ejemplo `"BLOQUE BUSTER · Arcade Vault"`.

`app/globals.css` ya contiene todas las clases de `references/templates/styles.css`, así que no hay que portar CSS. Solo se agregan reglas nuevas si la página 404 las necesita.

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run build` termina sin errores y pre-genera `/juegos/[id]` para los 8 juegos.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas.
- [ ] Escribir "roc" en el buscador deja solo la tarjeta ROCAS.
- [ ] Elegir el chip "VERSUS" deja solo DUELO PIXEL.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta navega a `/juegos/<id>`, con título, descripción, stat-strip y 10 filas de leaderboard.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la 404 temática.
- [ ] En `/juegos/<id>/jugar` la puntuación sube sola.
- [ ] En el reproductor, PAUSA la detiene y muestra "EN PAUSA", y REANUDAR la continúa.
- [ ] FIN abre el modal con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" agrega una entrada `{ game, score, name, at }` a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [ ] "JUGAR DE NUEVO" reinicia la puntuación a 0, las vidas a 3 y el nivel a 01.
- [ ] En `/auth`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario con usuario "neonfox" guarda `{"name":"NEONFOX"}` en `av_user` y redirige a `/`.
- [ ] Después del login, el nav muestra "NEONFOX ▾" y el usuario sigue ahí al recargar la página.
- [ ] Hacer clic en "NEONFOX ▾" borra `av_user` y el nav vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon` muestra el podio y 12 filas, y cambiar de pestaña cambia los nombres.
- [ ] Con sesión iniciada, `/salon` muestra la fila "▸ TU MEJOR MARCA EN …". Sin sesión no aparece.
- [ ] El link "Biblioteca" del nav está activo en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`.
- [ ] El link "Salón de la Fama" está activo en `/salon`.
- [ ] Con un viewport de menos de 768 px se ve la hamburguesa, que abre el panel lateral. Tocar el fondo lo cierra.
- [ ] Ninguna ruta tiene errores de hidratación en la consola del navegador.
- [ ] La comparación lado a lado con `references/templates/Arcade Vault.html` no muestra diferencias de layout, colores ni tipografía en las cinco pantallas.

---

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). Dan URLs compartibles y aprovechan Next.
- **No:** SPA con router por hash como `app.jsx`. Sería más fiel a la plantilla, pero no aprovecha Next.
- **Sí:** demo simulada en el reproductor. Permite revisar HUD, pausa y modal sin un juego real.
- **No:** placeholder estático en el CRT. Dejaría sin validar el flujo de fin de juego.
- **Sí:** mock en `localStorage` con las claves `av_user` y `av_scores`, idénticas a la plantilla. El nav y el Salón reaccionan al usuario.
- **No:** versionar las claves (`:v1`). Es un mock desechable que se reemplazará con autenticación real.
- **No:** solo estado en memoria. El usuario se perdería al recargar y no se podría probar el Salón.
- **Sí:** reusar las clases `.av-*` de `app/globals.css`. Ya contienen todo `styles.css`, así que la fidelidad visual es máxima con el menor costo.
- **No:** reescribir con utilidades de Tailwind. Es mucho más trabajo y hay riesgo de perder fidelidad.
- **Sí:** datos en `lib/data.ts` con tipos, y componentes en `components/` en la raíz (alias `@/components/...`).
- **Sí:** `notFound()` con una 404 temática, más `generateStaticParams` para los 8 juegos.
- **No:** redirigir en silencio a `/` ante un id inválido. Oculta errores de enlace.
- **Sí:** Server Components para las páginas y `"use client"` solo en los componentes interactivos (nav, tarjeta, biblioteca, reproductor, auth, salón).
- **Sí:** verificar con `lint` + `build` + checklist manual.
- **No:** agregar Vitest o Playwright en esta spec. Amplía el alcance.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Error de hidratación al leer `localStorage` durante el render (nav y salón) | `useUser` empieza en `null` y lee `av_user` en un `useEffect` después de montar. |
| `cacheComponents` exige límites de Suspense para el acceso dinámico | Las páginas solo usan `params` y datos estáticos con `generateStaticParams`. Antes de escribir cada ruta se consulta `node_modules/next/dist/docs/`. |
| APIs de Next 16 distintas a las conocidas (`params` como Promise, `LayoutProps`/`PageProps` globales) | Leer las guías en `node_modules/next/dist/docs/01-app` antes del paso 3. |
| `setInterval` del reproductor sigue corriendo al salir de la ruta | Limpiar el intervalo en el cleanup del `useEffect`, como hace la plantilla. |

---

## Lo que **no** entra en esta spec

- Juegos reales de cualquier tipo.
- Autenticación real u OAuth.
- Backend, base de datos o API routes.
- Leaderboards alimentados por `av_scores`.
- Créditos funcionales.
- Menú desplegable de usuario.
- Tests automatizados.
- Migración de los estilos a Tailwind.

Cada uno de estos, si llega, va en su propia spec.
