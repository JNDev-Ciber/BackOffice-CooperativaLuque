import { useEffect, useMemo, useState } from "react";
import {
  fetchCellularPlans,
  rpcCreateCellularPlan,
  rpcUpdateCellularPlan,
  rpcDeleteCellularPlan,
} from "../services/cellularService";

// ── Fila ─────────────────────────────────────────────────
function PlanRow({ item, loading, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 120px",
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        gap: 10,
        alignItems: "center",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--accent-light)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <div style={{ fontWeight: 500, color: "var(--text-h)", fontSize: "0.875rem" }}>
        {item.name}
      </div>

      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-h)" }}>
        ${Number(item.price).toLocaleString("es-AR")}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onEdit}
          disabled={loading}
          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
        >
          Editar
        </button>

        <button
          onClick={onDelete}
          disabled={loading}
          className="btn-danger"
          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export default function CellularPlansPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");

  const editingItem = useMemo(
    () => plans.find((x) => x.id === editingId) ?? null,
    [plans, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setSubtitle("");
    setDescription("");
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      setPlans(await fetchCellularPlans());
    } catch (e) {
      setError(e?.message ?? "Error cargando planes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setSubtitle(item.subtitle ?? "");
    setDescription(item.description ?? "");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !price) {
      setError("Nombre y precio son obligatorios");
      return;
    }

    const payload = {
      p_name: name.trim(),
      p_price: parseFloat(price),
      p_subtitle: subtitle || null,
      p_description: description || null,
    };

    setLoading(true);
    try {
      if (!editingItem) {
        await rpcCreateCellularPlan(payload);
      } else {
        await rpcUpdateCellularPlan(editingItem.id, payload);
      }
      resetForm();
      await load();
    } catch (e2) {
      setError(e2?.message ?? "Error guardando plan");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await rpcDeleteCellularPlan(deleteTarget.id);
      await load();
    } catch (e) {
      setError(e?.message ?? "Error eliminando");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Planes Celulares</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>

        {/* ── FORM ── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            boxShadow: "var(--shadow-sm)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {editingItem ? "Editar plan" : "Nuevo plan"}
            </div>

            {editingItem && (
              <button onClick={resetForm} disabled={loading}>
                Cancelar
              </button>
            )}
          </div>

          <form style={{ display: "grid", gap: 12 }} onSubmit={onSubmit}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del plan"
            />

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio"
            />

            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtítulo"
            />

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción"
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : editingItem
                ? "Guardar cambios"
                : "Crear plan"}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                background: "var(--error-bg)",
                color: "#b91c1c",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ── TABLE ── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 120px",
              padding: "10px 14px",
              background: "var(--social-bg)",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>Nombre</div>
            <div>Precio</div>
            <div>Acciones</div>
          </div>

          {loading && plans.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)" }}>
              Cargando...
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)" }}>
              Sin planes todavía
            </div>
          )}

          {plans.map((it) => (
            <PlanRow
              key={it.id}
              item={it}
              loading={loading}
              onEdit={() => startEdit(it)}
              onDelete={() => setDeleteTarget(it)}
            />
          ))}
        </div>
      </div>

      {/* ── MODAL DELETE ── */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "24px 28px",
              width: "90%",
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              Confirmar eliminación
            </div>

            <div style={{ fontSize: "0.875rem", marginBottom: 20 }}>
              ¿Eliminar el plan "{deleteTarget.name}"?
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={loading}>
                Cancelar
              </button>

              <button
                onClick={confirmDelete}
                disabled={loading}
                className="btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}