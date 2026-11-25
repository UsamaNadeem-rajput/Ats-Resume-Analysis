import { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../context/ContextApi";
import {
  PageShell,
  Navbar,
  Button,
  Chip,
  ConfirmDialog,
  Skeleton
} from "../components";

const TONE_OPTIONS = [
  {
    value: "Professional",
    quote: "“I am writing to apply for the position at your company.”",
    example: "Formal, structured, and ideal for corporate or enterprise roles."
  },
  {
    value: "Friendly",
    quote: "“I was excited to see your opening and would love to tell you why I am a good fit.”",
    example: "Warm, approachable, and great for startups or collaborative teams."
  },
  {
    value: "Confident",
    quote: "“I build reliable systems, and I can bring that to your team.”",
    example: "Direct, impact-focused, and highlights leadership and results."
  }
];

export default function CoverLetter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name, user, logout } = useContext(Context);
  const displayName = name || user?.name || "User";

  const [initialLoading, setInitialLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [hasLetter, setHasLetter] = useState(false);
  const [savedLetter, setSavedLetter] = useState({
    companyName: "",
    hiringManager: "",
    location: "",
    tone: "Professional",
    content: "",
    createdAt: null,
    updatedAt: null
  });
  const [editForm, setEditForm] = useState({
    companyName: "",
    hiringManager: "",
    location: "",
    tone: "Professional",
    content: ""
  });
  const [analysisInfo, setAnalysisInfo] = useState(null);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [copied, setCopied] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenForm, setRegenForm] = useState({
    companyName: "",
    hiringManager: "",
    tone: "Professional"
  });

  const baseUrl = `http://localhost:5000/api/resume/analysis/${id}/cover-letter`;

  const mapLetterData = (doc) => ({
    companyName: doc?.companyName || "",
    hiringManager: doc?.hiringManager || "",
    location: doc?.location || "",
    tone: doc?.tone || "Professional",
    content: doc?.content || doc?.text || doc?.letter || "",
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null
  });

  const fetchPdfBlob = useCallback(async () => {
    try {
      const res = await axios.get(`${baseUrl}/pdf`, {
        responseType: "blob",
        withCredentials: true
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);

      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return objectUrl;
      });
    } catch (err) {
      console.error("PDF load error:", err.response?.data?.message || err.message);
    }
  }, [baseUrl]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analysis/single/doc/${id}`,
          { withCredentials: true }
        );
        if (res.data?.success && res.data?.analysis) {
          setAnalysisInfo(res.data.analysis);
        }
      } catch (err) {
        console.error("Failed to load analysis info:", err);
      }
    };
    fetchAnalysis();
  }, [id]);

  useEffect(() => {
    const fetchExistingLetter = async () => {
      try {
        const res = await axios.get(baseUrl, { withCredentials: true });
        const letterDoc = res.data?.coverLetter || res.data?.data;

        if (res.data?.success && letterDoc) {
          const mapped = mapLetterData(letterDoc);
          setSavedLetter(mapped);
          setEditForm(mapped);
          setHasLetter(true);
          await fetchPdfBlob();
        } else {
          setHasLetter(false);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setHasLetter(false);
        } else {
          console.error(err.response?.data?.message || err.message);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchExistingLetter();

    return () => {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [baseUrl, fetchPdfBlob]);

  const isDirty =
    hasLetter &&
    (editForm.content !== savedLetter.content ||
      editForm.companyName !== savedLetter.companyName ||
      editForm.hiringManager !== savedLetter.hiringManager ||
      editForm.location !== savedLetter.location);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleGenerate = async (payload, isRegenerate = false) => {
    setGenerating(true);
    setAiError(false);
    setStatusMsg("");

    try {
      const res = await axios.post(baseUrl, payload, { withCredentials: true });
      const letterDoc = res.data?.coverLetter || res.data?.data;

      if (res.data?.success && letterDoc) {
        const mapped = mapLetterData(letterDoc);
        setSavedLetter(mapped);
        setEditForm(mapped);
        setHasLetter(true);
        if (isRegenerate) setShowRegenModal(false);
        await fetchPdfBlob();
      } else {
        setAiError(true);
      }
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      setAiError(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isDirty || editForm.content.trim().length < 50) return;

    setSaving(true);
    setStatusMsg("");
    try {
      const res = await axios.put(
        baseUrl,
        {
          content: editForm.content,
          companyName: editForm.companyName,
          hiringManager: editForm.hiringManager,
          location: editForm.location
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        const updatedDoc = res.data?.coverLetter || res.data?.data || editForm;
        const mapped = mapLetterData(updatedDoc);
        setSavedLetter(mapped);
        setEditForm(mapped);
        setStatusMsg("Changes saved!");
        setTimeout(() => setStatusMsg(""), 3000);
        await fetchPdfBlob();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${editForm.companyName || "Cover"}-Letter.pdf`;
    link.click();
  };

  const handleOpenToPrint = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyText = async () => {
    if (!editForm.content || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(editForm.content);
    } catch {
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleBack = () => {
    if (isDirty) {
      setLeaveDialogOpen(true);
      return;
    }
    navigate(`/analysis/${id}`);
  };

  const openRegenerateModal = () => {
    setRegenForm({
      companyName: editForm.companyName,
      hiringManager: editForm.hiringManager,
      tone: editForm.tone || "Professional"
    });
    setShowRegenModal(true);
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
        console.error("Logout error:", err);
      }
    }
    navigate("/");
  };

  const score = analysisInfo?.score ?? 72;
  const jobTitle = analysisInfo?.jobTitle || "Backend Developer";

  let scoreChipVariant = "ok";
  let scoreMatchLabel = "Good match";
  if (score >= 70) {
    scoreChipVariant = "ok";
    scoreMatchLabel = "Good match";
  } else if (score >= 40) {
    scoreChipVariant = "fair";
    scoreMatchLabel = "Fair match";
  } else {
    scoreChipVariant = "bad";
    scoreMatchLabel = "Weak match";
  }

  const wordCount = editForm.content.trim()
    ? editForm.content.trim().split(/\s+/).length
    : 0;
  const isTooShort = editForm.content.trim().length < 50;

  const formattedDate = savedLetter.updatedAt || savedLetter.createdAt
    ? new Date(savedLetter.updatedAt || savedLetter.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

  const previewParagraphs = editForm.content
    ? editForm.content.split(/\n\s*\n/).filter(Boolean)
    : [];

  const tapeConfig = initialLoading
    ? { variant: "base", caption: "Measuring..." }
    : { variant: "score", value: score };

  if (initialLoading) {
    return (
      <PageShell tape={{ variant: "base", caption: "Measuring..." }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
          <Navbar
            isLoggedIn={true}
            activeKey=""
            user={{ name: displayName }}
            onLogout={handleLogout}
            maxWidth="1200px"
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

  return (
    <PageShell tape={tapeConfig}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
        <Navbar
          isLoggedIn={true}
          activeKey=""
          user={{ name: displayName }}
          onLogout={handleLogout}
          maxWidth="1200px"
        />

        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            fontWeight: 600,
            color: "#B83A16",
            textDecoration: "none",
            marginTop: "8px",
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            font: "inherit",
            fontSize: "16px"
          }}
        >
          ← Back to result
        </button>

        <p className="mono" style={{ margin: "12px 0 10px", color: "#3E5068" }}>
          Cover letter
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px 28px",
            alignItems: "center",
            margin: "0 0 36px"
          }}
        >
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(42px, 6vw, 88px)",
              lineHeight: 0.94,
              letterSpacing: "-.03em",
              margin: 0
            }}
          >
            {jobTitle}
            <span style={{ color: "#B83A16" }}>.</span>
          </h1>
          <Chip variant={scoreChipVariant} style={{ fontSize: "16px", padding: "8px 14px" }}>
            {score} / 100 · {scoreMatchLabel}
          </Chip>
        </div>

        {generating && !hasLetter ? (
          <div style={{ maxWidth: "760px", margin: "12px auto 0" }} aria-live="polite">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
              <span className="spin" />
              <div style={{ display: "grid", font: "800 26px 'Bricolage Grotesque', sans-serif" }}>
                <span className="act-3" style={{ gridArea: "1/1", animationDelay: "0s" }}>
                  Reading your resume...
                </span>
                <span className="act-3" style={{ gridArea: "1/1", animationDelay: "3s" }}>
                  Matching it to the job...
                </span>
                <span className="act-3" style={{ gridArea: "1/1", animationDelay: "6s" }}>
                  Writing your letter...
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 1000 6"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ width: "100%", height: "6px", display: "block", marginBottom: "26px" }}
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
                border: "2px solid #10233A",
                background: "#fff",
                padding: "36px",
                display: "grid",
                gap: "14px",
                marginBottom: "24px"
              }}
            >
              <div className="sk" style={{ height: "22px", width: "40%" }} />
              <div className="sk" style={{ height: "14px" }} />
              <div className="sk" style={{ height: "14px" }} />
              <div className="sk" style={{ height: "14px", width: "85%" }} />
              <div className="sk" style={{ height: "14px" }} />
              <div className="sk" style={{ height: "14px", width: "60%" }} />
            </div>

            <p style={{ margin: "0 0 20px", color: "#3E5068" }}>This takes 10 to 30 seconds.</p>
            <Button disabled={true}>Generate cover letter</Button>
          </div>
        ) : null}

        {!generating && !hasLetter && aiError ? (
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
              <line x1="4" y1="24" x2="48" y2="24" stroke="#B83A16" strokeWidth="3" strokeDasharray="6 5" />
              <line x1="72" y1="24" x2="116" y2="24" stroke="#B83A16" strokeWidth="3" strokeDasharray="6 5" />
              <path d="M54 14l12 20M66 14L54 34" stroke="#B3261E" strokeWidth="3.5" />
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
              The AI could not write the letter right now. Please try again.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => setAiError(false)}>
                Back to form
              </Button>
              <Button onClick={() => handleGenerate(editForm, false)}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {!generating && !hasLetter && !aiError ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate(editForm, false);
            }}
          >
            <section
              className="row"
              style={{
                borderTop: "3px dashed #10233A",
                padding: "28px 0 34px",
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
                    Who it is for
                  </h2>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                    All three are optional. Leave the manager empty and the letter starts with “Dear Hiring Manager”.
                  </p>
                </div>
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                <div style={{ maxWidth: "560px" }}>
                  <div style={{ marginBottom: "18px" }}>
                    <label htmlFor="co" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                      Company name <span style={{ fontWeight: 400, color: "#3E5068" }}>(optional)</span>
                    </label>
                    <input
                      id="co"
                      type="text"
                      maxLength={80}
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      placeholder="Northwind Systems"
                      aria-describedby="co-h"
                    />
                    <p id="co-h" style={{ margin: "6px 0 0", fontSize: "14px", color: "#3E5068" }}>
                      Up to 80 characters.
                    </p>
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label htmlFor="mg" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                      Hiring manager name <span style={{ fontWeight: 400, color: "#3E5068" }}>(optional)</span>
                    </label>
                    <input
                      id="mg"
                      type="text"
                      maxLength={60}
                      value={editForm.hiringManager}
                      onChange={(e) => setEditForm({ ...editForm, hiringManager: e.target.value })}
                      placeholder="Sara Khan"
                      aria-describedby="mg-h"
                    />
                    <p id="mg-h" style={{ margin: "6px 0 0", fontSize: "14px", color: "#3E5068" }}>
                      Up to 60 characters.
                    </p>
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label htmlFor="lc" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                      Your location <span style={{ fontWeight: 400, color: "#3E5068" }}>(optional)</span>
                    </label>
                    <input
                      id="lc"
                      type="text"
                      maxLength={80}
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Karachi, Pakistan"
                      aria-describedby="lc-h"
                    />
                    <p id="lc-h" style={{ margin: "6px 0 0", fontSize: "14px", color: "#3E5068" }}>
                      Shown in the header of the PDF.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="row"
              style={{
                borderTop: "3px dashed #10233A",
                padding: "28px 0 34px",
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
                    Tone
                  </h2>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                    Pick how the letter should sound.
                  </p>
                </div>
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                  <legend style={{ position: "absolute", left: "-9999px" }}>Tone</legend>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    {TONE_OPTIONS.map((t, idx) => {
                      const isSelected = editForm.tone === t.value;
                      return (
                        <div key={t.value}>
                          <input
                            className="sr"
                            type="radio"
                            name="tone"
                            id={`t${idx + 1}`}
                            checked={isSelected}
                            onChange={() => setEditForm({ ...editForm, tone: t.value })}
                          />
                          <label
                            htmlFor={`t${idx + 1}`}
                            className={`tone ${isSelected ? "selected" : ""}`}
                          >
                            <span className="dot" />
                            <span>
                              <b style={{ font: "800 22px/1.1 'Bricolage Grotesque', sans-serif", display: "block", marginBottom: "6px" }}>
                                {t.value}
                              </b>
                              <span style={{ fontSize: "15px", lineHeight: 1.5, color: "#3E5068" }}>
                                {t.quote}
                              </span>
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </section>

            <section
              className="row"
              style={{
                borderTop: "3px dashed #10233A",
                padding: "28px 0 34px",
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
                    Generate
                  </h2>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                    The letter is written in your voice and uses only facts from your resume. Read it before you send it.
                  </p>
                </div>
              </div>

              <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                <Button type="submit" arrow={true}>
                  Generate cover letter
                </Button>
                <p style={{ margin: "14px 0 0", fontSize: "15px", color: "#3E5068" }}>
                  This takes 10 to 30 seconds.
                </p>
              </div>
            </section>
          </form>
        ) : null}

        {hasLetter ? (
          <div className="paper">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                marginBottom: "12px"
              }}
            >
              <Button
                onClick={handleDownloadPdf}
                disabled={!pdfUrl}
              >
                Download PDF <span className="pin" aria-hidden="true">↓</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleOpenToPrint}
                disabled={!pdfUrl}
              >
                Open to print <span aria-hidden="true">↗</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopyText}
              >
                {copied ? "Copied" : "Copy text"}
              </Button>
              <Button
                variant="secondary"
                onClick={openRegenerateModal}
              >
                Regenerate
              </Button>
            </div>

            <p style={{ margin: "0 0 28px", fontSize: "15px", color: "#3E5068", fontWeight: 600 }}>
              This is a draft. Read it and keep only what is true.
            </p>

            {aiError && (
              <div
                style={{
                  border: "2px solid #B3261E",
                  background: "#FCE9E7",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <span style={{ fontSize: "15px", color: "#7A1A12", fontWeight: 600 }}>
                  The AI could not write the letter right now. Please try again.
                </span>
                <Button variant="danger" onClick={() => handleGenerate(regenForm, true)} disabled={generating}>
                  {generating ? "Retrying..." : "Try again"}
                </Button>
              </div>
            )}

            <div className="tabs seg" role="group" aria-label="Show">
              <button
                type="button"
                className={activeTab === "edit" ? "active" : ""}
                onClick={() => setActiveTab("edit")}
              >
                Edit
              </button>
              <button
                type="button"
                className={activeTab === "preview" ? "active" : ""}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
            </div>

            <div className="panes">
              <div className={`pane-edit ${activeTab === "preview" ? "tab-hidden" : ""}`}>
                <p className="mono" style={{ margin: "0 0 12px", color: "#3E5068" }}>
                  Edit
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px"
                  }}
                >
                  <div>
                    <label htmlFor="e1" style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                      Company
                    </label>
                    <input
                      id="e1"
                      type="text"
                      maxLength={80}
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="e2" style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                      Hiring manager
                    </label>
                    <input
                      id="e2"
                      type="text"
                      maxLength={60}
                      value={editForm.hiringManager}
                      onChange={(e) => setEditForm({ ...editForm, hiringManager: e.target.value })}
                      className="sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="e3" style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                      Location
                    </label>
                    <input
                      id="e3"
                      type="text"
                      maxLength={80}
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="sm"
                    />
                  </div>
                </div>

                <label htmlFor="lt" style={{ position: "absolute", left: "-9999px" }}>
                  Cover letter text
                </label>
                <textarea
                  id="lt"
                  className="cover-letter-textarea"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                />

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "10px"
                  }}
                >
                  <span id="wc" style={{ font: "500 14px 'DM Mono', monospace", color: "#3E5068" }}>
                    {wordCount} words
                  </span>
                  <span
                    id="um"
                    aria-live="polite"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isDirty ? "#7A5200" : "#1F7A4D"
                    }}
                  >
                    {isDirty ? "You have unsaved changes" : (statusMsg || "")}
                  </span>
                </div>

                {isTooShort && (
                  <p id="le" role="alert" style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "#B3261E" }}>
                    ✕ The letter is too short. Write at least 50 characters.
                  </p>
                )}

                <Button
                  id="sv"
                  type="button"
                  style={{ marginTop: "16px" }}
                  disabled={!isDirty || isTooShort || saving}
                  onClick={handleSaveChanges}
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>

              <div className={`pane-prev ${activeTab === "preview" ? "tab-active" : ""}`}>
                <p className="mono" style={{ margin: "0 0 12px", color: "#3E5068" }}>
                  Preview · A4 PDF
                </p>

                <div className="a4-preview-container">
                  <div
                    role="img"
                    aria-label="Preview of the cover letter as an A4 page"
                    className="a4-page"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        borderBottom: ".4cqw solid #B83A16",
                        paddingBottom: "3cqw",
                        marginBottom: "4cqw"
                      }}
                    >
                      <b style={{ font: "800 5cqw 'Bricolage Grotesque', sans-serif" }}>
                        {displayName}
                      </b>
                      <span style={{ textAlign: "right", color: "#3E5068" }}>
                        {editForm.location || "Karachi, Pakistan"}
                        <br />
                        {formattedDate}
                      </span>
                    </div>

                    {editForm.companyName && (
                      <p style={{ margin: "0 0 3cqw", color: "#3E5068" }}>
                        {editForm.companyName}
                      </p>
                    )}

                    {previewParagraphs.length > 0 ? (
                      previewParagraphs.map((para, pIdx) => (
                        <p key={pIdx} style={{ margin: "0 0 1.1em", whiteSpace: "pre-line" }}>
                          {para}
                        </p>
                      ))
                    ) : (
                      <p style={{ margin: "0 0 1.1em", color: "#5A6B80" }}>
                        Dear {editForm.hiringManager || "Hiring Manager"},<br /><br />
                        Your cover letter will appear here...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showRegenModal && (
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(16, 35, 58, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: "16px",
              overflowY: "auto"
            }}
            onClick={() => setShowRegenModal(false)}
          >
            <div
              role="dialog"
              aria-label="Regenerate cover letter"
              style={{
                maxWidth: "560px",
                width: "100%",
                margin: "12px auto 0",
                border: "2px solid #10233A",
                background: "#fff",
                padding: "30px clamp(20px, 4vw, 34px)",
                boxShadow: "8px 8px 0 #10233A",
                boxSizing: "border-box"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  font: "800 32px/1.05 'Bricolage Grotesque', sans-serif",
                  margin: "0 0 20px"
                }}
              >
                Regenerate cover letter
              </h2>

              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="dc" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                  Company name <span style={{ fontWeight: 400, color: "#3E5068" }}>(optional)</span>
                </label>
                <input
                  id="dc"
                  type="text"
                  maxLength={80}
                  value={regenForm.companyName}
                  onChange={(e) => setRegenForm({ ...regenForm, companyName: e.target.value })}
                  placeholder="Northwind Systems"
                  aria-describedby="dc-h"
                />
                <p id="dc-h" style={{ margin: "6px 0 0", fontSize: "14px", color: "#3E5068" }}>
                  Up to 80 characters.
                </p>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="dm" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                  Hiring manager name <span style={{ fontWeight: 400, color: "#3E5068" }}>(optional)</span>
                </label>
                <input
                  id="dm"
                  type="text"
                  maxLength={60}
                  value={regenForm.hiringManager}
                  onChange={(e) => setRegenForm({ ...regenForm, hiringManager: e.target.value })}
                  placeholder="Sara Khan"
                  aria-describedby="dm-h"
                />
                <p id="dm-h" style={{ margin: "6px 0 0", fontSize: "14px", color: "#3E5068" }}>
                  Up to 60 characters.
                </p>
              </div>

              <p className="mono" style={{ margin: "0 0 10px", color: "#3E5068" }}>
                Tone
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "22px" }} className="seg">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={regenForm.tone === t.value ? "active" : ""}
                    onClick={() => setRegenForm({ ...regenForm, tone: t.value })}
                  >
                    {t.value}
                  </button>
                ))}
              </div>

              <p
                style={{
                  margin: "0 0 22px",
                  padding: "12px 14px",
                  background: "#FFF1B8",
                  border: "2px solid #10233A",
                  fontWeight: 600,
                  lineHeight: 1.45
                }}
              >
                This replaces your current text, including your edits.
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => setShowRegenModal(false)} disabled={generating}>
                  Cancel
                </Button>
                <Button onClick={() => handleGenerate(regenForm, true)} disabled={generating}>
                  {generating ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={leaveDialogOpen}
          title="Unsaved changes"
          message="You have unsaved changes. Are you sure you want to leave?"
          confirmLabel="Leave"
          cancelLabel="Keep editing"
          isDestructive={false}
          onConfirm={() => {
            setLeaveDialogOpen(false);
            navigate(`/analysis/${id}`);
          }}
          onCancel={() => setLeaveDialogOpen(false)}
        />
      </div>
    </PageShell>
  );
}
