import { JSX } from "react";
import { Navigate } from "react-router";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const authUser = localStorage.getItem("authUser");

  if (!authUser) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
