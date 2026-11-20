import { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios"
import { Context } from "../context/ContextApi";


const Login= ()=>{
    const [data,setdata]=useState({
        email:"",
        password:""
    })
    const [error,seterror]=useState("");
    const navigate = useNavigate();
    const {setname} = useContext(Context);

    const handlesubmit= async(e)=>{
    e.preventDefault();
    try {
      const res= await axios.post("http://localhost:5000/api/auth/login",data,{
        withCredentials:true
      })
      if(res.data.success){
        console.log("created")
        seterror("")
        setname(res.data?.user?.name)
        navigate('/dashboard')
         
      }

    } catch (error) {
      seterror(error.response.data.message)
      console.log(error.response.data.message);
    }

  }
  const handleGoogleSuccess= async(credentialResponse)=>{
    const idToken = credentialResponse.credential;

    try {
      const res= await axios.post("http://localhost:5000/api/auth/google",{idToken},
        { withCredentials: true }
      );
      if(res.data?.success){
        seterror("")
        setname(res.data?.user?.name)
        navigate('/dashboard')
      }
      
    } catch (error) {
      seterror(error.response?.data?.message)
      console.log(error.response?.data?.message);
    }

  }

  const handleGoogleError = () => {
  console.log('Google login cancel ya fail hua');
};



    return(
        <div>
            <div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <p>{error}</p>
        
        <form onSubmit={handlesubmit}>

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required onChange={(e)=>setdata({...data,email:e.target.value})}/>

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required onChange={(e)=>setdata({...data,password:e.target.value})} />


          <button type="submit">Login</button>

        </form>

        </div>
    )

}

export default Login;
