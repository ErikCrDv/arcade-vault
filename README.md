## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

- `npm run dev` — dev server (Turbopack) at http://localhost:3000
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`); run on specific files with `npx eslint <path>`
- No test runner is configured.

## Variables de entorno

Crea un archivo `.env.local` en la raíz (ya está ignorado por `.gitignore`). Todas son solo de servidor; nunca uses el prefijo `NEXT_PUBLIC_`.

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para enviar el formulario de contacto de `/acerca` | — (requerida) |
| `CONTACT_TO_EMAIL` | Buzón del equipo que recibe los mensajes | — (requerida) |
| `CONTACT_FROM_EMAIL` | Remitente de los correos | `Arcade Vault <onboarding@resend.dev>` |

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO_EMAIL=equipo@ejemplo.com
# CONTACT_FROM_EMAIL="Arcade Vault <contacto@tu-dominio.com>"
```

> **Nota:** el remitente por defecto `onboarding@resend.dev` solo entrega al correo dueño de la cuenta de Resend. En desarrollo, `CONTACT_TO_EMAIL` debe ser ese correo. Para producción, verifica un dominio en Resend y cambia `CONTACT_FROM_EMAIL`.
