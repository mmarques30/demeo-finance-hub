import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Entrar · Aurora" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "client">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    navigate({ to: role === "admin" ? "/admin" : "/portal" });
  }

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
        Aurora
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo above card */}
        <div className="flex flex-col items-center mb-8">
          <span style={{ color: "var(--green)" }}>
            <LogoMark size={32} />
          </span>
          <div className="aurora-serif text-[28px] mt-3" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aurora
          </div>
          <div className="aurora-cap mt-1">Gestão financeira</div>
        </div>

        <div
          className="bg-white px-9 py-10"
          style={{ border: "1px solid var(--line)" }}
        >
          <div className="aurora-cap mb-2">Acesso à plataforma</div>
          <h1 className="aurora-serif text-[28px] mb-1">
            Entrar na <em className="italic" style={{ color: "var(--green)" }}>conta</em>
          </h1>
          <p className="text-[12px] mb-7" style={{ color: "var(--muted-foreground)" }}>
            Use as credenciais enviadas pela Claudia.
          </p>

          {/* Role tabs */}
          <div className="grid grid-cols-2 mb-6" style={{ border: "1px solid var(--line)" }}>
            {(["admin", "client"] as const).map((r) => (
              <button
                key={r}
                type="button"
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <div className="aurora-cap mb-2">E-mail</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white px-3.5 py-3 text-[13px] outline-none transition-colors"
                style={{ border: "1px solid var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <div className="aurora-cap">Senha</div>
                <a href="#" className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>
                  Esqueci a senha
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white px-3.5 py-3 text-[13px] outline-none transition-colors"
                style={{ border: "1px solid var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              />
            </label>

            {error && (
              <div
                className="text-[12px] px-3 py-2"
                style={{ background: "rgba(184,149,106,0.12)", color: "var(--tan)", border: "1px solid var(--tan)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full text-[10px] uppercase py-3.5 transition-colors disabled:opacity-60"
              style={{
                background: "var(--green)",
                color: "#fff",
                letterSpacing: "2.5px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--green2)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--green)")}
            >
              {loading ? "Entrando..." : "Entrar →"}
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
          © Aurora Gestão Financeira 2026
        </div>
      </div>
    </div>
  );
}
