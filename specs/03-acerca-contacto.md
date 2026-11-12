# SPEC 03 — Página Acerca de en `/acerca` con formulario de contacto vía Resend

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-11
> **Objetivo:** Portar la página About de `references/templates/home-about/about.jsx` a `/acerca` y hacer que su formulario de contacto envíe un correo real al equipo con Resend mediante una Server Action.

---

## Por qué existe esta spec

SPEC 02 dejó fuera la página About y el link "Acerca de" del nav, porque habría dado 404. La plantilla trae un formulario de contacto que hoy solo simula el envío. Esta spec porta la página tal cual y conecta el formulario a Resend para que los mensajes lleguen de verdad al buzón del equipo.

---

## Alcance

**Incluye:**

- Nueva ruta `/acerca`, fiel a `about.jsx`, en este orden:
  - Hero: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 `highlight` con íconos pixel (`HighlightIcon`: HEART, BROWSER, PLANT) en magenta, cyan y verde.
  - Divisor `about-divider` con 24 píxeles animados (`.reveal`).
  - Sección contacto (`.reveal`): intro con kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo y 3 tips con LED. A la derecha, el formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE y el botón "▶  ENVIAR MENSAJE".
  - Estado de éxito `terminal-success` con las líneas de la plantilla y "GRACIAS, {NOMBRE}." en mayúsculas, más el botón "ENVIAR OTRO MENSAJE", que limpia el formulario.
- Envío real con Resend desde una Server Action:
  - Un solo correo al equipo, en texto plano, con `replyTo` igual al correo del usuario.
  - Validación en el servidor: campos requeridos, formato de email y límites de longitud.
  - Campo honeypot oculto contra bots.
- Estados de UI que la plantilla no tiene:
  - **Cargando:** botón deshabilitado con el texto "▶  TRANSMITIENDO…".
  - **Error:** línea en estilo terminal roja sobre el botón, más el shake del formulario. Se conservan los valores escritos.
- Validación en el cliente igual a la plantilla: si algún campo está vacío, el formulario hace shake y no se envía.
- Nav: link "Acerca de" → `/acerca` (activo si `pathname.startsWith("/acerca")`), en escritorio y en el panel móvil, después de "Salón de la Fama".
- Portar a `app/globals.css` los bloques CSS de About de `references/templates/home-about/styles.css` (aprox. líneas 1071–1146: `.about*`, `.highlight*`, `.about-divider`, `.div-*`, `.contact-*`, `.btn.press`, `.terminal-success`, `.term-*`) con sus `@keyframes` `pxblink` y `shake`, más `.fade-in` si falta. También estilos nuevos mínimos para la línea de error y para ocultar el honeypot.
- Dependencia `resend` en `package.json`.
- Documentar en `README.md` las variables de entorno.

**Fuera de alcance (para specs futuras):**

- Correo de confirmación al usuario (requiere dominio verificado en Resend).
- Plantillas HTML o React Email.
- Rate limiting por IP (necesita almacenamiento externo).
- CAPTCHA o Turnstile.
- Guardar los mensajes en una base de datos o panel de administración.
- Gamepad y selector de temas de `home-about/styles.css`.
- Tests automatizados.
- Migración de estilos a Tailwind.

---

## Modelo de datos

No hay persistencia. Se introducen estos tipos y variables:

```ts
// app/acerca/actions.ts
export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields: { name: string; email: string; msg: string } };

export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState>;
```

Campos del `FormData`: `name`, `email`, `msg` y `website` (honeypot).

Límites de validación en el servidor (después de `trim()`):

| Campo | Regla |
| --- | --- |
| `name` | requerido, ≤ 60 caracteres |
| `email` | requerido, ≤ 254 caracteres, regex básica `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `msg` | requerido, ≤ 2000 caracteres |
| `website` | si viene con contenido, se devuelve `success` sin enviar nada (al bot no se le avisa) |

Variables de entorno (solo servidor, nunca `NEXT_PUBLIC_`):

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `RESEND_API_KEY` | API key de Resend | — (requerida) |
| `CONTACT_TO_EMAIL` | buzón del equipo | — (requerida) |
| `CONTACT_FROM_EMAIL` | remitente | `Arcade Vault <onboarding@resend.dev>` |

Formato del correo:

- **Asunto:** `[Arcade Vault] Mensaje de {name}`
- **Cuerpo (texto):** `Nombre: …\nCorreo: …\n\n{msg}`

Mensajes de error que ve el usuario (estilo terminal, en mayúsculas):

- Validación: `[ERR] REVISA LOS CAMPOS: {detalle}`, por ejemplo "CORREO INVÁLIDO" o "MENSAJE DEMASIADO LARGO (MÁX 2000)".
- Falta configuración o Resend devuelve error: `[ERR] NO SE PUDO TRANSMITIR. INTÉNTALO DE NUEVO MÁS TARDE.` El detalle se registra con `console.error` en el servidor y nunca se expone al cliente.

---

## Plan de implementación

Antes de escribir código hay que leer `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, `forms.md` y `environment-variables.md`.

