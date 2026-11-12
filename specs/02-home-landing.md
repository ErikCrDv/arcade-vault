# SPEC 02 — Home de aterrizaje en `/` y Biblioteca en `/juegos`

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-11
> **Objetivo:** Portar la landing de `references/templates/home-about/home.jsx` a la ruta `/` y mover la Biblioteca actual a `/juegos`, actualizando nav y enlaces.

---

## Por qué existe esta spec

SPEC 01 dejó la Biblioteca en `/`. La nueva plantilla `home-about/` agrega una landing de marketing que debe ser la puerta de entrada. La Biblioteca pasa a `/juegos`, que ya es el prefijo de `/juegos/[id]` y `/juegos/[id]/jugar`, así que las URLs quedan coherentes.

---

## Alcance

**Incluye:**

- Nueva ruta `/` con el Home de `home.jsx`, con estas secciones y en este orden:
  - Hero con siluetas pixel flotantes (`FloatingSilhouettes`, 8 SVGs), eyebrow "▸ INSERTA UNA MONEDA_", título de 3 líneas, subtítulo, CTAs "EXPLORAR JUEGOS" y "CREAR CUENTA", e indicador "DESLIZA ▼".
  - `// 01 ¿POR QUÉ ARCADE VAULT?` con 4 `feature-card` e íconos pixel (`FeatureIcon`: GAMEPAD, FREE, TROPHY, ROCKET).
  - `// 02 JUEGOS DISPONIBLES AHORA` con un rail de 6 `mini-card` y el botón "VER TODOS LOS JUEGOS →".
  - Banda de stats (3 bloques).
  - `// 03 ACTIVIDAD EN VIVO` con "ÚLTIMAS PUNTUACIONES" (7 filas) y "TOP JUGADORES · HOY" (5 filas con barra) más el link "VER SALÓN →".
  - `// 04 PRECIOS` con la tarjeta "JUGADOR VAULT $0" y 3 preguntas frecuentes.
  - CTA final "¿LISTO PARA JUGAR?" con el botón "INSERTAR MONEDA →".
  - Animación `.reveal` al hacer scroll (IntersectionObserver, umbral 0.12).
- Mover la Biblioteca de `app/page.tsx` a `app/juegos/page.tsx`, sin cambios visuales.
- Nav: nuevo link "Inicio" → `/` y "Biblioteca" → `/juegos`, en escritorio y en el panel móvil. El logo sigue llevando a `/`.
- Reapuntar los enlaces existentes que hoy van a `/`.
- `/auth?modo=registro` abre directamente la pestaña CREAR CUENTA.
- Portar a `app/globals.css` solo los bloques CSS del Home desde `references/templates/home-about/styles.css`: `HOME PAGE` (aprox. líneas 943–1070), `ACTIVITY` (1621–1671) y `PRICING` (1672–1730), con sus `@keyframes` (`bounce`, `float`, `pulse-led`, `tickin`, etc.).

**Fuera de alcance (para specs futuras):**

- Página About (`about.jsx`) y el link "Acerca de" del nav.
- Gamepad y selector de temas que trae `home-about/styles.css`.
- Actividad en vivo real: el ticker y el top siguen siendo mocks que no leen `av_scores`.
- Contadores reales de partidas o jugadores.
- Redirecciones 301 de rutas viejas (no hay usuarios ni URLs públicas todavía).
- Tests automatizados.
- Migración de estilos a Tailwind.

---

## Modelo de datos

Se agregan mocks tipados a `lib/data.ts`. Se reusan `GAMES` y `Game` de SPEC 01.

```ts
export type RecentScore = {
  player: string;   // "NEONFOX"
  game: string;     // título visible: "Caída"
  score: number;
  ago: string;      // "hace 2 min"
  color: GameColor;
};

export type TopPlayer = { rank: number; player: string; score: number };

export const RECENT_SCORES: RecentScore[]; // las 7 filas de la plantilla
export const TOP_TODAY: TopPlayer[];       // las 5 filas de la plantilla
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`, igual que en SPEC 01.
- El primer stat se calcula de `GAMES.length` ("8 JUEGOS · Y CONTANDO"), no se usa el "12+" literal. Los otros dos stats ("MILES DE PARTIDAS", "GLOBAL RANKING") son texto fijo.
- El rail usa `GAMES.slice(0, 6)`.
- Las features, las preguntas frecuentes y los textos del pricing van inline en el componente porque son copy, no datos.
- `?modo=registro` es el único valor reconocido del query param `modo` en `/auth`. Cualquier otro valor, o su ausencia, abre INICIAR SESIÓN.

