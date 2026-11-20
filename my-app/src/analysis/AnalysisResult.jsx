import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const getScoreColors = (percentage) => {
  if (percentage >= 70) {
    return {
      bar: "bg-green-600",
      badge: "bg-green-600",
      text: "text-green-600",
    };
  }
  if (percentage >= 40) {
    return {
      bar: "bg-amber-500",
      badge: "bg-amber-500",
      text: "text-amber-600",
    };
  }
  return { bar: "bg-red-600", badge: "bg-red-600", text: "text-red-600" };
};

function ScoreBar({ label, earned = 0, max, info, isNA = false }) {
  const percentage = isNA ? 0 : Math.min(100, Math.round((earned / max) * 100));
  const colors = getScoreColors(percentage);

  return (
    <div
      className={`space-y-1.5 transition-opacity ${isNA ? "opacity-45" : "opacity-100"}`}
    >
      {/* Upar Label + Info Tooltip + Kamaye/Kul Number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-700">{label}</span>

          {/* Tooltip */}
          <div className="relative group inline-flex items-center">
            <span
              tabIndex={0}
              className="cursor-help text-gray-400 hover:text-blue-600 focus:text-blue-600 text-sm outline-none"
            >
              ⓘ
            </span>

            <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-lg z-20">
              {info}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Right side: "Not applicable" ya "earned / max" */}
        <span className="text-sm font-semibold text-gray-800">
          {isNA ? "Not applicable" : `${earned} / ${max}`}
        </span>
      </div>

      {/* Progress Patti (Bar) */}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isNA ? "bg-gray-400" : colors.bar
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analysis/single/doc/${id}`,
          { withCredentials: true },
        );
        if (res.data.success) {
          setResult(res.data?.analysis);
          console.log(res.data?.analysis);
        }
      } catch (error) {
        console.log(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-600">Loading...</p>;
  if (!result) return <p className="p-6 text-red-600">Result nahi mila.</p>;

  const { jobTitle, createdAt: date, score = 0, notApplicable = [] } = result;
  const {
    orignalName: resume_name,
    pageCount: resume_pages,
    detectedSections = [],
  } = result.resume || {};
  const breakdown = result.breakdown || {};
  const { matchedSkills = [], missingSkills = [] } = result;

  const breakdownItems = [
    {
      key: "skillsMatch",
      label: "Skills match",
      max: 40,
      info: "Job description ki required skills mein se kitni aapke resume mein maujood hain.",
    },
    {
      key: "keywordMatch",
      label: "Keyword match",
      max: 20,
      info: "Job description ke ahem alfaaz aur role keywords ka match.",
    },
    {
      key: "sectionCompleteness",
      label: "Sections",
      max: 15,
      info: "Education, skills, aur experience ya projects headings maujood hain?",
    },
    {
      key: "formatting",
      label: "Formatting",
      max: 10,
      info: "Saaf text extraction, munasib lambai, aur garbled characters ki adam maujoodgi.",
    },
    {
      key: "achievements",
      label: "Achievements",
      max: 10,
      info: "Bullets mein numbers, percentages, aur measurable results ki maujoodgi.",
    },
    {
      key: "readability",
      label: "Readability",
      max: 5,
      info: "1 se 2 pages ki lambai, bullets ka istemal, aur chote jumlay.",
    },
  ];

  const resumeSections = [
    "Education",
    "Experience",
    "Skills",
    "Projects",
    "Summary",
  ];

  const mainScoreColors = getScoreColors(score);
  const matchedCount = matchedSkills.length;
  const totalRequired = matchedCount + missingSkills.length;

  const deleteanalysis= async(Analyseid)=>{

    try {
      const res = await axios.delete(`http://localhost:5000/api/resume/analysis/doc/remove/${Analyseid}`,{
          withCredentials:true
    })
    if(res.data.success){
      return navigate('/analysis');
    }
      
    } catch (error) {
      console.log(error)
      
    }

    
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-2"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{jobTitle}</h1>
          <p className="text-sm text-gray-500">
            {new Date(date).toLocaleDateString()} · {resume_name} (
            {resume_pages} pages)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/analysis/${id}/suggestions`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Get AI suggestions
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Score Circle + Right 6 Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* 1. Score Gauge */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`w-40 h-40 rounded-full ${mainScoreColors.badge} text-white flex flex-col items-center justify-center shadow-md`}
          >
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-xs opacity-90">/ 100</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              ATS-style score (estimate)
            </span>

            <div className="relative group inline-flex items-center">
              <span className="cursor-help text-gray-400 hover:text-blue-600 text-sm select-none">
                ⓘ
              </span>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                Real ATS systems are private and differ by company. This score
                estimates how well your resume matches this job.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Score breakdown
          </h2>
          {breakdownItems.map((item) => {
            const isNA = Array.isArray(notApplicable)
              ? notApplicable.includes(item.key)
              : Boolean(notApplicable?.[item.key]);

            return (
              <ScoreBar
                key={item.key}
                label={item.label}
                earned={breakdown[item.key] ?? 0}
                max={item.max}
                info={item.info}
                isNA={isNA}
              />
            );
          })}
        </div>
      </div>
      <div>
        <div>
          {totalRequired > 0 ? (
            <h1>
              {matchedCount} of {totalRequired} required skills{" "}
            </h1>
          ) : (
            <h1>No specific skills required in this JD</h1>
          )}
        </div>
        <div className="flex justify-center">
          <div className="w-2/5">
            {matchedSkills.length !== 0 ? (
              matchedSkills.map((skill) => (
                <h2 key={skill} title={skill} className="truncate max-w-37.5">
                  {skill}
                </h2>
              ))
            ) : (
              <h2>No matched skills</h2>
            )}
          </div>
          <div className="w-2/5">
            {missingSkills.length !== 0 ? (
              missingSkills.map((skill) => (
                <h2 key={skill} title={skill} className="truncate max-w-37.5">
                  {skill}
                </h2>
              ))
            ) : (
              <h2>No missing skills</h2>
            )}
          </div>
        </div>
      </div>
      <div>
        <div>
          {resumeSections.map((value) => (
            <div key={value} className="flex items-center gap-2">
              {detectedSections.includes(value.toLowerCase()) ? (
                <svg
                  className="w-4 h-4 text-green-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <h2>{value}</h2>
            </div>
          ))}
        </div>
      </div>
      {/* 6. Agla Qadam (Next Steps Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* Card 1: AI Suggestions */}
        <div className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Improve your resume with AI suggestions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Get section-by-section fixes and rewritten bullet points tailored
              to this job.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/analysis/${id}/suggestions`)}
            className="w-fit px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            {result.aiStatus === "ok"
              ? "View AI suggestions"
              : "Get AI suggestions"}
          </button>
        </div>

        {/* Card 2: Cover Letter */}
        <div className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Write a cover letter for this job
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Generate an editable, ready-to-download PDF cover letter using
              your resume facts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/analysis/${id}/cover-letter`)}
            className="w-fit px-4 py-2 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            {result.hasCoverLetter ? "View cover letter" : "Write cover letter"}
          </button>
        </div>
      </div>
      <div>
        <button onClick={()=>deleteanalysis(id)}>Delete</button>

      </div>
    </div>
  );
}