1. **Dependencia y entorno.** `npm install resend`. Agregar a `README.md` la sección "Variables de entorno" con las tres variables y la nota de que `onboarding@resend.dev` solo entrega al correo dueño de la cuenta de Resend. El usuario crea `.env.local`, que ya está ignorado por `.gitignore`. Verificación: `npm run build` pasa.
2. **CSS.** Copiar a `app/globals.css` los bloques de About indicados en el Alcance. Agregar `@keyframes pxblink` y `shake`, y `.fade-in` si falta (`fadeIn`, `blink` y `.field` ya existen). Agregar `.term-error` (mono, `var(--magenta)` o rojo, con prefijo) y `.hp-field` (fuera de pantalla, `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`). Antes de pegar, hacer grep de cada clase y keyframe para no duplicar. Verificación: `npm run build` pasa.
3. **Server Action.** Crear `app/acerca/actions.ts` (`"use server"`) con `ContactState` y `sendContact`. Hace en orden: honeypot, `trim` y validación, lectura de variables de entorno (si faltan, error genérico y `console.error`), y `new Resend(key).emails.send({ from, to, replyTo, subject, text })`. Si Resend responde `{ error }`, se devuelve error genérico. Verificación: `npm run lint` pasa.
4. **Íconos.** Crear `components/about/highlight-icon.tsx` (Server Component) con los 3 SVG de `HighlightIcon` de la plantilla.
5. **Formulario.** Crear `components/about/contact-form.tsx` (`"use client"`) con `useActionState(sendContact, { status: "idle" })` y `<form action={formAction}>`:
   - Inputs controlados con `name` (`name`, `email`, `msg`), más el honeypot `website`.
   - `onSubmit`: si algún campo está vacío tras `trim`, `preventDefault()` y shake de 400 ms, como en la plantilla.
   - `isPending` deshabilita el botón y cambia su texto a "▶  TRANSMITIENDO…".
   - Con `status === "error"`, muestra `.term-error` sobre el botón y dispara el shake.
   - Con `status === "success"`, muestra `terminal-success` con el nombre. "ENVIAR OTRO MENSAJE" limpia el formulario y vuelve al estado `idle` (por ejemplo, con un `key` que remonta el formulario).
