import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/** Redirects an already-authenticated user away from /login and /signup. */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
