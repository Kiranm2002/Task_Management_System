import { Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useRefreshMutation } from "./authApi";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "./authSlice";

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refresh] = useRefreshMutation();
  const token = useSelector(selectCurrentToken);
  
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === true || import.meta.env.MODE !== 'development') {
      
      const verifyRefreshToken = async () => {
        try {
          await refresh().unwrap();
        } catch (err) {
          console.error("Refresh failed", err);
        } finally {
          setIsLoading(false);
        }
      };

      if (!token) {
        verifyRefreshToken();
      } else {
        setIsLoading(false);
      }
    }

    return () => (effectRan.current = true); 
  }, [token, refresh]);

  return isLoading ? <p>Loading...</p> : <Outlet />;
};

export default PersistLogin;