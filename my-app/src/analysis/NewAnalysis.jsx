import { useRef, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../context/ContextApi";
import { PageShell, Navbar, Button } from "../components";

export default function NewAnalysis() {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [data, setdata] = useState({
    jobTitle: "",
    jobDescription: "",
  });
  const [error, seterror] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { name, user, logout } = useContext(Context);
  const displayName = name || user?.name || "User";

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

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    setFileError("");
    seterror("");

    const isPdf =
      selectedFile.type === "application/pdf" || /\.pdf$/i.test(selectedFile.name);
    if (!isPdf) {
      setFileError("✕ Only PDF files are accepted.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("✕ This file is larger than 5 MB.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    return bytes < 1048576
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleBrowse = (e) => {
    const chosen = e.target?.files?.[0];
    if (chosen) {
      validateAndSetFile(chosen);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setFileError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isResumeValid = Boolean(file && !fileError);
  const isJobTitleValid = Boolean(data.jobTitle.trim());
  const jdLength = data.jobDescription.length;
  const isJobDescValid = jdLength >= 100 && jdLength <= 8000;
  const badDesc = jdLength > 0 && jdLength < 100;

  const measurementsDone =
    (isResumeValid ? 1 : 0) +
    (isJobTitleValid ? 1 : 0) +
    (isJobDescValid ? 1 : 0);

  const handlesubmit = async (e) => {
    e.preventDefault();
    if (measurementsDone < 3 || loading) return;

    setLoading(true);
    seterror("");

    const formdata = new FormData();
    formdata.append("resume", file);
    formdata.append("jobTitle", data.jobTitle);
    formdata.append("jobDescription", data.jobDescription);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/resume/analysis",
        formdata,
        {
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        const setanalysisid = res.data.analysis.id;
        navigate(`/analysis/${setanalysisid}`);
      }
    } catch (err) {
      console.log(err);
      console.log(err.response?.data?.message);
      seterror(
        err.response?.data?.message ||
          "We could not read text from this PDF. Please upload a text-based PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      tape={
        loading
          ? {
              variant: "base",
              caption: "Measuring...",
              maxWidth: "1100px",
            }
          : {
              variant: "progress",
              total: 3,
              done: measurementsDone,
              caption: `${measurementsDone} of 3 measurements`,
              maxWidth: "1100px",
            }
      }
      style={{
        minHeight: "1900px",
        background: "#E9EEF2",
        color: "#10233A",
        fontFamily: "'Figtree', system-ui, sans-serif",
      }}
      data-canvas-width="1440"
      data-canvas-height="1900"
      data-document-role="page"
      data-label="B — New analysis copy"
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 56px) 64px",
        }}
      >
        <Navbar
          isLoggedIn={true}
          activeKey="analysis"
          user={{ name: displayName }}
          onLogout={handleLogout}
          maxWidth="1100px"
        />

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(46px, 7vw, 100px)",
            lineHeight: 0.92,
            letterSpacing: "-.03em",
            margin: "28px 0 18px",
          }}
        >
          New analysis<span style={{ color: "#B83A16" }}>.</span>
        </h1>
        <p
          style={{
            fontSize: "19px",
            lineHeight: 1.6,
            color: "#3E5068",
            maxWidth: "560px",
            margin: "0 0 40px",
          }}
        >
          Add your resume and one job description. You get a score in a few seconds.
        </p>

        <form onSubmit={handlesubmit} noValidate>
          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "28px 0 32px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
            }}
          >
            <div
              style={{
                flex: "0 0 min(100%, 280px)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  width: "44px",
                  height: "44px",
                  border: "2px solid #B83A16",
                  borderRadius: "50%",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "500 16px 'DM Mono', monospace",
                  color: "#B83A16",
                }}
              >
                A
              </span>
              <div>
                <p
                  id="rl"
                  style={{
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    margin: "0 0 6px",
                  }}
                >
                  Resume
                </p>
                <p
                  id="rh"
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#3E5068",
                  }}
                >
                  Text-based PDFs only. Scanned images do not work.
                </p>
              </div>
            </div>

            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              {!file ? (
                isDragging ? (
                  <div
                    style={{
                      border: "3px solid #B83A16",
                      background: "#FFE9E1",
                      padding: "26px 16px",
                      textAlign: "center",
                      font: "800 20px 'Bricolage Grotesque', sans-serif",
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    Drop to upload
                  </div>
                ) : (
                  <div
                    id="dz"
                    className="dz"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      id="fi"
                      ref={inputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      aria-labelledby="rl"
                      aria-describedby="rh ue"
                      onChange={handleBrowse}
                    />
                    <svg
                      className="bob"
                      width="56"
                      height="56"
                      viewBox="0 0 56 56"
                      aria-hidden="true"
                      style={{ display: "block", margin: "0 auto 14px" }}
                    >
                      <path
                        d="M28 40V12M16 24l12-12 12 12"
                        fill="none"
                        stroke="#B83A16"
                        strokeWidth="3.5"
                        strokeLinecap="square"
                      />
                      <path
                        d="M8 44v6h40v-6"
                        fill="none"
                        stroke="#10233A"
                        strokeWidth="3"
                        strokeDasharray="6 5"
                      />
                    </svg>
                    <p
                      style={{
                        margin: "0 0 6px",
                        font: "800 24px 'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      Drag and drop your resume here
                    </p>
                    <p
                      style={{
                        margin: "0 0 18px",
                        color: "#3E5068",
                        fontSize: "15px",
                      }}
                    >
                      PDF only, up to 5 MB
                    </p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "44px",
                        padding: "0 24px",
                        border: "2px solid #10233A",
                        background: "#fff",
                        fontWeight: 600,
                        fontSize: "16px",
                      }}
                    >
                      Browse files
                    </span>
                  </div>
                )
              ) : (
                <div
                  id="fl"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    border: "2px solid #10233A",
                    background: "#F6F8FA",
                    padding: "16px 18px",
                  }}
                >
                  <svg
                    width="32"
                    height="40"
                    viewBox="0 0 32 40"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 2h18l10 10v26H2z"
                      fill="#fff"
                      stroke="#10233A"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 2v10h10"
                      fill="none"
                      stroke="#10233A"
                      strokeWidth="2"
                    />
                    <rect x="7" y="20" width="16" height="3" fill="#C5CFDA" />
                    <rect x="7" y="27" width="12" height="3" fill="#C5CFDA" />
                  </svg>
                  <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                    <p
                      id="fn"
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: "17px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </p>
                    <p
                      id="fs"
                      style={{
                        margin: "2px 0 0",
                        fontSize: "14px",
                        color: "#3E5068",
                      }}
                    >
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    aria-label="Remove file"
                    style={{
                      minHeight: "44px",
                      minWidth: "44px",
                      border: "2px solid #10233A",
                      background: "#fff",
                      font: "600 16px Figtree, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {fileError && (
                <p
                  id="ue"
                  className="err"
                  role="alert"
                  style={{
                    display: "block",
                    margin: "10px 0 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#B3261E",
                  }}
                >
                  {fileError}
                </p>
              )}

              {error && (
                <div
                  role="alert"
                  style={{
                    marginTop: "12px",
                    border: "2px solid #B3261E",
                    background: "#FCE9E7",
                    padding: "12px 14px",
                    fontWeight: 600,
                    color: "#7A1A12",
                    lineHeight: 1.45,
                  }}
                >
                  {error}
                </div>
              )}

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "14px",
                  color: "#3E5068",
                }}
              >
                Uploading the same resume again is fine. It is stored once.
              </p>
            </div>
          </div>

          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "28px 0 32px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: ".08s",
            }}
          >
            <div
              style={{
                flex: "0 0 min(100%, 280px)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  width: "44px",
                  height: "44px",
                  border: "2px solid #B83A16",
                  borderRadius: "50%",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "500 16px 'DM Mono', monospace",
                  color: "#B83A16",
                }}
              >
                B
              </span>
              <div>
                <label
                  htmlFor="jt"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px",
                  }}
                >
                  Job title
                </label>
                <p
                  id="jth"
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#3E5068",
                  }}
                >
                  The role you are applying for.
                </p>
              </div>
            </div>

            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <input
                id="jt"
                name="jobTitle"
                type="text"
                maxLength={100}
                placeholder="For example, Backend Developer"
                aria-describedby="jth tc"
                value={data.jobTitle}
                onChange={(e) => setdata({ ...data, jobTitle: e.target.value })}
              />
              <p
                id="tc"
                style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  color: "#3E5068",
                  textAlign: "right",
                }}
              >
                {data.jobTitle.length} / 100
              </p>
            </div>
          </div>

          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "28px 0 32px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: ".16s",
            }}
          >
            <div
              style={{
                flex: "0 0 min(100%, 280px)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  width: "44px",
                  height: "44px",
                  border: "2px solid #B83A16",
                  borderRadius: "50%",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "500 16px 'DM Mono', monospace",
                  color: "#B83A16",
                }}
              >
                C
              </span>
              <div>
                <label
                  htmlFor="jd"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px",
                  }}
                >
                  Job description
                </label>
                <p
                  id="jdh"
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#3E5068",
                  }}
                >
                  At least 100 characters. Paste the full description for a better match.
                </p>
              </div>
            </div>

            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <textarea
                id="jd"
                name="jobDescription"
                maxLength={8000}
                placeholder="Paste the job description here"
                aria-describedby="jdh jc"
                value={data.jobDescription}
                onChange={(e) =>
                  setdata({ ...data, jobDescription: e.target.value })
                }
              />
              <p
                id="jc"
                aria-live="polite"
                style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: badDesc ? "#B3261E" : "#3E5068",
                  textAlign: "right",
                }}
              >
                {(badDesc ? "✕ " : "") +
                  jdLength.toLocaleString("en-US") +
                  " / 8,000" +
                  (badDesc ? " · at least 100 needed" : "")}
              </p>
            </div>
          </div>

          <svg
            viewBox="0 0 1000 6"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ width: "100%", height: "6px", display: "block" }}
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
            className="row"
            style={{
              paddingTop: "32px",
              display: "flex",
              flexWrap: "wrap",
              gap: "20px 40px",
              alignItems: "center",
              animationDelay: ".24s",
            }}
          >
            <Button
              id="go"
              type="submit"
              disabled={measurementsDone < 3}
              loading={loading}
              style={{
                minHeight: "58px",
                padding: "0 36px",
                fontSize: "18px",
                gap: "12px",
              }}
            >
              {loading ? (
                "Analyzing…"
              ) : (
                <>
                  Analyze <span aria-hidden="true">→</span>
                </>
              )}
            </Button>

            {loading ? (
              <div
                aria-live="polite"
                style={{
                  display: "grid",
                  gap: "6px",
                  font: "600 17px Figtree, sans-serif",
                }}
              >
                <span className="act" style={{ animationDelay: "0s" }}>
                  Reading your resume...
                </span>
                <span className="act" style={{ animationDelay: "2s" }}>
                  Matching skills...
                </span>
                <span className="act" style={{ animationDelay: "4s" }}>
                  Calculating score...
                </span>
              </div>
            ) : (
              <span style={{ fontSize: "15px", color: "#3E5068" }}>
                The button turns on when all three are filled correctly. It takes 1 to 3 seconds.
              </span>
            )}
          </div>
        </form>
      </div>
    </PageShell>
  );
}
