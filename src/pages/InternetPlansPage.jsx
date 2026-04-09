import { useEffect, useMemo, useState } from "react";
import {
  fetchPlans,
  rpcCreatePlan,
  rpcUpdatePlan,
  rpcDeletePlan,
} from "../services/internetService";

const TV_OPTIONS = [
  { value: "", label: "Sin TV" },
  { value: "TV_FULL", label: "TV Full" },
  { value: "TV_PREMIUM", label: "TV Premium" },
];

const FEATURES = ["Fibra óptica", "Velocidad garantizada", "Soporte 24/7"];

// ── Fila ─────────────────────────────────────────────────
function PlanRow({ item, loading, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 90px 70px 110px 100px 140px",
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        gap: 10,
        alignItems: "center",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-light)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <div style={{ fontWeight: 500, color: "var(--text-h)", fontSize: "0.875rem" }}>
        {item.name}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        {item.speed_mbps} Mbps
      </div>
      <div style={{ fontSize: "0.8rem" }}>
        {item.has_sms ? (
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>✓</span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        {item.tv_type === "TV_FULL"
          ? "TV Full"
          : item.tv_type === "TV_PREMIUM"
          ? "TV Premium"
          : "Sin TV"}
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
export default function InternetPlansPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [name, setName] = useState("");
  const [speedMbps, setSpeedMbps] = useState("");
  const [hasSms, setHasSms] = useState(false);
  const [tvType, setTvType] = useState("");
  const [price, setPrice] = useState("");

  const editingItem = useMemo(
    () => plans.find((x) => x.id === editingId) ?? null,
    [plans, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setName("");
    setSpeedMbps("");
    setHasSms(false);
    setTvType("");
    setPrice("");
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      setPlans(await fetchPlans());
    } catch (e) {
      setError(e?.message ?? "Error cargando planes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setName(item.name);
    setSpeedMbps(String(item.speed_mbps));
    setHasSms(item.has_sms);
    setTvType(item.tv_type ?? "");
    setPrice(String(item.price));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !speedMbps || !price) {
      setError("Nombre, velocidad y precio son obligatorios");
      return;
    }

    const payload = {
      p_name:       name.trim(),
      p_speed_mbps: parseInt(speedMbps),
      p_has_sms:    hasSms,
      p_tv_type:    tvType || null,
      p_price:      parseFloat(price),
    };

    setLoading(true);
    try {
      if (!editingItem) {
        await rpcCreatePlan(payload);
      } else {
        await rpcUpdatePlan(editingItem.id, payload);
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
      await rpcDeletePlan(deleteTarget.id);
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
        <h2 style={{ margin: 0 }}>Planes de Internet</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>

        {/* ── Formulario ── */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          boxShadow: "var(--shadow-sm)",
          alignSelf: "start",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-h)" }}>
              {editingItem ? "Editar plan" : "Nuevo plan"}
            </div>
            {editingItem && (
              <button type="button" onClick={resetForm} disabled={loading}>Cancelar</button>
            )}
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Nombre del plan
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Plan Hogar 100"
              />
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Velocidad (Mbps)
              </span>
              <input
                type="number"
                min="1"
                value={speedMbps}
                onChange={(e) => setSpeedMbps(e.target.value)}
                placeholder="100"
              />
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>TV</span>
              <select value={tvType} onChange={(e) => setTvType(e.target.value)}>
                {TV_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasSms}
                onChange={(e) => setHasSms(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: "0.875rem", color: "var(--text-h)" }}>Incluye SENSA</span>
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Precio ($)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </label>

            {/* Características fijas */}
            <div style={{
              background: "var(--accent-light)",
              border: "1px solid var(--accent-mid)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              display: "grid",
              gap: 6,
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                Siempre incluido
              </div>
              {FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--accent-hover)" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingItem ? "Guardar cambios" : "Crear plan"}
            </button>
          </form>

          {error && (
            <div style={{
              border: "1px solid var(--error-border)",
              background: "var(--error-bg)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              marginTop: 12,
              color: "#b91c1c",
              fontSize: "0.85rem",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Tabla ── */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
          alignSelf: "start",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 70px 110px 100px 140px",
            padding: "10px 14px",
            background: "var(--social-bg)",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            gap: 10,
            borderBottom: "1px solid var(--border)",
          }}>
            <div>Nombre</div>
            <div>Velocidad</div>
            <div>SENSA</div>
            <div>TV</div>
            <div>Precio</div>
            <div>Acciones</div>
          </div>

          {loading && plans.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)", fontSize: "0.875rem" }}>Cargando...</div>
          )}
          {!loading && plans.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)", fontSize: "0.875rem" }}>Sin planes todavía</div>
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

      {/* ── Modal confirmación ── */}
      {deleteTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "24px 28px", maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-h)", marginBottom: 8 }}>
              Confirmar eliminación
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 20 }}>
              ¿Eliminar el plan &ldquo;{deleteTarget.name}&rdquo;? Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={loading} style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={loading} className="btn-danger" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}