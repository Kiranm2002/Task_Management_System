import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";

const PrivateRoute = ({ allowedRoles }) => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  const hasAccess = user && allowedRoles?.includes(user.role);

  if (hasAccess) {
    return <Outlet />;
  }

  if (user) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;

};

export default PrivateRoute;