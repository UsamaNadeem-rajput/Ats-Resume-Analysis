import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Helper: [X%] jaisa square bracket text highlight karne ke liye
const highlightBrackets = (text) => {
  if (!text) return null;
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? <mark key={index}>{part}</mark> : part
  );
};

export default function Suggestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysisInfo, setAnalysisInfo] = useState(null); 
  const [suggestion, setsuggestion] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true); 
  const [loading, setloading] = useState(false); 
  const [aistatus, setaistatus] = useState("not_requested");
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    const fetchCachedSuggestions = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analysis/single/doc/${id}`,
          { withCredentials: true }
        );

        if (res.data.success && res.data.analysis) {
          const data = res.data.analysis;
          setAnalysisInfo({ jobTitle: data.jobTitle, score: data.score });

          if (data.aiStatus === "ok" && data.suggestions) {
            setsuggestion(data.suggestions);
            setaistatus("ok");
          } else if (data.aiStatus === "failed") {
            setaistatus("failed");
          }
        }
      } catch (error) {
        console.log(error.response?.data?.message || error.message);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCachedSuggestions();
  }, [id]);

 
  const aisuggestion = async () => {
    setloading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/resume/analysis/${id}/suggestions`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        setsuggestion(res.data.suggestions);
        setaistatus(res.data.aiStatus); // 'ok' ya 'failed'
      }
    } catch (error) {
      console.log(error.response?.data?.message || error.message);
      setaistatus("failed");
    } finally {
      setloading(false);
    }
  };


  const handleCopy = async (text, index) => {
    if (!text || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  if (initialLoading) return <p>Loading...</p>;


  const hasPlaceholders = suggestion?.rewrittenBullets?.some((item) =>
    /\[[^\]]+\]/.test(item.after || "")
  );

  return (
    <div>
     
      <div>
        <button type="button" onClick={() => navigate(`/analysis/${id}`)}>
          &larr; Back to result
        </button>
        {analysisInfo && (
          <div>
            <h2>{analysisInfo.jobTitle}</h2>
            <span>Score: {analysisInfo.score}/100</span>
          </div>
        )}
      </div>

      {loading ? (
        <div>
          <p>Analyzing your resume...</p>
          <button disabled>Generating...</button>
        </div>
      ) : aistatus === "not_requested" ? (
        <div>
          <h1>Get AI suggestions</h1>
          <p>
            We send your resume (without your name, email and phone) and the job
            description to an AI. It takes about 10 to 30 seconds.
          </p>
          <button type="button" onClick={aisuggestion}>
            Generate suggestions
          </button>
        </div>
      ) : aistatus === "ok" ? (
        <div>
          <div>
            <h2>Summary</h2>
            <p>{suggestion?.summary}</p>
          </div>

          <div>
            {suggestion?.sectionSuggestions?.map((value, idx) => (
              <div key={idx}>
                <span>{value.section}</span>
                <h3>{value.issue}</h3>
                <p>{value.fix}</p>
              </div>
            ))}
          </div>

          <div>
            {suggestion?.rewrittenBullets?.map((value, idx) => (
              <div key={idx}>
                <div>
                  <p>{value.before}</p>
                </div>
                <div>
                  <p>{highlightBrackets(value.after)}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(value.after, idx)}
                  >
                    {copiedIndex === idx ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}

            {hasPlaceholders && (
              <p>
                Replace [brackets] with your real number, or remove that part.
              </p>
            )}
          </div>

          <div>
            <p>AI suggestions can be wrong. Only add what is true for you.</p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate(`/analysis/${id}/cover-letter`)}
            >
              Write a cover letter
            </button>
          </div>
        </div>
      ) : aistatus === "failed" ? (
        <div>
          <h2>The AI could not respond right now.</h2>
          <button type="button" onClick={aisuggestion}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}