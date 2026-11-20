import { useRef, useState } from "react";
import axios from "axios"
import { useNavigate } from "react-router-dom";

export default function NewAnalysis() {
  const [file, setFile] = useState(null);
  const [data, setdata] = useState({
    jobTitle: "",
    jobDescription: "",
  });
  const [error,seterror]= useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handlesubmit= async(e)=>{
    e.preventDefault();
    
    const formdata = new FormData();

    formdata.append("resume",file);
    formdata.append("jobTitle",data.jobTitle)
    formdata.append("jobDescription",data.jobDescription)

    try {
        const res = await axios.post("http://localhost:5000/api/resume/analysis",formdata,{
            withCredentials:true
        })
        if(res.data?.success){
         const setanalysisid=res.data.analysis.id;
         navigate(`/analysis/${setanalysisid}`)

        }
        
    } catch (error) {
        console.log(error)
        console.log(error.response?.data?.message);
        seterror(error.response?.data?.message)
    }


  }
  const formatSize = (bytes) => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleclick = () => {
    inputRef.current.click();
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer?.files[0]);
  };
  const handleBrowse = (e) => {
    setFile(e.target?.files[0]);
  };
  const handleRemove = () => {
    setFile(null);
    inputRef.current.value = "";
  };

  return (
    <div>
      <div>New Analysis</div>
      {!file ? (
        <div
        className="w-4/5 h-28"
          onClick={handleclick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p className="text-sm text-gray-600">
            Resume drag & drop karein, ya{" "}
            <span className="text-blue-600 font-semibold underline">
              Browse
            </span>{" "}
            karein
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF (Max 5 MB)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between border border-gray-200 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="px-2 py-1 text-xs font-bold text-red-600 bg-red-100 rounded">
              PDF
            </span>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-800 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="ml-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg font-bold text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handlesubmit}>
        <input
          className="border-2"
          ref={inputRef}
          type="file"
          id="resume"
          name="resume"
          hidden
          onChange={handleBrowse}
        />

        <label htmlFor="jobTitle">Job Title</label>
        <input
          className="border-2"
          type="text"
          id="jobTitle"
          name="jobTitle"
          required
          onChange={(e) => setdata({ ...data, jobTitle: e.target.value })}
        />

        <label htmlFor="jobdisc">Job Discription</label>
        <textarea
          className="size-1/2 border-2"
          name="jobdisc"
          id="jobdisc"
          required
          onChange={(e) => setdata({ ...data, jobDescription: e.target.value })}
        >
          Past a Job Discription here
        </textarea>

        <button type="submit" className="border-2">Start Analysis</button>
      </form>

    </div>
  );
}
