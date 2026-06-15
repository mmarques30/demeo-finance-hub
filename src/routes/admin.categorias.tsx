import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriasPage,
  head: () => ({ meta: [{ title: "Categorias · Aurora" }] }),
});

interface ClientOption {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  group_name: string;
  type: string;
  is_active: boolean;
  sort_order: number;
}

const TIPOS = [
  { value: "receita", label: "+ Receita" },
  { value: "despesa", label: "− Despesa" },
  { value: "transferencia", label: "⇄ Transferência" },
];

const GRUPOS = [
  "Receita",
  "Despesa Fixa",
  "Despesa Variável",
  "Investimento",
  "Outros",
];

function CategoriasPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Nova categoria
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("Outros");
  const [newType, setNewType] = useState("despesa");

  useEffect(() => {
    supabase
      .from("clients")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setClients(data);
          setClientId(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!clientId) return;
    loadCategories();
  }, [clientId]);

  async function loadCategories() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("categories")
      .select("id, name, group_name, type, is_active, sort_order")
      .eq("client_id", clientId)
      .order("sort_order");
    if (err) setError(err.message);
    else setCategories(data ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: err } = await supabase.from("categories").insert({
      client_id: clientId,
      name: newName.trim(),
      group_name: newGroup,
      type: newType,
      is_active: true,
      sort_order: categories.length + 1,
    });

    if (err) {
      setError(err.message.includes("unique") ? "Essa categoria já existe para este cliente." : err.message);
    } else {
      setSuccess(`"${newName.trim()}" adicionada.`);
      setNewName("");
      await loadCategories();
    }
    setSaving(false);
  }

  async function toggleActive(cat: Category) {
    const { error: err } = await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    if (err) setError(err.message);
    else setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    );
  }

  async function deleteCategory(cat: Category) {
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", cat.id);
    if (err) setError(err.message);
    else setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.group_name] ||= []).push(c);
    return acc;
  }, {});

  const typeColor = (type: string) =>
    type === "receita" ? "var(--green)" : type === "despesa" ? "var(--navy)" : "var(--muted-foreground)";

  const typeLabel = (type: string) =>
    TIPOS.find((t) => t.value === type)?.label ?? type;

  return (
    <AdminLayout>
      <PageHeader
        cap="Motor de classificação · M02"
        title="Categorias"
        emphasis="por cliente"
        description="Gerencie as categorias financeiras de cada cliente. Novas categorias ficam disponíveis imediatamente na classificação automática."
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-6">

        {/* Seletor de cliente */}
        <div className="aurora-card">
          <div className="aurora-cap mb-2">Cliente</div>
          <select
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setError(null); setSuccess(null); }}
            className="w-full max-w-xs bg-white px-3 py-2.5 text-[13px]"
            style={{ border: "1px solid var(--line)" }}
          >
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Feedback */}
        {error && (
          <div className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)" }}>
            <span style={{ color: "var(--tan)", fontSize: 18 }}>!</span>
            <div className="text-[13px]">{error}</div>
          </div>
        )}
        {success && (
          <div className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(74,103,65,0.08)", borderLeft: "3px solid var(--green)" }}>
            <span style={{ color: "var(--green)", fontSize: 16 }}>✓</span>
            <div className="text-[13px]">{success}</div>
          </div>
        )}

        {/* Formulário nova categoria */}
        <div className="aurora-card">
          <div className="aurora-cap mb-4">Adicionar categoria</div>
          <form onSubmit={handleAdd} className="grid lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da categoria"
              required
              className="lg:col-span-1 bg-white px-3 py-2.5 text-[13px] outline-none"
              style={{ border: "1px solid var(--line)" }}
            />
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              className="bg-white px-3 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)" }}
            >
              {GRUPOS.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="bg-white px-3 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)" }}
            >
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button
              type="submit"
              disabled={saving || !newName.trim()}
              className="text-[10px] uppercase px-4 py-2.5 transition-opacity disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
            >
              {saving ? "Salvando..." : "+ Adicionar"}
            </button>
          </form>
        </div>

        {/* Lista de categorias agrupadas */}
        {loading ? (
          <div className="aurora-card flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <div className="text-[13px]">Carregando categorias...</div>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="aurora-card p-0 overflow-hidden">
              <div className="px-6 py-3 aurora-cap"
                style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
                {group} · {items.length}
              </div>
              <table className="w-full">
                <tbody>
                  {items.map((cat, i) => (
                    <tr key={cat.id}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                        borderTop: i > 0 ? "1px solid var(--line)" : "none",
                        opacity: cat.is_active ? 1 : 0.45,
                      }}>
                      <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 500 }}>
                        {cat.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] aurora-cap px-2 py-0.5"
                          style={{ color: typeColor(cat.type), border: `1px solid ${typeColor(cat.type)}`, opacity: 0.8 }}>
                          {typeLabel(cat.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleActive(cat)}
                          className="text-[10px] uppercase mr-4 transition-opacity"
                          style={{ letterSpacing: "1.5px", color: cat.is_active ? "var(--tan)" : "var(--green)" }}
                        >
                          {cat.is_active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="text-[10px] uppercase transition-opacity"
                          style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
