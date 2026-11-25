import { createContext, useState,useEffect } from 'react'
import axios from 'axios';
const Context = createContext();

function ContextApi({children}) {
  const [name,setname] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/session", { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
          if (res.data.user?.name) setname(res.data.user.name);
        }
      })
      .catch(() => {
        setUser(null);
        setname("");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err.response?.data?.message || err.message);
    } finally {
      setUser(null);
      setname("");
    }
  };
    
  return(
  <Context.Provider value={{name,setname,user,setUser,authLoading,logout}} >
    {children}
  </Context.Provider>
  )
}

export {Context,ContextApi};
