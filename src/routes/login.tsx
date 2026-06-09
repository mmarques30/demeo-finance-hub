import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Entrar · Aurora" }],
  }),
});

type Mode = "signin" | "reset";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = supabase();
      const { data, error: authError } = await sb.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!data.user) throw new Error("Falha ao autenticar");

      // Busca profile pra decidir destino
      const { data: profile } = await sb
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      toast.success("Bem-vinda(o) de volta.");
      navigate({ to: profile?.role === "admin" ? "/admin" : "/portal" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao entrar";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onResetRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Informe seu e-mail");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = supabase();
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
      const { error: resetError } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setResetSent(true);
      toast.success("Enviamos um link de recuperação para seu e-mail.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao solicitar recuperação";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "var(--linen)" }}
    >
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
        <div className="flex flex-col items-center mb-8">
          <span style={{ color: "var(--green)" }}>
            <LogoMark size={32} />
          </span>
          <div className="aurora-serif text-[28px] mt-3" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aurora
          </div>
          <div className="aurora-cap mt-1">Gestão financeira</div>
        </div>

        <div className="bg-white px-9 py-10" style={{ border: "1px solid var(--line)", borderRadius: 18 }}>
          <div className="aurora-cap mb-2">{mode === "signin" ? "Acesso à plataforma" : "Recuperar senha"}</div>
          <h1 className="aurora-serif text-[28px] mb-1">
            {mode === "signin" ? (
              <>
                Entrar na <em className="italic" style={{ color: "var(--green)" }}>conta</em>
              </>
            ) : (
              <>
                <em className="italic" style={{ color: "var(--green)" }}>Esqueceu</em> a senha?
              </>
            )}
          </h1>
          <p className="text-[12px] mb-7" style={{ color: "var(--muted-foreground)" }}>
            {mode === "signin"
              ? "Use as credenciais criadas com a Claudia."
              : "Informe seu e-mail que enviamos o link."}
          </p>

          {resetSent ? (
            <div className="text-center py-6">
              <div className="aurora-cap mb-2" style={{ color: "var(--green)" }}>
                ✓ Enviado
              </div>
              <p className="text-[13px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.8 }}>
                Se houver conta com esse e-mail, você receberá o link em alguns instantes.
              </p>
              <button
                onClick={() => {
                  setMode("signin");
                  setResetSent(false);
                }}
                className="aurora-link mt-5"
              >
                ← Voltar ao login
              </button>
            </div>
          ) : (
            <form
              onSubmit={mode === "signin" ? onSignIn : onResetRequest}
              className="flex flex-col gap-4"
              noValidate
            >
              <label className="block">
                <div className="aurora-cap mb-2">E-mail</div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="aurora-input"
                  placeholder="você@empresa.com.br"
                  required
                />
              </label>

              {mode === "signin" && (
                <label className="block">
                  <div className="flex items-center justify-between mb-2">
                    <div className="aurora-cap">Senha</div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("reset");
                        setError(null);
                      }}
                      className="text-[10px] uppercase"
                      style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="aurora-input"
                    required
                  />
                </label>
              )}

              {error && (
                <div className="text-[11px]" style={{ color: "var(--destructive)" }}>
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
                  borderRadius: 12,
                }}
              >
                {loading
                  ? "Aguarde…"
                  : mode === "signin"
                  ? "Entrar →"
                  : "Enviar link →"}
              </button>

              {mode === "reset" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="aurora-link mt-1"
                >
                  ← Voltar ao login
                </button>
              )}
            </form>
          )}

          <div
            className="mt-7 pt-5 text-[11px] text-center"
            style={{ borderTop: "1px solid var(--line)", color: "var(--muted-foreground)" }}
          >
            Acesso solicitado por convite.{" "}
            <Link to="/" className="underline" style={{ color: "var(--green)" }}>
              Voltar ao site
            </Link>
          </div>
        </div>

        <div
          className="mt-6 text-center text-[9px] uppercase"
          style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}
        >
          © Aurora Gestão Financeira 2026
        </div>
      </div>
    </div>
  );
}
