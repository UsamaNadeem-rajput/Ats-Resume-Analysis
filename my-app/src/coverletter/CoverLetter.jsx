import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TONE_OPTIONS = [
  {
    value: "Professional",
    example: "Formal, structured, and ideal for corporate or enterprise roles.",
  },
  {
    value: "Friendly",
    example: "Warm, approachable, and great for startups or collaborative teams.",
  },
  {
    value: "Confident",
    example: "Direct, impact-focused, and highlights leadership and results.",
  },
];

export default function CoverLetter() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Page & Request States
  const [initialLoading, setInitialLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Letter Existence & Data States
  const [hasLetter, setHasLetter] = useState(false);
  const [savedLetter, setSavedLetter] = useState({
    companyName: "",
    hiringManager: "",
    location: "",
    tone: "Professional",
    content: "",
  });
  const [editForm, setEditForm] = useState({
    companyName: "",
    hiringManager: "",
    location: "",
    tone: "Professional",
    content: "",
  });

  // PDF Preview & UI States
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit"); // Mobile tabs: 'edit' | 'preview'
  const [copied, setCopied] = useState(false);

  // Regenerate Modal States
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenForm, setRegenForm] = useState({
    companyName: "",
    hiringManager: "",
    tone: "Professional",
  });

  const baseUrl = `http://localhost:5000/api/resume/analysis/${id}/cover-letter`;

  // Helper: Backend object se fields safely nikalna
  const mapLetterData = (doc) => ({
    companyName: doc?.companyName || "",
    hiringManager: doc?.hiringManager || "",
    location: doc?.location || "",
    tone: doc?.tone || "Professional",
    content: doc?.content || doc?.text || doc?.letter || "",
  });

  // 1. PDF Blob Fetch Function (Preview, Download aur Print teeno ke liye)
  const fetchPdfBlob = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/pdf`, {
        responseType: "blob",
        withCredentials: true,
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);

      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl); // Purana memory leak saaf karein
        return objectUrl;
      });
    } catch (err) {
      console.error("PDF load error:", err.response?.data?.message || err.message);
    } finally {
      setPdfLoading(false);
    }
  }, [baseUrl]);

  // 2. Page Khulte Hi Check Karein: Kya Cover Letter Pehle Se Bana Hua Hai?
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
        // 404 ka matlab letter abhi nahi bana -> Form dikhayein
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

    // Cleanup blob URL on unmount
    return () => {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [baseUrl, fetchPdfBlob]);

  // 3. Unsaved Changes Check (isDirty)
  const isDirty =
    hasLetter &&
    (editForm.content !== savedLetter.content ||
      editForm.companyName !== savedLetter.companyName ||
      editForm.hiringManager !== savedLetter.hiringManager ||
      editForm.location !== savedLetter.location);

  // Browser tab close/refresh warning jab unsaved changes hon
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 4. POST: Generate First Time OR Regenerate
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

  // 5. PUT: Save User's Manual Edits
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
          location: editForm.location,
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
        await fetchPdfBlob(); // Naye text/header ke sath PDF update karein
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // 6. Top Bar Actions (Download, Print, Copy, Back)
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
    await navigator.clipboard.writeText(editForm.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    navigate(`/analysis/${id}`);
  };

  const openRegenerateModal = () => {
    setRegenForm({
      companyName: editForm.companyName,
      hiringManager: editForm.hiringManager,
      tone: editForm.tone || "Professional",
    });
    setShowRegenModal(true);
  };

  // Word Count & Validation
  const wordCount = editForm.content.trim()
    ? editForm.content.trim().split(/\s+/).length
    : 0;
  const isTooShort = editForm.content.trim().length < 50;

  if (initialLoading) return <p className="p-6">Loading cover letter...</p>;

  // ── PEHLI HALAT: Letter Abhi Nahi Bana (Creation Form) ─────────────────────
  if (!hasLetter) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <button type="button" onClick={handleBack} className="text-sm text-gray-600">
          &larr; Back to result
        </button>

        <h1 className="text-2xl font-bold">Write a Cover Letter</h1>

        {/* AI Error State */}
        {aiError && (
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg space-y-2">
            <p className="text-red-700 font-medium">
              The AI could not write the letter right now. Please try again.
            </p>
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerate(editForm, false)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded"
            >
              Try again
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate(editForm, false);
          }}
          className="space-y-4"
        >
          {/* Company Name (max 80) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Company name (optional)
            </label>
            <input
              type="text"
              maxLength={80}
              value={editForm.companyName}
              onChange={(e) =>
                setEditForm({ ...editForm, companyName: e.target.value })
              }
              placeholder="e.g. Systems Limited"
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          {/* Hiring Manager Name (max 60) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Hiring manager name (optional)
            </label>
            <input
              type="text"
              maxLength={60}
              value={editForm.hiringManager}
              onChange={(e) =>
                setEditForm({ ...editForm, hiringManager: e.target.value })
              }
              placeholder="Leave blank for 'Dear Hiring Manager'"
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Your location (optional)
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
              placeholder="e.g. Karachi, Pakistan"
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          {/* Tone Selection (3 Cards) */}
          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, tone: t.value })}
                  className={`p-3 border rounded-lg text-left ${
                    editForm.tone === t.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="font-semibold text-sm">{t.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{t.example}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            The letter is written in your voice and uses only facts from your resume.
            Read it before you send it.
          </p>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {generating
              ? "Writing your cover letter (takes 10–30 seconds)..."
              : "Generate cover letter"}
          </button>
        </form>
      </div>
    );
  }

  // ── DOOSRI HALAT: Letter Bana Hua Hai (Split View: Edit + PDF Preview) ─────
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="text-sm text-gray-600">
            &larr; Back to result
          </button>
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium">
              • You have unsaved changes
            </span>
          )}
          {statusMsg && (
            <span className="text-xs text-green-600 font-medium">{statusMsg}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!pdfUrl}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleOpenToPrint}
            disabled={!pdfUrl}
            className="px-3 py-2 border text-sm font-medium rounded-lg disabled:opacity-50"
          >
            Open to print
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 border text-sm font-medium rounded-lg"
          >
            {copied ? "Copied!" : "Copy text"}
          </button>
          <button
            type="button"
            onClick={openRegenerateModal}
            className="px-3 py-2 border text-sm font-medium rounded-lg text-gray-700"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* AI Error Banner (agar regenerate fail ho) */}
      {aiError && (
        <div className="p-3 border border-red-300 bg-red-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">
            The AI could not write the letter right now. Please try again.
          </span>
          <button
            type="button"
            onClick={() => handleGenerate(regenForm, true)}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded"
          >
            Try again
          </button>
        </div>
      )}

      {/* Mobile Tabs Switcher (Bari screen par hidden) */}
      <div className="flex lg:hidden border-b">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "edit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "preview" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
          }`}
        >
          Preview PDF
        </button>
      </div>

      {/* Main Content: Side-by-Side on Desktop, Tabs on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Edit Panel */}
        <div className={`${activeTab === "edit" ? "block" : "hidden"} lg:block space-y-4`}>
          {/* Header Fields (badalne par PDF header badalta hai) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <input
                type="text"
                maxLength={80}
                value={editForm.companyName}
                onChange={(e) =>
                  setEditForm({ ...editForm, companyName: e.target.value })
                }
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hiring manager</label>
              <input
                type="text"
                maxLength={60}
                value={editForm.hiringManager}
                onChange={(e) =>
                  setEditForm({ ...editForm, hiringManager: e.target.value })
                }
                placeholder="Dear Hiring Manager"
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                className="w-full border rounded p-2 text-sm"
              />
            </div>
          </div>

          {/* Letter Textarea */}
          <div>
            <textarea
              rows={18}
              value={editForm.content}
              onChange={(e) =>
                setEditForm({ ...editForm, content: e.target.value })
              }
              className="w-full border rounded-lg p-3 text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>{wordCount} words</span>
              {isTooShort && (
                <span className="text-red-600">
                  Minimum 50 characters required to save.
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded">
            This is a draft. Read it and keep only what is true.
          </p>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!isDirty || isTooShort || saving}
            className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* RIGHT: A4 PDF Preview Frame */}
        <div className={`${activeTab === "preview" ? "block" : "hidden"} lg:block`}>
          <div className="border rounded-lg bg-gray-100 p-3 flex flex-col items-center">
            {pdfLoading ? (
              <div className="h-150 flex items-center justify-center text-sm text-gray-500">
                Rendering PDF preview...
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                title="Cover Letter PDF Preview"
                className="w-full aspect-[1/1.414] bg-white shadow rounded border"
              />
            ) : (
              <div className="h-150 flex items-center justify-center text-sm text-gray-500">
                PDF preview unavailable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regenerate Dialog Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold">Regenerate Cover Letter</h2>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded">
              This replaces your current text, including your edits.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Company name</label>
                <input
                  type="text"
                  maxLength={80}
                  value={regenForm.companyName}
                  onChange={(e) =>
                    setRegenForm({ ...regenForm, companyName: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Hiring manager</label>
                <input
                  type="text"
                  maxLength={60}
                  value={regenForm.hiringManager}
                  onChange={(e) =>
                    setRegenForm({ ...regenForm, hiringManager: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Tone</label>
                <select
                  value={regenForm.tone}
                  onChange={(e) =>
                    setRegenForm({ ...regenForm, tone: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={generating}
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate(regenForm, true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}