---

## Plan de implementación

1. **Mover la Biblioteca.** Crear `app/juegos/page.tsx` con el contenido actual de `app/page.tsx` (`<Library />`, title "Biblioteca · Arcade Vault"). Dejar temporalmente `app/page.tsx` igual. Verificación: `/juegos` y `/` muestran la Biblioteca, y `/juegos/<id>` sigue funcionando.
2. **Nav.** En `components/nav.tsx`, agregar "Inicio" → `/` (activo solo si `pathname === "/"`) y cambiar "Biblioteca" a `/juegos` (activo si `pathname.startsWith("/juegos")`). Aplicarlo en escritorio y en el panel móvil. Verificación: los links activos son correctos en `/`, `/juegos` y `/juegos/<id>/jugar`.
3. **Reapuntar enlaces.** Cambiar a `/juegos`: "VOLVER AL VAULT" en `app/juegos/[id]/page.tsx` y `components/game-player.tsx`, "VOLVER A LA BIBLIOTECA" en `components/hall-of-fame.tsx`, y los dos `router.push("/")` de `components/auth-form.tsx`. La 404 (`app/not-found.tsx`) sigue apuntando a `/`.
4. **Auth con `?modo=registro`.** En `components/auth-form.tsx`, inicializar la pestaña con `useSearchParams().get("modo") === "registro" ? "up" : "in"`. En `app/auth/page.tsx`, envolver `<AuthForm />` en `<Suspense>`, porque `cacheComponents` lo exige al leer search params. Antes de hacerlo hay que consultar `node_modules/next/dist/docs/` sobre `useSearchParams`. Verificación: `/auth?modo=registro` muestra el campo de correo.
5. **CSS.** Copiar a `app/globals.css` los bloques HOME PAGE, ACTIVITY y PRICING de `home-about/styles.css`. Verificar que los `@keyframes` que usan existan (`blink` para `.hero-eyebrow .blink`, `pulse`, `fadeIn`) y agregar los que falten sin duplicar los ya presentes. Verificación: `npm run build` pasa.
6. **Datos.** Agregar `RecentScore`, `TopPlayer`, `RECENT_SCORES` y `TOP_TODAY` a `lib/data.ts`. Verificación: `npm run lint` pasa.
7. **Piezas del Home.** Crear `components/home/` con:
   - `floating-silhouettes.tsx` (Server Component, solo SVG).
   - `feature-icon.tsx` (Server Component).
   - `reveal-observer.tsx` (`"use client"`; corre el IntersectionObserver de `useReveal` en un `useEffect` y no renderiza nada).
   - `mini-card.tsx` (un `<Link>` a `/juegos/<id>` con la estructura `mini-card` de la plantilla).
8. **Página Home.** Reemplazar `app/page.tsx` por el Home (Server Component, title "Arcade Vault · El arcade clásico está de vuelta"), compuesto con las piezas del paso 7 e incluyendo `<RevealObserver />`. Los `onClick={navigate(...)}` de la plantilla se convierten en `<Link>`:
   - "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" → `/juegos`.
   - "CREAR CUENTA" y "EMPEZAR GRATIS" → `/auth?modo=registro`.
   - "VER SALÓN" → `/salon`.
   - Cada mini-card → `/juegos/<id>`.

