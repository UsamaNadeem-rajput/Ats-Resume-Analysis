import axios from "axios"
import { useContext} from "react"
import { Navigate, Outlet } from "react-router-dom";
import { Context } from "../context/ContextApi";

export default function Protection() {
    const { user, authLoading } = useContext(Context)
   if (authLoading) return null; 
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
