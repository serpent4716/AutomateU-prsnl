import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check if user + csrf token exists in localStorage
  const user = localStorage.getItem("user");
  const csrf = localStorage.getItem("csrf_token");

  if (!user || !csrf) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  // Logged in → allow access
  return children;
}
