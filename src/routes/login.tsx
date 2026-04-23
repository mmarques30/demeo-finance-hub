import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Entrar · De Meo" }],
  }),
});

function LoginPage() {
  const [role, setRole] = useState<"admin" | "client">("admin");
  const [email, setEmail] = useState("claudia@demeo.com.br");
  const [password, setPassword] = useState("••••••••");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "var(--linen)" }}
    >
      {/* Watermark */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          right: "-40px",
          bottom: "-80px",
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(220px, 32vw, 380px)",
          letterSpacing: "-12px",
          color: "transparent",
          WebkitTextStroke: "1px rgba(74,103,65,0.08)",
          lineHeight: 1,
        }}
      >
        De Meo
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo above card */}
        <div className="flex flex-col items-center mb-8">
          <span style={{ color: "var(--green)" }}>
            <LogoMark size={32} />
          </span>
          <div className="dm-serif text-[28px] mt-3" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            De Meo
          </div>
          <div className="dm-cap mt-1">Gestora Financeira</div>
        </div>

        <div
          className="bg-white px-9 py-10"
          style={{ border: "1px solid var(--line)" }}
        >
          <div className="dm-cap mb-2">Acesso à plataforma</div>
          <h1 className="dm-serif text-[28px] mb-1">
            Entrar na <em className="italic" style={{ color: "var(--green)" }}>conta</em>
          </h1>
          <p className="text-[12px] mb-7" style={{ color: "var(--muted-foreground)" }}>
            Use as credenciais enviadas pela Claudia.
          </p>

          {/* Role tabs (mock) */}
          <div className="grid grid-cols-2 mb-6" style={{ border: "1px solid var(--line)" }}>
            {(["admin", "client"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="text-[10px] uppercase py-2.5 transition-colors"
                style={{
                  letterSpacing: "2px",
                  background: role === r ? "var(--green)" : "transparent",
                  color: role === r ? "#fff" : "var(--muted-foreground)",
                  fontWeight: 500,
                }}
              >
                {r === "admin" ? "Gestora (Claudia)" : "Cliente"}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = role === "admin" ? "/admin" : "/portal";
            }}
            className="flex flex-col gap-4"
          >
            <label className="block">
              <div className="dm-cap mb-2">E-mail</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white px-3.5 py-3 text-[13px] outline-none transition-colors"
                style={{ border: "1px solid var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <div className="dm-cap">Senha</div>
                <a href="#" className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>
                  Esqueci a senha
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white px-3.5 py-3 text-[13px] outline-none transition-colors"
                style={{ border: "1px solid var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              />
            </label>

            <button
              type="submit"
              className="mt-2 w-full text-[10px] uppercase py-3.5 transition-colors"
              style={{
                background: "var(--green)",
                color: "#fff",
                letterSpacing: "2.5px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--green2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--green)")}
            >
              Entrar →
            </button>
          </form>

          <div className="mt-7 pt-5 text-[11px] text-center" style={{ borderTop: "1px solid var(--line)", color: "var(--muted-foreground)" }}>
            Acesso solicitado por convite.{" "}
            <Link to="/" className="underline" style={{ color: "var(--green)" }}>
              Voltar ao site
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
          De Meo · Gestora Financeira · 2026
        </div>
      </div>
    </div>
  );
}
