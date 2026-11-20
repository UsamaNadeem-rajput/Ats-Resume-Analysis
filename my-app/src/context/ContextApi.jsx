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
        if (res.data.success) setUser(res.data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);
    
  
  return(
  <Context.Provider value={{name,setname,user,authLoading}} >
    {children}
  </Context.Provider>

  )

  
}

export {Context,ContextApi};
