import { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Context } from "../context/ContextApi";
import { PageShell, Navbar, Button } from "../components";

const Login = () => {
  const [data, setdata] = useState({
    email: "",
    password: ""
  });
  const [error, seterror] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setname, setUser } = useContext(Context);

  const handlesubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", data, {
        withCredentials: true
      });
      if (res.data.success) {
        console.log("created");
        seterror("");
        if (setUser && res.data?.user) setUser(res.data.user);
        if (setname && res.data?.user?.name) setname(res.data.user.name);
        navigate("/dashboard");
      }
    } catch (err) {
      const msg =
        err.response?.status === 401 || err.response?.data?.code === "UNAUTHORIZED"
          ? "Incorrect email or password."
          : err.response?.data?.message || "Incorrect email or password.";
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
        seterror("");
        if (setUser && res.data?.user) setUser(res.data.user);
        if (setname && res.data?.user?.name) setname(res.data.user.name);
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Google login failed";
      seterror(msg);
      console.log(msg);
    }
  };

  const handleGoogleError = () => {
    console.log("Google login cancel ya fail hua");
  };

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const isFormValid = Boolean(data.email && data.password);
  const measurementsDone = (data.email.trim() ? 1 : 0) + (data.password ? 1 : 0);

  return (
    <PageShell
      tape={{
        variant: "progress",
        total: 2,
        done: measurementsDone,
        caption: `${measurementsDone} of 2 measurements`
      }}
      style={{
        minHeight: "1300px",
        position: "relative",
        overflow: "hidden"
      }}
      data-canvas-width="1440"
      data-canvas-height="1300"
      data-document-role="page"
      data-label="B — Login (Hang tag) copy"
    >

      <svg
        aria-hidden="true"
        viewBox="0 0 600 760"
        style={{
          position: "absolute",
          right: "-40px",
          top: "110px",
          width: "min(52vw, 640px)",
          height: "auto",
          pointerEvents: "none"
        }}
      >
        <rect x="60" y="30" width="420" height="700" fill="none" stroke="#B5C2D0" strokeWidth="2.5" strokeDasharray="12 9" />
        <rect x="100" y="80" width="170" height="14" fill="#CBD5E0" />
        <rect x="100" y="110" width="250" height="8" fill="#D6DEE7" />
        <rect x="100" y="190" width="330" height="8" fill="#D6DEE7" />
        <rect x="100" y="212" width="290" height="8" fill="#D6DEE7" />
        <rect x="100" y="234" width="320" height="8" fill="#D6DEE7" />
        <rect x="100" y="300" width="120" height="22" fill="none" stroke="#B5C2D0" strokeWidth="2" strokeDasharray="5 4" />
        <rect x="100" y="380" width="330" height="8" fill="#D6DEE7" />
        <rect x="100" y="402" width="270" height="8" fill="#D6DEE7" />
      </svg>

      <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 56px) 64px" }}>
        <Navbar
          variant="auth"
          maxWidth="100%"
          authAction={{ prompt: "New here?", linkText: "Create an account", href: "/register" }}
        />

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(46px, 7vw, 104px)",
            lineHeight: 0.92,
            letterSpacing: "-0.03em",
            margin: "24px 0 16px",
            maxWidth: "min(100%, 520px)"
          }}
        >
          Welcome back to the fitting room<span style={{ color: "#B83A16" }}>.</span>
        </h1>
        <p style={{ fontSize: "19px", lineHeight: 1.6, color: "#3E5068", maxWidth: "520px", margin: 0 }}>
          Log in to run a new analysis or open a saved one.
        </p>

        <div className="sway" style={{ width: "min(100%, 500px)", marginTop: "8px" }}>
          <svg
            viewBox="0 0 24 90"
            aria-hidden="true"
            style={{ display: "block", width: "24px", height: "90px", margin: "0 auto", position: "relative", zIndex: 2 }}
          >
            <line className="stitch" x1="12" y1="0" x2="12" y2="86" stroke="#B83A16" strokeWidth="3" strokeDasharray="8 8" />
            <circle cx="12" cy="86" r="4" fill="#B83A16" />
          </svg>

          <section
            aria-labelledby="lgh"
            style={{
              position: "relative",
              marginTop: "-25px",
              background: "#F6F8FA",
              border: "2px solid #10233A",
              padding: "48px clamp(20px, 4vw, 36px) 36px",
              boxShadow: "8px 8px 0 #10233A"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "14px",
                width: "22px",
                height: "22px",
                marginLeft: "-11px",
                border: "2px solid #10233A",
                borderRadius: "50%",
                background: "#E9EEF2"
              }}
            />

            <p className="mono" style={{ margin: "0 0 8px", color: "#3E5068" }}>
              Returning client
            </p>
            <h2 id="lgh" style={{ font: "800 40px/1 'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em", margin: "0 0 24px" }}>
              Log in
            </h2>

            <div style={{ position: "relative" }}>
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

            {error && (
              <div
                role="alert"
                style={{
                  border: "2px solid #B3261E",
                  background: "#FCE9E7",
                  padding: "14px 16px",
                  fontWeight: 600,
                  color: "#7A1A12",
                  marginBottom: "16px"
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handlesubmit} noValidate>
              <div className="row" style={{ marginBottom: "20px", animationDelay: ".14s" }}>
                <label htmlFor="email" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={data.email}
                  onChange={(e) => setdata({ ...data, email: e.target.value })}
                  required
                />
              </div>

              <div className="row" style={{ marginBottom: "28px", animationDelay: ".2s" }}>
                <label htmlFor="pw" style={{ display: "block", fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="pw"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    style={{ paddingRight: "96px" }}
                    value={data.password}
                    onChange={(e) => setdata({ ...data, password: e.target.value })}
                    required
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
              </div>

              <Button
                id="go"
                type="submit"
                className="row"
                arrow
                loading={loading}
                disabled={!isFormValid || loading}
                style={{ width: "100%", minHeight: "58px", animationDelay: ".26s" }}
              >
                Log in
              </Button>
            </form>

            <p style={{ margin: "22px 0 0", fontSize: "16px", color: "#3E5068" }}>
              New here?{" "}
              <Link to="/register" style={{ color: "#B83A16", fontWeight: 600 }}>
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default Login;
