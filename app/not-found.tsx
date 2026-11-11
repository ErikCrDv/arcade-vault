import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 · Arcade Vault",
};

export default function NotFound() {
  return (
    <section
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 20,
        padding: "96px 24px",
      }}
    >
      <h1
        className="pixel neon-magenta flicker"
        style={{ fontSize: "clamp(22px, 5vw, 44px)", lineHeight: 1.4 }}
      >
        GAME OVER · 404
      </h1>
      <p style={{ color: "var(--ink-dim)", maxWidth: 440, margin: 0 }}>
        Esta página no existe en el Vault. Puede que el juego haya cambiado de
        sitio o que el enlace tenga un error.
      </p>
      <div
        className="pixel"
        style={{ fontSize: 10, color: "var(--yellow)", letterSpacing: "0.2em" }}
      >
        CONTINUAR?{" "}
        <span style={{ animation: "blink 1.2s steps(1, end) infinite" }}>_</span>
      </div>
      <Link href="/" className="btn magenta xl">
        VOLVER AL VAULT
      </Link>
    </section>
  );
}
