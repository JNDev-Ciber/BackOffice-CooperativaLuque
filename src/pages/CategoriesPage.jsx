import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export default function CategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const editingItem = useMemo(
    () => items.find((x) => x.id === editingId) ?? null,
    [items, editingId]
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (err) throw err;
      setItems(data ?? []);
    } catch (e) {
      setError(e?.message ?? "Error cargando categorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const { error: err } = await supabase.rpc("create_category", { p_name: name });
      if (err) throw err;
      setNewName("");
      await load();
    } catch (e) {
      setError(e?.message ?? "Error creando categoría");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingName(item.name ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function onUpdate(e) {
    e.preventDefault();
    if (!editingItem) return;

    setError(null);
    const name = editingName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const { error: err } = await supabase.rpc("update_category", {
        p_category_id: editingItem.id,
        p_name: name,
      });
      if (err) throw err;
      cancelEdit();
      await load();
    } catch (e) {
      setError(e?.message ?? "Error actualizando categoría");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(item) {
    const ok = window.confirm(`Eliminar categoría "${item.name}"?`);
    if (!ok) return;

    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.rpc("delete_category", {
        p_category_id: item.id,
      });
      if (err) throw err;
      await load();
    } catch (e) {
      setError(e?.message ?? "Error eliminando categoría");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Categorías</h2>
      </div>

      <form onSubmit={onCreate} style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 14 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoría"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid transparent", background: "var(--accent)", color: "white", cursor: "pointer" }}
        >
          Crear
        </button>
      </form>

      {error ? (
        <div style={{ border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.08)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 0, background: "var(--social-bg)", padding: 10, fontWeight: 600 }}>
          <div>Nombre</div>
          <div>Acciones</div>
        </div>

        {loading && items.length === 0 ? <div style={{ padding: 12 }}>Cargando...</div> : null}
        {!loading && items.length === 0 ? <div style={{ padding: 12 }}>Sin categorías</div> : null}

        {items.map((it) => {
          const isEditing = editingId === it.id;
          return (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 0, padding: 10, borderTop: "1px solid var(--border)", alignItems: "center" }}>
              <div>
                {isEditing ? (
                  <form onSubmit={onUpdate} style={{ display: "flex", gap: 10 }}>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid transparent", background: "var(--accent)", color: "white", cursor: "pointer" }}
                    >
                      Guardar
                    </button>
                  </form>
                ) : (
                  it.name
                )}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-start" }}>
                {isEditing ? (
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "inherit" }}
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(it)}
                    disabled={loading}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "inherit" }}
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => onDelete(it)}
                  disabled={loading}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.08)", cursor: "pointer", color: "inherit" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
