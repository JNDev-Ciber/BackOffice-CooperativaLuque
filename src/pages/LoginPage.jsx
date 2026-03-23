import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithUsernamePassword, getStoredUser } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const existing = getStoredUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existing) {
      navigate("/dashboard/categories", { replace: true });
    }
  }, [existing, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithUsernamePassword(username.trim(), password);
      navigate("/dashboard/categories", { replace: true });
    } catch (err) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 420, maxWidth: "100%", border: "1px solid var(--border)", borderRadius: 12, padding: 20, background: "var(--bg)" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 6px" }}>Cooperativa de Luque</h1>
        <p style={{ marginBottom: 16 }}>Backoffice</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
            <span>Usuario</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
            <span>Contraseña</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
            />
          </label>

          {error ? (
            <div style={{ border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: 10, textAlign: "left" }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid transparent", background: "var(--accent)", color: "white", cursor: "pointer" }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
