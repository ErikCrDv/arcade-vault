"use client";

import { useActionState, useEffect, useState } from "react";
import { sendContact, type ContactState } from "@/app/acerca/actions";

const INITIAL_STATE: ContactState = { status: "idle" };

// El `key` remonta el formulario interno: "ENVIAR OTRO MENSAJE" lo deja
// vacío y de vuelta en el estado `idle`.
export function ContactForm() {
  const [instance, setInstance] = useState(0);
  return (
    <ContactFormInner
      key={instance}
      onReset={() => setInstance((n) => n + 1)}
    />
  );
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(
    sendContact,
    INITIAL_STATE,
  );

  // Se siembra con los valores devueltos por el servidor, así se conservan
  // incluso si la página se renderiza de nuevo sin JS.
  const [form, setForm] = useState(
    state.status === "error" ? state.fields : { name: "", email: "", msg: "" },
  );
  const [shake, setShake] = useState(false);
  const [seenState, setSeenState] = useState(state);

  // Un nuevo error del servidor dispara el shake (ajuste de estado en render).
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "error") setShake(true);
  }

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(t);
  }, [shake]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      setShake(true);
    }
  };

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
      onSubmit={onSubmit}
    >
      {state.status !== "success" ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>

          {/* Honeypot: invisible para personas, los bots lo rellenan */}
          <input
            className="hp-field"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {state.status === "error" && (
            <div className="term-error" role="alert">
              {state.message}
            </div>
          )}

          <button
            className="btn xl press"
            type="submit"
            style={{ width: "100%" }}
            disabled={isPending}
          >
            {isPending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message
              --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
              {state.name.toUpperCase()}.<span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