6. **Página.** Crear `app/acerca/page.tsx` (Server Component, title "Acerca de · Arcade Vault") con hero, highlights, divisor e intro de contacto inline, `<ContactForm />` y `<RevealObserver />` de `components/home/reveal-observer.tsx`. El contenedor raíz usa `className="about fade-in"`.
7. **Nav.** En `components/nav.tsx`, agregar `isAbout = pathname.startsWith("/acerca")` y el `<Link href="/acerca">Acerca de</Link>` en escritorio y en el panel móvil (este último con `onClick={close}`). Verificación: el link está activo solo en `/acerca`.
8. **Verificación final.** `npm run lint`, `npm run build` y prueba manual con `.env.local` real (ver criterios).

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run build` termina sin errores, incluso **sin** `.env.local`.
- [ ] `/acerca` muestra el hero con "ACERCA DE ARCADE VAULT", el párrafo de misión y los 3 highlights con sus íconos y colores.
- [ ] El divisor de píxeles y la sección de contacto reciben la clase `in` al entrar en el viewport.
- [ ] El nav muestra "Acerca de" en escritorio y en el panel móvil (< 768 px). Está activo solo en `/acerca`.
- [ ] Enviar con algún campo vacío hace shake y no ejecuta la Server Action (sin request en la pestaña Network).
- [ ] Con un correo inválido como `a@b` y JS deshabilitado (o saltando la validación del navegador), aparece `[ERR] REVISA LOS CAMPOS: CORREO INVÁLIDO` y se conservan los valores escritos.
- [ ] Un mensaje de más de 2000 caracteres se rechaza con el error correspondiente.
- [ ] Durante el envío, el botón está deshabilitado y dice "▶  TRANSMITIENDO…".
- [ ] Con variables válidas, el envío muestra `terminal-success` con "GRACIAS, {NOMBRE}." y el correo llega a `CONTACT_TO_EMAIL` con el asunto `[Arcade Vault] Mensaje de {name}`. Responder al correo apunta al email del usuario.
- [ ] Sin `RESEND_API_KEY`, el envío muestra `[ERR] NO SE PUDO TRANSMITIR…` y el servidor registra el motivo. La API key no aparece en ninguna respuesta ni en el bundle del cliente.
- [ ] Si se llena el campo honeypot `website` (por ejemplo desde DevTools), se muestra éxito y no se envía ningún correo.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [ ] `README.md` documenta `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`.
- [ ] La consola del navegador no muestra errores de hidratación en `/acerca`.
- [ ] La comparación lado a lado de `/acerca` con la vista About de `references/templates/home-about/arcade-vault-standalone.html` no muestra diferencias de layout, colores ni tipografía (salvo los estados nuevos de carga y error).

---

## Decisiones

- **Sí:** ruta `/acerca`. Consistente con `/juegos` y `/salon`.
- **No:** `/about` ni `/acerca-de`. La primera rompe el idioma de las rutas y la segunda es más larga sin aportar nada.
- **Sí:** Server Action con `useActionState`. Mantiene la API key en el servidor, funciona sin JS y no expone un endpoint REST fijo.
- **No:** Route Handler en `/api/contacto`. Agrega más código sin un consumidor adicional.
- **Sí:** un solo correo al equipo, en texto plano y con `replyTo`. Es lo mínimo útil y responder llega directo al usuario.
- **No:** correo de confirmación al usuario. Exige un dominio verificado en Resend.
- **No:** React Email. Agrega una dependencia y diseño que no aportan a un buzón interno.
- **Sí:** el remitente se configura por variable de entorno, con `onboarding@resend.dev` por defecto. Permite probar sin dominio y cambiarlo después sin tocar código.
- **Sí:** validación en el servidor además de la del cliente. El cliente se puede saltar.
- **Sí:** honeypot con respuesta de éxito falsa. Es anti-spam barato que no revela la trampa.
- **No:** rate limit ni CAPTCHA. Requieren infraestructura o servicios externos y van en su propia spec.
- **Sí:** errores genéricos al usuario y detalle solo en `console.error`. No filtra configuración interna.
- **Sí:** reusar `RevealObserver` de SPEC 02 en lugar de duplicar el IntersectionObserver.
- **Sí:** portar solo los bloques CSS de About. Gamepad y temas siguen fuera.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo dueño de la cuenta de Resend | `CONTACT_TO_EMAIL` debe ser ese correo en desarrollo. Documentarlo en el README. Para producción, verificar un dominio y cambiar `CONTACT_FROM_EMAIL`. |
| El build falla o el módulo lanza un error si falta `RESEND_API_KEY` | Instanciar `Resend` dentro de la acción, no a nivel de módulo, y validar las variables en tiempo de request. |
| `cacheComponents` o un prerender interfiere con la página que contiene el formulario | La página es estática y el formulario es un Client Component. Leer `server-actions.md` y `forms.md` antes de implementar y confirmar con `npm run build`. |
| Spam masivo sin rate limit agota la cuota de Resend | El honeypot mitiga los bots simples. El rate limit queda como spec futura. |
| Choque de nombres CSS (`.field`, `shake`, `.reveal`) | Hacer grep en `globals.css` antes de pegar y reutilizar lo existente. `.contact-form textarea` complementa a `.field input` sin pisarlo. |
| Inyección de cabeceras con `name` en el asunto | Resend recibe `subject` como campo JSON, no como cabecera cruda. Además, se eliminan los saltos de línea de `name` antes de usarlo en el asunto. |

---

## Lo que **no** entra en esta spec

- Correo de confirmación al usuario y plantillas HTML.
- Rate limiting, CAPTCHA y almacenamiento de mensajes.
- Gamepad y temas de `home-about/styles.css`.
- Tests automatizados.
- Migración de estilos a Tailwind.

Cada uno de estos, si llega, va en su propia spec.
