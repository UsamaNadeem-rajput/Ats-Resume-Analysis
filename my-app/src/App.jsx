import { GoogleOAuthProvider } from '@react-oauth/google';
import {BrowserRouter,Routes,Route} from "react-router-dom";
import Register from "./authentication/Register.jsx"
import Login from './authentication/Login.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import HomePage from './home/HomePage.jsx';


import { ContextApi } from './context/ContextApi.jsx';
import NewAnalysis from './analysis/NewAnalysis.jsx';
import Suggestion from './analysis/Suggestion.jsx';
import AnalysisResult from './analysis/AnalysisResult.jsx';
import CoverLetter from './coverletter/CoverLetter.jsx';
import Protection from './protection/Protection.jsx';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <ContextApi>
   <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage/>} />
        <Route path="/register" element={<Register/>}/>
        <Route path='/login' element={<Login/>} />
        <Route element={<Protection/>}>
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/analysis' element={<NewAnalysis/>} />
        <Route path='/analysis/:id' element={<AnalysisResult/>} />
        <Route path='/analysis/:id/suggestions' element={<Suggestion/>} />
        <Route path='/analysis/:id/cover-letter' element={<CoverLetter/>} />
        </Route>
      </Routes>
   
   </BrowserRouter>
   </ContextApi>
   </GoogleOAuthProvider>
  )
}

export default App
