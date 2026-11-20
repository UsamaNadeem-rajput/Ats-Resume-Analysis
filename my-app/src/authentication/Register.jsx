import axios from "axios";
import { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";


export default function Register() {
  const [data, setdata] = useState({
    name:"",
    email:"",
    password:""
  })
  const [thepassword,setthepassword] = useState("");
  const [error,seterror]=useState("");
  const navigate = useNavigate();
  const handlesubmit= async(e)=>{
    e.preventDefault();
    try {
      const res= await axios.post("http://localhost:5000/api/auth/register",data,{
        withCredentials:true
      })
      if(res.data.success){
        console.log("created")
        seterror("")
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
        console.log(res.data?.message)
        seterror("")
        navigate('/dashboard')
      }
      
    } catch (error) {
      console.error(error.response?.data?.message);
    }

  }

  const handleGoogleError = () => {
  console.log('Google login cancel ya fail hua');
};

  const handlepassword=(value)=>{
    const currentvalue = value
    if(thepassword===currentvalue){
      setdata({...data,password:thepassword})
      seterror("")
    }
    else{
      seterror("password is not matched")
    }

  }
  return (
    <div>

        <div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <p>{error}</p>
        
        <form onSubmit={handlesubmit}>
          <label htmlFor="fullname">Full Name</label>
          <input type="text" id="fullname" name="name" onChange={(e)=>setdata({...data,name:e.target.value})}/>

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required onChange={(e)=>setdata({...data,email:e.target.value})}/>

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required onChange={(e)=>setthepassword(e.target.value)}/>

          <label htmlFor="confirm_password">Confirm Password</label>
          <input type="password" id="confirm_password" name="confirmpassword" required onChange={(e)=>handlepassword(e.target.value)}/>

          <button type="submit">Create Account</button>

        </form>

    </div>
  )
}