`.btn` ya tiene estilos de botón y funciona sobre `<a>` (SPEC 01 ya usa `<Link className="btn …">`).

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run build` termina sin errores.
- [ ] `/` muestra el hero con el texto "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" y las siluetas animadas.
- [ ] `/` muestra las secciones `// 01` a `// 04` y el CTA final, en ese orden.
- [ ] Las secciones con `.reveal` aparecen (reciben la clase `in`) al entrar en el viewport.
- [ ] El rail de `// 02` muestra 6 tarjetas, y hacer clic en una navega a `/juegos/<id>`.
- [ ] El primer stat muestra "8" y "JUEGOS".
- [ ] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" llevan a `/juegos`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS" llevan a `/auth?modo=registro`, que abre con la pestaña CREAR CUENTA y el campo de correo visible.
- [ ] `/auth` sin parámetros abre en INICIAR SESIÓN.
- [ ] "VER SALÓN →" lleva a `/salon`.
- [ ] `/juegos` muestra la Biblioteca idéntica a la de SPEC 01: hero, buscador, chips y 8 tarjetas.
- [ ] En el nav, "Inicio" está activo solo en `/`.
- [ ] "Biblioteca" está activo en `/juegos`, `/juegos/<id>` y `/juegos/<id>/jugar`, y no en `/`.
- [ ] El panel móvil (< 768 px) muestra "Inicio" y "Biblioteca" con los mismos estados activos.
- [ ] "VOLVER AL VAULT" (detalle y modal del reproductor) y "VOLVER A LA BIBLIOTECA" (salón) llevan a `/juegos`.
- [ ] Iniciar sesión y "Jugar como invitado" en `/auth` redirigen a `/juegos`.
- [ ] El botón de la 404 lleva a `/`.
- [ ] Ninguna ruta tiene errores de hidratación en la consola del navegador.
- [ ] La comparación lado a lado de `/` con el Home de `references/templates/home-about/arcade-vault-standalone.html` no muestra diferencias de layout, colores ni tipografía.

---

## Decisiones

- **Sí:** `/` = Home y `/juegos` = Biblioteca. `/juegos` ya es el prefijo de detalle y reproductor.
- **Sí:** nav con "Inicio" y "Biblioteca". Es fiel a la plantilla sin depender de About.
- **No:** el link "Acerca de". Daría 404 hasta que exista su spec.
- **Sí:** los enlaces de "volver a la biblioteca/vault" y el redirect de `/auth` van a `/juegos`. Tras iniciar sesión, el usuario quiere jugar, no ver la landing otra vez.
- **Sí:** la 404 vuelve a `/`, que es la puerta de entrada general.
- **Sí:** mocks tipados `RECENT_SCORES` y `TOP_TODAY` en `lib/data.ts`. Centraliza los datos falsos y facilita reemplazarlos después por `av_scores` o un backend.
- **Sí:** el stat de juegos sale de `GAMES.length`. El "12+" de la plantilla sería falso con 8 juegos.
- **No:** copiar los arrays inline como en la plantilla. Dispersa los datos simulados.
- **Sí:** `/auth?modo=registro`. Los CTA de registro caen directamente en la pestaña correcta.
- **No:** una ruta separada `/registro`. Duplica la pantalla de Auth.
- **Sí:** Home como Server Component, con un único `RevealObserver` cliente. Minimiza el JS enviado. Los botones son `<Link>`, no `onClick`.
- **Sí:** portar solo los bloques CSS del Home. About y gamepad entran en sus propias specs.
- **No:** reemplazar `globals.css` por `home-about/styles.css` completo. Arrastraría CSS sin uso y arriesga regresiones.
- **No:** redirecciones de rutas antiguas. No hay URLs públicas que proteger.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `useSearchParams` con `cacheComponents` falla en build si no hay `<Suspense>` | Envolver `<AuthForm />` en `<Suspense>` en `app/auth/page.tsx`. Leer antes la guía en `node_modules/next/dist/docs/`. |
| Choque de nombres CSS (`.reveal`, `.blink`, `@keyframes` duplicados) al portar los bloques | Hacer grep en `globals.css` por cada clase y keyframe antes de pegar. Si ya existe, reutilizarlo. |
| Las secciones `.reveal` quedan invisibles si el observer no corre (sin JS o hidratación tardía) | `RevealObserver` se monta en la misma página. Comprobarlo en el criterio de aceptación de `.reveal`. |
| Hidratación: `toLocaleString("es-ES")` difiere entre servidor y cliente | Los mocks son estáticos y el Home es Server Component, así que se renderiza una sola vez en el servidor. |

---

## Lo que **no** entra en esta spec

- Página About y link "Acerca de".
- Gamepad y temas de `home-about/styles.css`.
- Actividad en vivo y contadores reales.
- Redirecciones de rutas antiguas.
- Tests automatizados.
- Migración de estilos a Tailwind.

Cada uno de estos, si llega, va en su propia spec.
