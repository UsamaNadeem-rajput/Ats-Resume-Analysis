import { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../context/ContextApi";
import { PageShell, Navbar, Button } from "../components";

export default function Register() {
  const [data, setdata] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [thepassword, setthepassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, seterror] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const context = useContext(Context);
  const setname = context?.setname;
  const setUser = context?.setUser;

  const handlesubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    seterror("");
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: thepassword
      };
      const res = await axios.post("http://localhost:5000/api/auth/register", payload, {
        withCredentials: true
      });
      if (res.data.success) {
        console.log("created");
        seterror("");
        if (setUser && res.data?.user) {
          setUser(res.data.user);
        }
        if (setname && res.data?.user?.name) {
          setname(res.data.user.name);
        }
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      seterror(msg);
      console.log(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        { idToken },
        { withCredentials: true }
      );
      if (res.data?.success) {
        console.log(res.data?.message);
        seterror("");
        if (setUser && res.data?.user) {
          setUser(res.data.user);
        }
        if (setname && res.data?.user?.name) {
          setname(res.data.user.name);
        }
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Google registration failed";
      seterror(msg);
      console.error(msg);
    }
  };

  const handleGoogleError = () => {
    console.log("Google login cancel ya fail hua");
  };

  const handleGoogleClick = () => {
    const googleBtn =
      document.querySelector('div[role="button"][id*="credential"]') ||
      document.querySelector(".nsm7Bb-HzV7m-LgbsSe");
    if (googleBtn) {
      googleBtn.click();
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handlepassword = (value) => {
    const currentvalue = value;
    if (thepassword === currentvalue) {
      setdata((prev) => ({ ...prev, password: thepassword }));
      seterror("");
    } else {
      seterror("password is not matched");
    }
  };

  const trimmedName = data.name.trim();
  const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email);
  const okPassword = thepassword.length >= 8;
  const okConfirm = Boolean(confirmPassword && confirmPassword === thepassword);

  const measurementsDone =
    (trimmedName ? 1 : 0) +
    (okEmail ? 1 : 0) +
    (okPassword ? 1 : 0) +
    (okConfirm ? 1 : 0);

  const isFormValid = measurementsDone === 4;

  const passwordStrength =
    (thepassword.length >= 8 ? 1 : 0) +
    (/[a-z]/.test(thepassword) && /[A-Z]/.test(thepassword) ? 1 : 0) +
    (/\d/.test(thepassword) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(thepassword) || thepassword.length >= 12 ? 1 : 0);

  const strengthColor =
    passwordStrength <= 1 ? "#B3261E" : passwordStrength === 2 ? "#9A4A06" : "#1F7A4D";
  const strengthText = !thepassword
    ? ""
    : passwordStrength <= 1
    ? "Weak"
    : passwordStrength === 2
    ? "Fair"
    : "Strong";

  const sgColors = [0, 1, 2, 3].map((i) =>
    thepassword && i < Math.max(passwordStrength, 1) ? strengthColor : "#C5CFDA"
  );

  const confirmMismatch = Boolean(confirmPassword && confirmPassword !== thepassword);

  const isEmailError =
    error &&
    (error.toLowerCase().includes("email") ||
      error.toLowerCase().includes("already registered") ||
      error.toLowerCase().includes("already exists"));

  const isGeneralError = error && !isEmailError && error !== "password is not matched";

  return (
    <PageShell
      tape={{
        variant: "progress",
        total: 4,
        done: measurementsDone,
        caption: `${measurementsDone} of 4 measurements`
      }}
      style={{
        minHeight: "1700px"
      }}
      data-canvas-width="1440"
      data-canvas-height="1700"
      data-document-role="page"
      data-label="B — Register (Worksheet) copy"
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
        <Navbar
          variant="auth"
          maxWidth="100%"
          authAction={{ prompt: "Already have an account?", linkText: "Log in", href: "/login" }}
        />

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(46px, 7vw, 104px)",
            lineHeight: 0.92,
            letterSpacing: "-0.03em",
            margin: "24px 0 20px",
            maxWidth: "900px"
          }}
        >
          Create your account<span style={{ color: "#B83A16" }}>.</span>
        </h1>

        <p style={{ fontSize: "19px", lineHeight: 1.6, color: "#3E5068", maxWidth: "560px", margin: "0 0 36px" }}>
          Four measurements and you are in. You land on your dashboard right away.
        </p>

        <div style={{ maxWidth: "560px", position: "relative" }}>
          <button type="button" className="gbtn row" onClick={handleGoogleClick}>
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="10" fill="none" stroke="#10233A" strokeWidth="2" />
              <text x="11" y="15.5" textAnchor="middle" fontFamily="Figtree, sans-serif" fontWeight="800" fontSize="13" fill="#10233A">
                G
              </text>
            </svg>
            Continue with Google
          </button>
          <div style={{ position: "absolute", opacity: 0.0001, pointerEvents: "none", height: 0, overflow: "hidden" }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          </div>
        </div>

        <div
          className="row"
          style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0", animationDelay: ".1s" }}
          aria-hidden="true"
        >
          <span style={{ flex: 1, borderTop: "3px dashed #10233A" }} />
          <span className="mono" style={{ color: "#3E5068" }}>or</span>
          <span style={{ flex: 1, borderTop: "3px dashed #10233A" }} />
        </div>

        {isGeneralError && (
          <div
            role="alert"
            style={{
              border: "2px solid #B3261E",
              background: "#FCE9E7",
              padding: "14px 16px",
              fontWeight: 600,
              color: "#7A1A12",
              lineHeight: 1.45,
              marginBottom: "24px"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handlesubmit} noValidate>
          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "26px 0 30px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: "0.12s"
            }}
          >
            <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
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
                  color: "#B83A16"
                }}
              >
                A
              </span>
              <div>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px"
                  }}
                >
                  Full name
                </label>
                <p id="name-h" style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                  Use the name you want on your cover letters.
                </p>
              </div>
            </div>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                aria-describedby="name-h"
                value={data.name}
                onChange={(e) => setdata((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>

          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "26px 0 30px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: "0.16s"
            }}
          >
            <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
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
                  color: "#B83A16"
                }}
              >
                B
              </span>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px"
                  }}
                >
                  Email
                </label>
                <p id="email-h" style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                  One account per email address.
                </p>
              </div>
            </div>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-describedby="email-h"
                value={data.email}
                style={isEmailError ? { borderColor: "#B3261E" } : {}}
                onChange={(e) => {
                  setdata((prev) => ({ ...prev, email: e.target.value }));
                  if (error) seterror("");
                }}
              />
              {isEmailError && (
                <p className="err" role="alert" style={{ display: "block" }}>
                  ✕ {error.toLowerCase().includes("already registered") ? "This email is already registered." : error}
                </p>
              )}
            </div>
          </div>

          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "26px 0 30px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: "0.2s"
            }}
          >
            <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
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
                  color: "#B83A16"
                }}
              >
                C
              </span>
              <div>
                <label
                  htmlFor="pw"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px"
                  }}
                >
                  Password
                </label>
                <p id="pw-h" style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                  At least 8 characters. Mix upper and lower case, a number and a symbol for a stronger one.
                </p>
              </div>
            </div>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div style={{ position: "relative" }}>
                <input
                  id="pw"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  aria-describedby="pw-h"
                  style={{ paddingRight: "96px" }}
                  value={thepassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setthepassword(val);
                    if (confirmPassword && confirmPassword === val) {
                      setdata((prev) => ({ ...prev, password: val }));
                      seterror("");
                    } else if (confirmPassword && confirmPassword !== val) {
                      seterror("password is not matched");
                    }
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label="Show or hide password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "7px",
                    height: "44px",
                    minWidth: "72px",
                    border: 0,
                    background: "transparent",
                    color: "#B83A16",
                    font: "600 16px 'Figtree', sans-serif",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div aria-hidden="true" style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                <span id="sg0" style={{ flex: 1, height: "6px", background: sgColors[0] }} />
                <span id="sg1" style={{ flex: 1, height: "6px", background: sgColors[1] }} />
                <span id="sg2" style={{ flex: 1, height: "6px", background: sgColors[2] }} />
                <span id="sg3" style={{ flex: 1, height: "6px", background: sgColors[3] }} />
              </div>
              <p
                id="sl"
                aria-live="polite"
                style={{
                  margin: "8px 0 0",
                  font: "600 14px 'Figtree', sans-serif",
                  minHeight: "20px",
                  color: strengthColor
                }}
              >
                {strengthText}
              </p>
            </div>
          </div>

          <div
            className="row"
            style={{
              borderTop: "3px dashed #10233A",
              padding: "26px 0 30px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px 40px",
              animationDelay: "0.24s"
            }}
          >
            <div style={{ flex: "0 0 min(100%, 280px)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
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
                  color: "#B83A16"
                }}
              >
                D
              </span>
              <div>
                <label
                  htmlFor="cf"
                  style={{
                    display: "block",
                    font: "800 26px/1.1 'Bricolage Grotesque', sans-serif",
                    marginBottom: "6px"
                  }}
                >
                  Confirm password
                </label>
                <p id="cf-h" style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#3E5068" }}>
                  Type the same password again.
                </p>
              </div>
            </div>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div style={{ position: "relative" }}>
                <input
                  id="cf"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  aria-describedby="cf-h ce"
                  style={{
                    paddingRight: "96px",
                    ...(confirmMismatch ? { borderColor: "#B3261E" } : {})
                  }}
                  value={confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    handlepassword(val);
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showConfirm}
                  aria-label="Show or hide password"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "7px",
                    height: "44px",
                    minWidth: "72px",
                    border: 0,
                    background: "transparent",
                    color: "#B83A16",
                    font: "600 16px 'Figtree', sans-serif",
                    cursor: "pointer"
                  }}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              <p
                id="ce"
                className="err"
                role="alert"
                style={{ display: confirmMismatch ? "block" : "none" }}
              >
                ✕ Passwords do not match.
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
              animationDelay: ".28s"
            }}
          >
            <Button
              id="go"
              type="submit"
              arrow
              loading={loading}
              disabled={!isFormValid || loading}
              style={{
                minHeight: "58px",
                padding: "0 32px",
                font: "600 18px 'Figtree', sans-serif"
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
