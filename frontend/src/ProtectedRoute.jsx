import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user }) {
  // Prefer in-memory session from App; keep localStorage as fallback.
  const persistedUser = localStorage.getItem("user");
  const csrf = localStorage.getItem("csrf_token");

  if ((!user && !persistedUser) || !csrf) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
