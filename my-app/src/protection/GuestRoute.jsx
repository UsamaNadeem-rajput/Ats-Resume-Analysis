import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Context } from "../context/ContextApi";

export default function GuestRoute({ children }) {
  const { user, authLoading } = useContext(Context);

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return children ? children : <Outlet />;
}
