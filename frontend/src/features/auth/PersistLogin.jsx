import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useRefreshMutation } from "./authApi";
import { useSelector,useDispatch } from "react-redux";
import { selectCurrentToken,setCredentials } from "./authSlice";

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refresh] = useRefreshMutation();
  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();

  useEffect(() => {
    const verifyRefreshToken = async () => {
      try {
        await refresh().unwrap();
      } catch (err) {
        console.error("Refresh failed",err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!token) {
      verifyRefreshToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  return isLoading ? <p>Loading...</p> : <Outlet />;
};

export default PersistLogin;