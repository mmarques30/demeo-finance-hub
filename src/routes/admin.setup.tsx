// ⚠️ ROTA TEMPORÁRIA — DELETAR em PR seguinte assim que primeiro admin existir.
// Só funciona se NÃO houver nenhum admin no banco. Cria 1º admin (Claudia).

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/setup")({
  component: AdminSetupPage,
  head: () => ({ meta: [{ title: "Setup · Aurora" }] }),
});

type GateState = "checking" | "allowed" | "blocked";

function AdminSetupPage() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<GateState>("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gate: bloqueia se já houver qualquer admin
  useEffect(() => {
    async function check() {
      try {
        const { count, error: countErr } = await supabase()
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if (countErr) {
          // Se a tabela não existir ainda, permite (banco fresco)
          setGate("allowed");
          return;
        }
        setGate((count ?? 0) > 0 ? "blocked" : "allowed");
      } catch {
        setGate("allowed");
      }
    }
    check();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || password.length < 8) {
      setError("Preencha todos os campos (senha mín. 8 caracteres)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = supabase();
      const { data, error: signUpErr } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpErr) throw signUpErr;
      const userId = data.user?.id;
      if (!userId) throw new Error("Usuário não criado (talvez confirmação de e-mail esteja ativa)");

      // Promove a admin
      const { error: updErr } = await sb
        .from("profiles")
        .update({ role: "admin", full_name: name })
        .eq("user_id", userId);
      if (updErr) throw updErr;

      toast.success("Admin criado. Faça login para continuar.");
      navigate({ to: "/login" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao criar admin";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (gate === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--linen)" }}>
        <div className="aurora-cap">Verificando…</div>
      </div>
    );
  }

  if (gate === "blocked") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "var(--linen)" }}
      >
        <div className="aurora-card max-w-[440px] w-full text-center p-10">
          <div className="aurora-cap mb-2" style={{ color: "var(--tan)" }}>
            404
          </div>
          <h1 className="aurora-serif text-[28px]">
            <em className="italic" style={{ color: "var(--green)" }}>Setup já realizado.</em>
          </h1>
          <p className="text-[13px] mt-4" style={{ color: "var(--muted-foreground)" }}>
            Esta rota está bloqueada porque já existe pelo menos um admin no sistema.
          </p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-[10px] uppercase"
            style={{
              background: "var(--green)",
              color: "#fff",
              letterSpacing: "2.5px",
              fontWeight: 500,
              borderRadius: 12,
            }}
          >
            Ir para o login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--linen)" }}
    >
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-7">
          <span style={{ color: "var(--green)" }}>
            <LogoMark size={32} />
          </span>
          <div className="aurora-serif text-[28px] mt-3" style={{ fontWeight: 500 }}>
            Aurora
          </div>
          <div className="aurora-cap mt-1">Setup inicial</div>
        </div>

        <div className="bg-white p-9" style={{ border: "1px solid var(--line)", borderRadius: 18 }}>
          <div className="aurora-cap mb-2" style={{ color: "var(--green)" }}>
            ⚠ Rota temporária
          </div>
          <h1 className="aurora-serif text-[26px] mb-2">
            Crie o <em className="italic" style={{ color: "var(--green)" }}>primeiro admin</em>.
          </h1>
          <p className="text-[12px] mb-7" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            Esta página só funciona uma vez. Após criar o admin, a rota fica bloqueada e deve ser
            removida em PR seguinte.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="block">
              <div className="aurora-cap mb-2">Nome completo</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="aurora-input"
                placeholder="Claudia Lima"
                required
              />
            </label>
            <label className="block">
              <div className="aurora-cap mb-2">E-mail</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="aurora-input"
                placeholder="claudia@aurora.com.br"
                required
              />
            </label>
            <label className="block">
              <div className="aurora-cap mb-2">Senha (mín. 8 caracteres)</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="aurora-input"
                minLength={8}
                required
              />
            </label>

            {error && (
              <div className="text-[11px]" style={{ color: "var(--destructive)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full text-[10px] uppercase py-3.5 disabled:opacity-60"
              style={{
                background: "var(--green)",
                color: "#fff",
                letterSpacing: "2.5px",
                fontWeight: 500,
                borderRadius: 12,
              }}
            >
              {loading ? "Criando…" : "Criar admin Aurora →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
