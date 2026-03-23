import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser } from "../lib/auth";

export default function ProtectedRoute() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
