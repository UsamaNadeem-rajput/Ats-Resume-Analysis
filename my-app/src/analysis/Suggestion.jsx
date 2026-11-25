import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Context } from "../context/ContextApi";
import {
  PageShell,
  Navbar,
  Button,
  Chip,
  Skeleton
} from "../components";

const highlightBrackets = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\[[^\]]+\])/g);
  return parts.map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={index} className="ph">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default function Suggestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name, user, logout } = useContext(Context);
  const displayName = name || user?.name || "User";

  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [suggestion, setsuggestion] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setloading] = useState(false);
  const [aistatus, setaistatus] = useState("not_requested");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCachedSuggestions = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analysis/single/doc/${id}`,
          { withCredentials: true }
        );

        if (res.data?.success && res.data?.analysis) {
          const data = res.data.analysis;
          setAnalysisInfo({ jobTitle: data.jobTitle, score: data.score });

          if (data.aiStatus === "ok" && data.suggestions) {
            setsuggestion(data.suggestions);
            setaistatus("ok");
          } else if (data.aiStatus === "failed") {
            setaistatus("failed");
          }
        } else {
          setError("Analysis not found");
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.log(msg);
        setError(msg);
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

      if (res.data?.success) {
        setsuggestion(res.data.suggestions);
        setaistatus(res.data.aiStatus);
      }
    } catch (err) {
      console.log(err.response?.data?.message || err.message);
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
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

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

  const hasPlaceholders = suggestion?.rewrittenBullets?.some((item) =>
    /\[[^\]]+\]/.test(item.after || "")
  );

  const scoreNum = Number(analysisInfo?.score || 0);
  let scoreVariant = "ok";
  let matchLabel = "Good match";
  if (scoreNum >= 70) {
    scoreVariant = "ok";
    matchLabel = "Good match";
  } else if (scoreNum >= 40) {
    scoreVariant = "fair";
    matchLabel = "Fair match";
  } else {
    scoreVariant = "bad";
    matchLabel = "Weak match";
  }

  if (initialLoading) {
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
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(20px, 5vw, 56px) 64px"
          }}
        >
          <Navbar
            isLoggedIn={true}
            activeKey=""
            user={{ name: displayName }}
            onLogout={handleLogout}
            maxWidth="1100px"
          />
          <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
            <Skeleton height="44px" width="160px" />
            <Skeleton height="70px" width="380px" />
            <Skeleton height="180px" />
            <Skeleton height="180px" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!analysisInfo) {
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
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(20px, 5vw, 56px) 64px"
          }}
        >
          <Navbar
            isLoggedIn={true}
            activeKey=""
            user={{ name: displayName }}
            onLogout={handleLogout}
            maxWidth="1100px"
          />
          <div
            style={{
              maxWidth: "620px",
              margin: "40px auto 0",
              border: "2px solid #B3261E",
              background: "#fff",
              padding: "40px clamp(22px, 4vw, 44px)",
              textAlign: "center"
            }}
          >
            <h2
              style={{
                font: "800 34px/1.05 'Bricolage Grotesque', sans-serif",
                margin: "0 0 12px"
              }}
            >
              Analysis not found
            </h2>
            <p
              role="alert"
              style={{
                margin: "0 0 26px",
                fontSize: "18px",
                lineHeight: 1.55,
                color: "#7A1A12",
                fontWeight: 600
              }}
            >
              {error || "We could not find the analysis record you requested."}
            </p>
            <Button onClick={() => navigate("/analysis")}>
              Go to New Analysis
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      tape={{ variant: "score", value: analysisInfo.score }}
      style={{
        minHeight: "100vh",
        background: "#E9EEF2",
        color: "#10233A",
        fontFamily: "'Figtree', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 56px) 64px"
        }}
      >
        <Navbar
          isLoggedIn={true}
          activeKey=""
          user={{ name: displayName }}
          onLogout={handleLogout}
          maxWidth="1100px"
        />

        <Link
          to={`/analysis/${id}`}
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
          ← Back to result
        </Link>

        <p className="mono" style={{ margin: "12px 0 10px", color: "#3E5068" }}>
          AI suggestions
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px 28px",
            alignItems: "center",
            margin: "0 0 40px"
          }}
        >
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(42px, 6vw, 88px)",
              lineHeight: 0.94,
              letterSpacing: "-0.03em",
              margin: 0
            }}
          >
            {analysisInfo.jobTitle || "Job Analysis"}
            <span style={{ color: "#B83A16" }}>.</span>
          </h1>
          <Chip
            variant={scoreVariant}
            style={{ fontSize: "16px", padding: "8px 14px" }}
          >
            {`${scoreNum} / 100 · ${matchLabel}`}
          </Chip>
        </div>

        <div style={{ position: "relative" }}>
          {loading ? (
            <div className="st2">
              <div
                style={{ maxWidth: "760px", margin: "24px auto 0" }}
                aria-live="polite"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "12px"
                  }}
                >
                  <span className="spin" />
                  <p
                    style={{
                      margin: 0,
                      font: "800 26px 'Bricolage Grotesque', sans-serif"
                    }}
                  >
                    Analyzing your resume...
                  </p>
                </div>

                <svg
                  viewBox="0 0 1000 6"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    height: "6px",
                    display: "block",
                    marginBottom: "28px"
                  }}
                >
                  <line
                    className="stitch"
                    x1="0"
                    y1="3"
                    x2="1000"
                    y2="3"
                    stroke="#B83A16"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                  />
                </svg>

                <div
                  aria-hidden="true"
                  style={{
                    display: "grid",
                    gap: "16px",
                    marginBottom: "28px"
                  }}
                >
                  <Skeleton height="96px" />
                  <Skeleton height="140px" />
                  <Skeleton height="140px" />
                </div>

                <Button disabled>Generate suggestions</Button>
              </div>
            </div>
          ) : aistatus === "not_requested" ? (
            <div className="st1">
              <div
                style={{
                  maxWidth: "620px",
                  margin: "24px auto 0",
                  border: "2px solid #10233A",
                  background: "#F6F8FA",
                  padding: "40px clamp(22px, 4vw, 44px)",
                  boxShadow: "8px 8px 0 #10233A",
                  textAlign: "center"
                }}
              >
                <svg
                  className="bob"
                  width="84"
                  height="84"
                  viewBox="0 0 84 84"
                  aria-hidden="true"
                  style={{ display: "block", margin: "0 auto 18px" }}
                >
                  <rect
                    x="22"
                    y="10"
                    width="40"
                    height="64"
                    fill="#fff"
                    stroke="#10233A"
                    strokeWidth="3"
                  />
                  <rect
                    x="14"
                    y="2"
                    width="56"
                    height="80"
                    fill="none"
                    stroke="#B83A16"
                    strokeWidth="2.5"
                    strokeDasharray="7 5"
                  />
                  <path
                    d="M42 24l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"
                    fill="#B83A16"
                  />
                </svg>
                <h2
                  style={{
                    font: "800 36px/1.05 'Bricolage Grotesque', sans-serif",
                    margin: "0 0 14px"
                  }}
                >
                  Get AI suggestions
                </h2>
                <p
                  style={{
                    margin: "0 0 28px",
                    fontSize: "17px",
                    lineHeight: 1.6,
                    color: "#3E5068"
                  }}
                >
                  We send your resume (without your name, email and phone) and the
                  job description to an AI. It takes about 10 to 30 seconds.
                </p>
                <Button arrow onClick={aisuggestion}>
                  Generate suggestions
                </Button>
              </div>
            </div>
          ) : aistatus === "ok" ? (
            <div className="st3">
              {suggestion?.summary && (
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
                  <div
                    style={{
                      flex: "0 0 min(100%, 280px)",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start"
                    }}
                  >
                    <span className="mark">A</span>
                    <div>
                      <h2
                        style={{
                          font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                          margin: "0 0 6px"
                        }}
                      >
                        Summary
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: "#3E5068"
                        }}
                      >
                        What the AI noticed overall.
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                    <div
                      className="pop"
                      style={{
                        border: "2px solid #10233A",
                        background: "#F6F8FA",
                        padding: "24px 26px",
                        boxShadow: "6px 6px 0 #10233A",
                        animationDelay: "0.1s"
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          font: "500 21px/1.5 'Figtree', sans-serif"
                        }}
                      >
                        {suggestion.summary}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {suggestion?.sectionSuggestions?.length > 0 && (
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
                  <div
                    style={{
                      flex: "0 0 min(100%, 280px)",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start"
                    }}
                  >
                    <span className="mark">B</span>
                    <div>
                      <h2
                        style={{
                          font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                          margin: "0 0 6px"
                        }}
                      >
                        Suggestions by section
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: "#3E5068"
                        }}
                      >
                        Each card names the section, the issue and the fix.
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "18px"
                      }}
                    >
                      {suggestion.sectionSuggestions.map((value, idx) => (
                        <article
                          key={idx}
                          className="pop"
                          style={{
                            border: "2px solid #10233A",
                            background: "#fff",
                            padding: "22px 24px",
                            animationDelay: `${0.2 + idx * 0.1}s`
                          }}
                        >
                          <span
                            className="mono"
                            style={{
                              display: "inline-block",
                              border: "2px solid #B83A16",
                              color: "#B83A16",
                              padding: "3px 10px",
                              marginBottom: "14px"
                            }}
                          >
                            {value.section}
                          </span>
                          <p
                            className="mono"
                            style={{ margin: "0 0 4px", color: "#3E5068" }}
                          >
                            Issue
                          </p>
                          <p
                            style={{
                              margin: "0 0 14px",
                              lineHeight: 1.55,
                              fontWeight: 500
                            }}
                          >
                            {value.issue}
                          </p>
                          <p
                            className="mono"
                            style={{ margin: "0 0 4px", color: "#1F7A4D" }}
                          >
                            Fix
                          </p>
                          <p style={{ margin: 0, lineHeight: 1.55 }}>
                            {highlightBrackets(value.fix)}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {suggestion?.rewrittenBullets?.length > 0 && (
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
                  <div
                    style={{
                      flex: "0 0 min(100%, 280px)",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start"
                    }}
                  >
                    <span className="mark">C</span>
                    <div>
                      <h2
                        style={{
                          font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                          margin: "0 0 6px"
                        }}
                      >
                        Rewritten bullets
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: "#3E5068"
                        }}
                      >
                        Compare each bullet before and after. Copy the ones that
                        are true for you.
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                    {suggestion.rewrittenBullets.map((value, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                          gap: "16px",
                          marginBottom: "24px"
                        }}
                      >
                        <div
                          style={{
                            border: "2px dashed #8798AC",
                            background: "#F6F8FA",
                            padding: "18px 20px"
                          }}
                        >
                          <p
                            className="mono"
                            style={{ margin: "0 0 8px", color: "#5C6F85" }}
                          >
                            Before
                          </p>
                          <p
                            style={{
                              margin: 0,
                              lineHeight: 1.6,
                              color: "#5C6F85"
                            }}
                          >
                            {value.before}
                          </p>
                        </div>
                        <div
                          className="slide"
                          style={{
                            border: "2px solid #10233A",
                            borderLeft: "8px solid #1F7A4D",
                            background: "#fff",
                            padding: "18px 20px",
                            animationDelay: `${0.3 + idx * 0.15}s`
                          }}
                        >
                          <p
                            className="mono"
                            style={{ margin: "0 0 8px", color: "#1F7A4D" }}
                          >
                            After
                          </p>
                          <p
                            style={{
                              margin: "0 0 14px",
                              lineHeight: 1.6,
                              fontWeight: 500
                            }}
                          >
                            {highlightBrackets(value.after)}
                          </p>
                          <button
                            type="button"
                            className="cp"
                            onClick={() => handleCopy(value.after, idx)}
                          >
                            {copiedIndex === idx ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {hasPlaceholders && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          lineHeight: 1.55,
                          color: "#3E5068",
                          maxWidth: "560px"
                        }}
                      >
                        Replace <mark className="ph">[brackets]</mark> with your
                        real number, or remove that part.
                      </p>
                    )}

                    <div
                      role="note"
                      style={{
                        margin: "28px 0 0",
                        background: "#FFF1B8",
                        border: "2px solid #10233A",
                        padding: "16px 20px",
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        fontWeight: 600,
                        lineHeight: 1.45
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        style={{ flex: "none" }}
                      >
                        <path
                          d="M12 2l11 20H1z"
                          fill="none"
                          stroke="#10233A"
                          strokeWidth="2.2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 9v6M12 18v1"
                          stroke="#10233A"
                          strokeWidth="2.2"
                        />
                      </svg>
                      AI suggestions can be wrong. Only add what is true for
                      you.
                    </div>
                  </div>
                </section>
              )}

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
                <div
                  style={{
                    flex: "0 0 min(100%, 280px)",
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start"
                  }}
                >
                  <span className="mark">D</span>
                  <div>
                    <h2
                      style={{
                        font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                        margin: "0 0 6px"
                      }}
                    >
                      Next step
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: 1.5,
                        color: "#3E5068"
                      }}
                    >
                      Use the same resume for a cover letter.
                    </p>
                  </div>
                </div>
                <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                  <Button
                    arrow
                    onClick={() => navigate(`/analysis/${id}/cover-letter`)}
                  >
                    Write a cover letter
                  </Button>
                </div>
              </section>
            </div>
          ) : aistatus === "failed" ? (
            <div className="st4">
              <div
                style={{
                  maxWidth: "620px",
                  margin: "24px auto 0",
                  border: "2px solid #B3261E",
                  background: "#fff",
                  padding: "40px clamp(22px, 4vw, 44px)",
                  textAlign: "center"
                }}
              >
                <svg
                  width="120"
                  height="48"
                  viewBox="0 0 120 48"
                  aria-hidden="true"
                  style={{ display: "block", margin: "0 auto 18px" }}
                >
                  <line
                    x1="4"
                    y1="24"
                    x2="48"
                    y2="24"
                    stroke="#B83A16"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <line
                    x1="72"
                    y1="24"
                    x2="116"
                    y2="24"
                    stroke="#B83A16"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <path
                    d="M54 14l12 20M66 14L54 34"
                    stroke="#B3261E"
                    strokeWidth="3.5"
                  />
                </svg>
                <h2
                  style={{
                    font: "800 34px/1.05 'Bricolage Grotesque', sans-serif",
                    margin: "0 0 12px"
                  }}
                >
                  Something went wrong
                </h2>
                <p
                  role="alert"
                  style={{
                    margin: "0 0 26px",
                    fontSize: "18px",
                    lineHeight: 1.55,
                    color: "#7A1A12",
                    fontWeight: 600
                  }}
                >
                  The AI could not respond right now.
                </p>
                <Button onClick={aisuggestion}>Try again</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
