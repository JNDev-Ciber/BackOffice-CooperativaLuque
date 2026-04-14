import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../lib/auth";

function SidebarLink({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "block",
        padding: "9px 12px",
        borderRadius: "var(--radius-sm)",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--accent)" : "var(--sidebar-text)",
        background: isActive ? "var(--sidebar-active)" : "transparent",
        border: isActive ? "1px solid var(--accent-mid)" : "1px solid transparent",
        boxShadow: isActive ? "var(--shadow-sm)" : "none",
        transition: "all 0.12s",
      })}
      end
    >
      {children}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ minHeight: "100svh", display: "grid", gridTemplateColumns: "230px 1fr" }}>
      <aside style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 12px rgba(1, 100, 75, 0.07)",
      }}>

        {/* Logo */}
        <div style={{
          padding: "22px 18px 18px",
          borderBottom: "1px solid var(--sidebar-border)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--sidebar-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            Cooperativa de Luque
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--sidebar-muted)", marginTop: 2 }}>
            Backoffice
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <SidebarLink to="/dashboard/categories">Categorías</SidebarLink>
          <SidebarLink to="/dashboard/news">Noticias</SidebarLink>
          <SidebarLink to="/dashboard/internet">Planes de Internet</SidebarLink>
          <SidebarLink to="/dashboard/electricidad">Planes de Electricidad</SidebarLink>
        </nav>

        {/* Footer usuario + logout */}
        <div style={{
          padding: "12px 10px 18px",
          borderTop: "1px solid var(--sidebar-border)",
          display: "grid",
          gap: 8,
        }}>
          <div style={{ padding: "0 4px", fontSize: "0.78rem", color: "var(--sidebar-muted)" }}>
            Sesión iniciada como
          </div>
          <div style={{ padding: "0 4px", fontSize: "0.85rem", fontWeight: 600, color: "var(--sidebar-text)" }}>
            {user?.username ?? "-"}
          </div>
          <button
            onClick={onLogout}
            style={{ width: "100%", marginTop: 4 }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ padding: 24, background: "var(--bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}