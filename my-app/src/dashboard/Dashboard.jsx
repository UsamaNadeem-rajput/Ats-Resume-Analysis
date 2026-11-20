import { useContext, useEffect, useState } from "react"
import {Link, useNavigate} from "react-router-dom"
import {Context} from "../context/ContextApi"
import axios from "axios"




export default function Dashboard() {
    const {name} = useContext(Context)
    const [doclist,setdoclist] = useState()
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        total: 0,
        latestScore: null,
        bestOfLast10: null,
    });

    useEffect(()=>{
        async function list(){
        try {
            const res = await axios.get("http://localhost:5000/api/resume/analyses/list",{
                withCredentials: true,
            })
            if (res.data.success) {
                const items = res.data.data || [];
                const totalCount = res.data?.totaldocs || 0;

                const latest = items.length > 0 ? items[0].score : null;

                const best = items.length > 0 ? Math.max(...items.map((item) => item.score)) : null;

                setdoclist(items);
                setStats({
                    total: totalCount,
                    latestScore: latest,
                    bestOfLast10: best,
                });
            }
            
        } catch (error) {
            console.log(error.response?.data?.message)
            
        }
    }
    list();

    },[])
        

    
    
  return (
    <div>
        <h1>Dashbaord</h1>
        <h2>Wellcome, {name} <span><Link to='/analysis'> + New Analysis</Link></span></h2>
        <div className="flex gap-1">
            <div className="box-border size-32 border-4">
                <h3>Total Analyses</h3>
                {stats.total}
            </div>
            <div className="box-border size-32 border-4">
                <h3>Latest Score</h3>
                {stats.latestScore}
            </div>
            <div className="box-border size-32 border-4">
                <h3>Best of last 10</h3>
                {stats.bestOfLast10}

            </div>
            
        </div>

        <div className="box-border border-4">
                {doclist?
                    
                        <table>
                            <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Score</th>
                                <th>AI Suggestion Status</th>
                                <th>-</th>
                            </tr>
                            </thead>
                            <tbody>
                            { doclist?.map((value, index)=>(
                            <tr>
                               
                                <td>{value.jobTitle?<span>{value.jobTitle}</span>:<span>There is no any job Title</span>}</td>
                                <td>{value.score}</td>
                                <td> {value.aiStatus}</td>
                                <td> <Link className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-2.5 rounded" to={`/analysis/${value._id}`}> View</Link></td>
                            </tr>
                            ))}
                            </tbody>
                        </table>
                        
                   :<h1>No analyses yet. Upload your resume to see your first score</h1>
                }

            </div>
        
    </div>
  )
}
