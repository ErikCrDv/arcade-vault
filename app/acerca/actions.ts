"use server";

import { Resend } from "resend";

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | {
      status: "error";
      message: string;
      fields: { name: string; email: string; msg: string };
    };

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_ERROR =
  "[ERR] NO SE PUDO TRANSMITIR. INTÉNTALO DE NUEVO MÁS TARDE.";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContact(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  void prev;

  // Honeypot: a los bots se les responde éxito sin enviar nada.
  const website = field(formData, "website");
  if (website) {
    return { status: "success", name: field(formData, "name") };
  }

  const name = field(formData, "name");
  const email = field(formData, "email");
  const msg = field(formData, "msg");
  const fields = { name, email, msg };

  const invalid = (detail: string): ContactState => ({
    status: "error",
    message: `[ERR] REVISA LOS CAMPOS: ${detail}`,
    fields,
  });

  if (!name) return invalid("NOMBRE REQUERIDO");
  if (name.length > 60) return invalid("NOMBRE DEMASIADO LARGO (MÁX 60)");
  if (!email) return invalid("CORREO REQUERIDO");
  if (email.length > 254) return invalid("CORREO DEMASIADO LARGO (MÁX 254)");
  if (!EMAIL_RE.test(email)) return invalid("CORREO INVÁLIDO");
  if (!msg) return invalid("MENSAJE REQUERIDO");
  if (msg.length > 2000) return invalid("MENSAJE DEMASIADO LARGO (MÁX 2000)");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey || !to) {
    console.error(
      "[contacto] Falta configuración:",
      [!apiKey && "RESEND_API_KEY", !to && "CONTACT_TO_EMAIL"]
        .filter(Boolean)
        .join(", "),
    );
    return { status: "error", message: GENERIC_ERROR, fields };
  }

  // Sin saltos de línea en el asunto (evita inyección de cabeceras).
  const safeName = name.replace(/[\r\n]+/g, " ");

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${safeName}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });

    if (error) {
      console.error("[contacto] Resend devolvió un error:", error);
      return { status: "error", message: GENERIC_ERROR, fields };
    }
  } catch (err) {
    console.error("[contacto] Fallo al llamar a Resend:", err);
    return { status: "error", message: GENERIC_ERROR, fields };
  }

  return { status: "success", name };
}
