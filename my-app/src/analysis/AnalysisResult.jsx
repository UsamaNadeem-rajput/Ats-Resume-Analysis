import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Context } from "../context/ContextApi";
import {
  PageShell,
  Navbar,
  Button,
  Chip,
  ConfirmDialog,
  Skeleton,
  Tooltip
} from "../components";
import { skillLabel } from "../utils/skillLabel";
import { BREAKDOWN_GROUPS, markTotals } from "../utils/score";

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name, user, logout } = useContext(Context);
  const displayName = name || user?.name || "User";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const moreDetailsRef = useRef(null);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analysis/single/doc/${id}`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          setResult({
            ...res.data.analysis,
            hasCoverLetter: res.data.hasCoverLetter ?? res.data.analysis?.hasCoverLetter
          });
        } else {
          setError("Analysis record nahi mila");
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Result nahi mila.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      try {
        await axios.post(
          "http://localhost:5000/api/auth/logout",
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error("Logout error:", err.response?.data?.message || err.message);
      }
    }
    navigate("/");
  };

  const deleteanalysis = async (analyseId) => {
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/resume/analysis/doc/remove/${analyseId}`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        return navigate("/analysis");
      }
    } catch (err) {
      console.error("Delete error:", err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <PageShell
        tape={{ variant: "base", caption: "Measuring..." }}
        style={{
          minHeight: "100vh",
          background: "#E9EEF2",
          color: "#10233A",
          fontFamily: "'Figtree', system-ui, sans-serif"
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
          <Navbar
            isLoggedIn={true}
            activeKey=""
            user={{ name: displayName }}
            onLogout={handleLogout}
            maxWidth="1100px"
          />
          <div style={{ margin: "16px 0 36px" }}>
            <Skeleton height="64px" width="55%" style={{ marginBottom: "16px" }} />
            <Skeleton height="20px" width="35%" style={{ marginBottom: "14px" }} />
            <Skeleton height="32px" width="130px" />
          </div>
          <div aria-hidden="true" style={{ display: "grid", gap: "14px", maxWidth: "640px" }}>
            <Skeleton height="90px" />
            <Skeleton height="18px" width="70%" />
            <Skeleton height="18px" width="50%" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!result || error) {
    return (
      <PageShell
        tape={{ variant: "base", caption: "Not found" }}
        style={{
          minHeight: "100vh",
          background: "#E9EEF2",
          color: "#10233A",
          fontFamily: "'Figtree', system-ui, sans-serif"
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
          <Navbar
            isLoggedIn={true}
            activeKey=""
            user={{ name: displayName }}
            onLogout={handleLogout}
            maxWidth="1100px"
          />
          <div
            style={{
              maxWidth: "520px",
              margin: "56px auto 0",
              border: "2px solid #10233A",
              background: "#fff",
              padding: "24px 28px",
              boxShadow: "6px 6px 0 #10233A",
              boxSizing: "border-box"
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                font: "800 24px 'Bricolage Grotesque', sans-serif",
                color: "#10233A"
              }}
            >
              Analysis not found
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                color: "#3E5068",
                fontSize: "15px",
                lineHeight: 1.5
              }}
            >
              {error || "Something went wrong, or this analysis was deleted."}
            </p>
            <Link
              to="/dashboard"
              className="btn btn2"
              style={{ minHeight: "44px", fontSize: "15px" }}
            >
              Back to history
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const { jobTitle = "Job Analysis", createdAt: date, score = 0, notApplicable = [] } = result;
  const {
    orignalName: resume_name,
    pageCount: resume_pages,
    detectedSections = []
  } = result.resume || {};
  const breakdown = result.breakdown || {};
  const matchedSkills = result.matchedSkills || [];
  const missingSkills = result.missingSkills || [];
  const matchedKeywords = result.matchedkeywords || result.matchedKeywords || [];
  const missingKeywords = result.missingkeywords || result.missingKeywords || [];

  const matchedCount = matchedSkills.length;
  const totalRequired = matchedCount + missingSkills.length;
  const totalKeywords = matchedKeywords.length + missingKeywords.length;

  const effectiveNotApplicable = new Set(
    Array.isArray(notApplicable) ? notApplicable : Object.keys(notApplicable || {})
  );
  if (totalKeywords === 0) effectiveNotApplicable.add("keywordMatch");
  if (totalRequired === 0) effectiveNotApplicable.add("skillsMatch");

  const notApplicableList = Array.from(effectiveNotApplicable);
  const { earned: marksEarned, possible: marksPossible } = markTotals(
    breakdown,
    notApplicableList
  );

  const numScore = Number(score || 0);
  let scoreColor = "#1F7A4D";
  let scoreTextColor = "#1F7A4D";
  let scoreLabel = "GOOD MATCH";
  let matchQuality = "a good match";

  if (numScore >= 70) {
    scoreColor = "#1F7A4D";
    scoreTextColor = "#1F7A4D";
    scoreLabel = "GOOD MATCH";
    matchQuality = "a good match";
  } else if (numScore >= 40) {
    scoreColor = "#B45309";
    scoreTextColor = "#9A4A06";
    scoreLabel = "FAIR MATCH";
    matchQuality = "a fair match";
  } else {
    scoreColor = "#B3261E";
    scoreTextColor = "#B3261E";
    scoreLabel = "WEAK MATCH";
    matchQuality = "a weak match";
  }

  let aiStatusVariant = "gr";
  let aiStatusLabel = "AI not requested";
  if (result.aiStatus === "ok") {
    aiStatusVariant = "ok";
    aiStatusLabel = "AI ready";
  } else if (result.aiStatus === "failed") {
    aiStatusVariant = "bad";
    aiStatusLabel = "AI failed";
  }

  const dateFormatted = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";
  const pagesText = resume_pages
    ? resume_pages === 1
      ? "1 page"
      : `${resume_pages} pages`
    : "1 page";
  const resumeDisplayName = resume_name || "Resume.pdf";

  const breakdownItems = [
    {
      key: "skillsMatch",
      label: "Skills match",
      max: 40,
      info: "How many of the skills the job asks for appear in your resume.",
      naInfo: "This job description lists no recognized skills, so this part is not counted."
    },
    {
      key: "keywordMatch",
      label: "Keyword match",
      max: 20,
      info: "How many common words from the job description appear in your resume, apart from skills.",
      naInfo: "This job description has no common words beyond its skills, so this part is not counted."
    },
    {
      key: "sectionCompleteness",
      label: "Sections",
      max: 15,
      info: "Whether Education, Skills and Experience or Projects headings are present."
    },
    {
      key: "formatting",
      label: "Formatting",
      max: 10,
      info: "Whether the file is clean enough for a system to read, such as plain text and clear headings."
    },
    {
      key: "achievements",
      label: "Achievements",
      max: 10,
      info: "Whether your bullets show results, such as numbers and outcomes."
    },
    {
      key: "readability",
      label: "Readability",
      max: 5,
      info: "Whether sentences and bullets are short and easy to scan."
    }
  ];

  const resumeSections = [
    "Education",
    "Experience",
    "Skills",
    "Projects",
    "Summary"
  ];

  return (
    <PageShell
      tape={{ variant: "score", value: numScore }}
      style={{
        minHeight: "100vh",
        background: "#E9EEF2",
        color: "#10233A",
        fontFamily: "'Figtree', system-ui, sans-serif"
      }}
      data-canvas-width="1440"
      data-canvas-height="2500"
      data-document-role="page"
      data-label="B — Result copy"
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
        <Navbar
          isLoggedIn={true}
          activeKey="history"
          user={{ name: displayName }}
          onLogout={handleLogout}
          maxWidth="1100px"
        />

        <Link
          to="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            fontWeight: 600,
            color: "#B83A16",
            textDecoration: "none",
            marginTop: "8px"
          }}
        >
          ← Back to history
        </Link>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px 40px",
            justifyContent: "space-between",
            alignItems: "flex-end",
            margin: "8px 0 44px"
          }}
        >
          <div style={{ flex: "1 1 440px" }}>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(42px, 6vw, 88px)",
                lineHeight: 0.94,
                letterSpacing: "-.03em",
                margin: "0 0 16px"
              }}
            >
              {jobTitle}
              <span style={{ color: "#B83A16" }}>.</span>
            </h1>
            <p style={{ margin: "0 0 14px", fontSize: "16px", color: "#3E5068" }}>
              {dateFormatted ? `${dateFormatted} · ` : ""}
              {resumeDisplayName} · {pagesText}
            </p>
            <Chip variant={aiStatusVariant}>{aiStatusLabel}</Chip>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <Button as={Link} to={`/analysis/${id}/suggestions`} arrow>
              {result.aiStatus === "ok" ? "View AI suggestions" : "Get AI suggestions"}
            </Button>
            <Button as={Link} to={`/analysis/${id}/cover-letter`} variant="secondary">
              {result.hasCoverLetter ? "View cover letter" : "Cover letter"}
            </Button>

            <details ref={moreDetailsRef} style={{ position: "relative" }}>
              <summary
                aria-label="More actions"
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  width: "52px",
                  height: "52px",
                  border: "2px solid #10233A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff"
                }}
              >
                <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
                  <circle cx="3" cy="3" r="2.5" fill="#10233A" />
                  <circle cx="11" cy="3" r="2.5" fill="#10233A" />
                  <circle cx="19" cy="3" r="2.5" fill="#10233A" />
                </svg>
              </summary>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "58px",
                  background: "#F6F8FA",
                  border: "2px solid #10233A",
                  padding: "8px 0",
                  minWidth: "200px",
                  zIndex: 9
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (moreDetailsRef.current) moreDetailsRef.current.open = false;
                    setDeleteDialogOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "44px",
                    padding: "0 18px",
                    color: "#B3261E",
                    fontWeight: 600,
                    textDecoration: "none",
                    background: "none",
                    border: 0,
                    width: "100%",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    textAlign: "left"
                  }}
                >
                  Delete analysis
                </button>
              </div>
            </details>
          </div>
        </div>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.05s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">A</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Score
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                How well your resume matches this job, as an estimate.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <div style={{ maxWidth: "440px" }}>
              <svg
                viewBox="0 0 400 250"
                role="img"
                aria-label={`ATS-style score: ${numScore} out of 100, ${matchQuality}`}
                style={{ width: "100%", display: "block" }}
              >
                <path
                  d="M40 220A160 160 0 0 1 360 220"
                  pathLength="100"
                  fill="none"
                  stroke="#D3DBE4"
                  strokeWidth="28"
                  strokeLinecap="round"
                />
                <path
                  className="arc"
                  d="M40 220A160 160 0 0 1 360 220"
                  pathLength="100"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="28"
                  strokeLinecap="round"
                  strokeDasharray={`${numScore} 100`}
                  style={{ "--arc-target": `${numScore} 100` }}
                />
                <text
                  x="200"
                  y="196"
                  textAnchor="middle"
                  fontFamily="'Bricolage Grotesque', sans-serif"
                  fontWeight="800"
                  fontSize="104"
                  fill="#10233A"
                >
                  {numScore}
                </text>
                <text
                  x="200"
                  y="236"
                  textAnchor="middle"
                  fontFamily="'DM Mono', monospace"
                  fontSize="14"
                  letterSpacing="1.5"
                  fill={scoreTextColor}
                >
                  / 100 · {scoreLabel}
                </text>
              </svg>
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  margin: "4px 0 0",
                  fontSize: "16px",
                  fontWeight: 600
                }}
              >
                ATS-style score (estimate)
                <Tooltip
                  label="About the score"
                  text="Real ATS systems are private and differ by company. This score estimates how well your resume matches this job."
                />
              </p>
            </div>
          </div>
        </section>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.1s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">B</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Score breakdown
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                Six parts. Hover or focus the i icon to see what each one measures.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxWidth: "640px" }}>
              {breakdownItems.map((item, idx) => {
                const isNA = effectiveNotApplicable.has(item.key);
                const earned = breakdown[item.key] ?? 0;
                const pct = Math.min(100, Math.round((earned / item.max) * 100));
                let barBg = "#1F7A4D";
                if (pct < 40) barBg = "#B3261E";
                else if (pct < 70) barBg = "#B45309";

                return (
                  <li key={item.key} style={{ margin: "0 0 22px" }}>
                    {isNA ? (
                      <div style={{ opacity: 0.55 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "8px"
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 600,
                              fontSize: "17px"
                            }}
                          >
                            {item.label}
                            <Tooltip
                              label={`About ${item.label}`}
                              text={item.naInfo || item.info}
                            />
                          </span>
                          <span style={{ font: "500 15px 'DM Mono', monospace" }}>Not applicable</span>
                        </div>
                        <div
                          style={{
                            height: "14px",
                            background: "repeating-linear-gradient(45deg,#D3DBE4 0 6px,#E9EEF2 6px 12px)"
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "8px"
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 600,
                              fontSize: "17px"
                            }}
                          >
                            {item.label}
                            <Tooltip label={`About ${item.label}`} text={item.info} />
                          </span>
                          <span style={{ font: "500 15px 'DM Mono', monospace" }}>
                            {earned} / {item.max}
                          </span>
                        </div>
                        <div style={{ height: "14px", background: "#D3DBE4" }}>
                          <div
                            className="grow"
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: barBg,
                              animationDelay: `${0.3 + idx * 0.1}s`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {marksPossible < 100 && (
              <p
                style={{
                  margin: "16px 0 0",
                  color: "#3E5068",
                  fontSize: "14px",
                  fontFamily: "'DM Mono', monospace"
                }}
              >
                {marksEarned} of {marksPossible} possible marks, scaled to {numScore}/100.
              </p>
            )}
          </div>
        </section>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.15s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">C</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Skills
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                The skills the job asks for, compared with your resume.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <p style={{ margin: "0 0 18px", font: "800 22px 'Bricolage Grotesque', sans-serif" }}>
              {totalRequired > 0
                ? `${matchedCount} of ${totalRequired} required skills`
                : "No specific skills required in this JD"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px 32px" }}>
              <div>
                <p className="mono" style={{ margin: "0 0 12px", color: "#1F7A4D" }}>
                  Matched skills
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {matchedSkills.map((skill, i) => (
                    <Chip
                      key={skill}
                      variant="ok"
                      className="pop"
                      title={skillLabel(skill)}
                      style={{ animationDelay: `${(0.9 + i * 0.12).toFixed(2)}s` }}
                    >
                      ✓ {skillLabel(skill)}
                    </Chip>
                  ))}
                  {matchedSkills.length === 0 && (
                    <p style={{ color: "#3E5068", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
                      No matched skills
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mono" style={{ margin: "0 0 12px", color: "#9A4A06" }}>
                  Missing skills
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {missingSkills.map((skill, i) => (
                    <Chip
                      key={skill}
                      variant="no"
                      className="pop"
                      title={skillLabel(skill)}
                      style={{ animationDelay: `${(1.7 + i * 0.12).toFixed(2)}s` }}
                    >
                      ✗ {skillLabel(skill)}
                    </Chip>
                  ))}
                  {missingSkills.length === 0 && (
                    <p style={{ color: "#3E5068", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
                      No missing skills
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.2s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">D</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Keywords
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                Common words from the job description, apart from skills.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <details open className="acc">
              <summary>
                Keywords · {matchedKeywords.length} of {totalKeywords} matched
              </summary>
              {totalKeywords === 0 ? (
                <p
                  style={{
                    margin: "16px 0 0",
                    color: "#3E5068",
                    fontSize: "15px",
                    lineHeight: 1.5
                  }}
                >
                  No extra keywords found. This job description is mostly a skills list, so your match is based on skills.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "20px 32px",
                    paddingTop: "18px"
                  }}
                >
                  <div>
                    <p className="mono" style={{ margin: "0 0 12px", color: "#1F7A4D" }}>
                      Matched
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {matchedKeywords.map((kw) => (
                        <Chip key={kw} variant="ok">
                          ✓ {kw}
                        </Chip>
                      ))}
                      {matchedKeywords.length === 0 && (
                        <p style={{ color: "#3E5068", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
                          No matched keywords
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mono" style={{ margin: "0 0 12px", color: "#9A4A06" }}>
                      Missing
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {missingKeywords.map((kw) => (
                        <Chip key={kw} variant="no">
                          ✗ {kw}
                        </Chip>
                      ))}
                      {missingKeywords.length === 0 && (
                        <p style={{ color: "#3E5068", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
                          No missing keywords
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </details>
          </div>
        </section>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.25s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">E</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Resume sections
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                Headings an ATS looks for.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px"
              }}
            >
              {resumeSections.map((sec) => {
                const isFound = detectedSections.some(
                  (s) => s.toLowerCase() === sec.toLowerCase()
                );
                return (
                  <li
                    key={sec}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      border: isFound ? "2px solid #1F7A4D" : "2px solid #9A4A06",
                      borderStyle: isFound ? "solid" : "dashed",
                      background: "#fff",
                      padding: "14px 16px",
                      fontWeight: 600
                    }}
                  >
                    <span>{sec}</span>
                    <span style={{ color: isFound ? "#1F7A4D" : "#9A4A06", fontSize: "14px" }}>
                      {isFound ? "✓ Found" : "✗ Missing"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          className="row"
          style={{
            borderTop: "3px dashed #10233A",
            padding: "28px 0 36px",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px 40px",
            animationDelay: "0.3s"
          }}
        >
          <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span className="mark">F</span>
            <div>
              <h2 style={{ font: "800 26px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 6px" }}>
                Next step
              </h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                Two things you can do with this result.
              </p>
            </div>
          </div>

          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              <div
                style={{
                  border: "2px solid #10233A",
                  background: "#F6F8FA",
                  padding: "28px 26px",
                  boxShadow: "6px 6px 0 #10233A"
                }}
              >
                <p style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 20px" }}>
                  Improve your resume with AI suggestions
                </p>
                <Button as={Link} to={`/analysis/${id}/suggestions`} arrow>
                  {result.aiStatus === "ok" ? "View AI suggestions" : "Get AI suggestions"}
                </Button>
              </div>

              <div
                style={{
                  border: "2px solid #10233A",
                  background: "#F6F8FA",
                  padding: "28px 26px",
                  boxShadow: "6px 6px 0 #10233A"
                }}
              >
                <p style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: "0 0 20px" }}>
                  Write a cover letter for this job
                </p>
                <Button as={Link} to={`/analysis/${id}/cover-letter`} variant="secondary" arrow>
                  {result.hasCoverLetter ? "View cover letter" : "Write cover letter"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Are you sure?"
        message="Delete this analysis and its cover letter?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteanalysis(id);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </PageShell>
  );
}
