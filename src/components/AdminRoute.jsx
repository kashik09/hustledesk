import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AdminRoute = ({
  isAuthenticated,
  isAdmin,
  redirectTo = "/login",
  forbiddenTo = "/forbidden",
}) => {
  const location = useLocation();

  // Not logged in → send to login, preserving the attempted URL
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Logged in but not an admin → send to forbidden page
  if (!isAdmin) {
    return <Navigate to={forbiddenTo} replace />;
  }

  // Authenticated admin → render nested routes
  return <Outlet />;
};

export default AdminRoute;