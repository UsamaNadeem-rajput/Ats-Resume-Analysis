import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../context/ContextApi';
import { PageShell, Navbar, Footer, Button, Toast } from '../components';

export default function HomePage() {
  const { user, logout } = useContext(Context) || {};
  const isLoggedIn = Boolean(user);
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      try {
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <PageShell tape={{ variant: 'score', value: 72, caption: 'Sample score: 72 / 100' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>
        <Navbar
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
          maxWidth="100%"
          style={{ padding: '24px 0' }}
        />

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            padding: '32px 0 96px'
          }}
        >
          <div>
            <p className="mono" style={{ margin: '0 0 20px', color: '#3E5068' }}>
              ATS Resume Analyzer
            </p>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(46px, 6.6vw, 100px)',
                lineHeight: 0.94,
                letterSpacing: '-0.03em',
                margin: '0 0 24px'
              }}
            >
              Know your <span className="hl2">ATS score</span> before the recruiter does
              <span style={{ color: '#B83A16' }}>.</span>
            </h1>
            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.6,
                color: '#3E5068',
                maxWidth: '500px',
                margin: '0 0 36px'
              }}
            >
              Upload your resume, paste a job description, and see how well they match.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Button as={Link} to="/analysis" arrow>
                Analyze my resume
              </Button>
              <Button href="#how" variant="secondary">
                See how it works
              </Button>
            </div>
          </div>

          <div style={{ maxWidth: '620px', width: '100%', justifySelf: 'center', paddingTop: '16px' }}>
            <svg
              viewBox="0 0 600 680"
              role="img"
              aria-label="A sample result drawn as a sewing pattern piece. A hanging tag shows an ATS-style score estimate of 72 out of 100. Matched skills Node.js, React and MongoDB are marked with a tick. Missing skills Docker and CI/CD are marked with a cross."
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              <rect x="220" y="44" width="330" height="560" fill="#fff" stroke="#10233A" strokeWidth="2" />
              <rect
                x="206"
                y="30"
                width="358"
                height="588"
                fill="none"
                stroke="#B83A16"
                strokeWidth="2.5"
                className="cut"
                strokeDasharray="9 7"
              />
              <polygon points="206,330 218,324 218,336" fill="#B83A16" />
              <polygon points="564,330 552,324 552,336" fill="#B83A16" />
              <line x1="385" y1="540" x2="385" y2="580" stroke="#10233A" strokeWidth="2" />
              <polygon points="385,584 379,572 391,572" fill="#10233A" />
              <rect x="244" y="76" width="150" height="14" fill="#10233A" />
              <rect x="244" y="102" width="210" height="7" fill="#8798AC" />
              <rect x="244" y="146" width="270" height="7" fill="#C5CFDA" />
              <rect x="244" y="164" width="240" height="7" fill="#C5CFDA" />
              <rect x="244" y="182" width="200" height="7" fill="#C5CFDA" />
              <rect x="244" y="256" width="64" height="9" fill="#10233A" />
              <rect x="244" y="276" width="280" height="2" fill="#10233A" />

              <g className="pop" style={{ animationDelay: '1.0s' }}>
                <rect x="244" y="306" width="86" height="28" fill="#E3F3EA" stroke="#1F7A4D" strokeWidth="1.8" />
                <text x="254" y="325" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize="14" fill="#1F7A4D">
                  ✓ Node.js
                </text>
              </g>
              <g className="pop" style={{ animationDelay: '1.2s' }}>
                <rect x="338" y="306" width="76" height="28" fill="#E3F3EA" stroke="#1F7A4D" strokeWidth="1.8" />
                <text x="348" y="325" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize="14" fill="#1F7A4D">
                  ✓ React
                </text>
              </g>
              <g className="pop" style={{ animationDelay: '1.4s' }}>
                <rect x="422" y="306" width="104" height="28" fill="#E3F3EA" stroke="#1F7A4D" strokeWidth="1.8" />
                <text x="432" y="325" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize="14" fill="#1F7A4D">
                  ✓ MongoDB
                </text>
              </g>
              <g className="pop" style={{ animationDelay: '1.7s' }}>
                <rect
                  x="244"
                  y="342"
                  width="90"
                  height="28"
                  fill="#FDEBD3"
                  stroke="#9A4A06"
                  strokeWidth="1.8"
                  strokeDasharray="5 4"
                />
                <text x="254" y="361" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize="14" fill="#9A4A06">
                  ✗ Docker
                </text>
              </g>
              <g className="pop" style={{ animationDelay: '1.9s' }}>
                <rect
                  x="342"
                  y="342"
                  width="84"
                  height="28"
                  fill="#FDEBD3"
                  stroke="#9A4A06"
                  strokeWidth="1.8"
                  strokeDasharray="5 4"
                />
                <text x="352" y="361" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize="14" fill="#9A4A06">
                  ✗ CI/CD
                </text>
              </g>

              <rect x="244" y="410" width="104" height="9" fill="#10233A" />
              <rect x="244" y="430" width="280" height="2" fill="#10233A" />
              <rect x="244" y="448" width="270" height="7" fill="#C5CFDA" />
              <rect x="244" y="466" width="250" height="7" fill="#C5CFDA" />
              <rect x="244" y="484" width="190" height="7" fill="#C5CFDA" />
              <rect x="244" y="520" width="270" height="7" fill="#C5CFDA" />

              <g className="swing">
                <line x1="102" y1="0" x2="102" y2="104" stroke="#B83A16" strokeWidth="2.5" strokeDasharray="6 5" />
                <rect x="14" y="104" width="176" height="226" fill="#fff" stroke="#10233A" strokeWidth="2" />
                <circle cx="102" cy="120" r="7" fill="#E9EEF2" stroke="#10233A" strokeWidth="2" />
                <text
                  x="102"
                  y="150"
                  textAnchor="middle"
                  fontFamily="DM Mono, monospace"
                  fontSize="11"
                  letterSpacing="1.5"
                  fill="#3E5068"
                >
                  SAMPLE
                </text>
                <path
                  d="M46 232A56 56 0 0 1 158 232"
                  pathLength="100"
                  fill="none"
                  stroke="#D3DBE4"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  className="arc"
                  d="M46 232A56 56 0 0 1 158 232"
                  pathLength="100"
                  fill="none"
                  stroke="#1F7A4D"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="72 100"
                />
                <text
                  x="102"
                  y="230"
                  textAnchor="middle"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="46"
                  fill="#10233A"
                >
                  72
                </text>
                <text
                  x="102"
                  y="254"
                  textAnchor="middle"
                  fontFamily="DM Mono, monospace"
                  fontSize="12"
                  fill="#3E5068"
                >
                  / 100
                </text>
                <text
                  x="102"
                  y="286"
                  textAnchor="middle"
                  fontFamily="Figtree, sans-serif"
                  fontWeight="600"
                  fontSize="13"
                  fill="#10233A"
                >
                  ATS-style score
                </text>
                <text
                  x="102"
                  y="304"
                  textAnchor="middle"
                  fontFamily="Figtree, sans-serif"
                  fontSize="13"
                  fill="#3E5068"
                >
                  (estimate)
                </text>
              </g>
            </svg>
          </div>
        </section>

        <section
          id="how"
          style={{
            background: '#10233A',
            color: '#E9EEF2',
            margin: '0 calc(-1 * clamp(20px, 5vw, 56px))',
            padding: '72px clamp(20px, 5vw, 56px)'
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="h2" style={{ marginBottom: '44px' }}>
              How it works
            </h2>
            <ol
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '32px'
              }}
            >
              <li style={{ borderLeft: '3px solid #FF8A63', paddingLeft: '20px' }}>
                <p className="mono" style={{ margin: '0 0 8px', color: '#FF8A63' }}>
                  Step 1
                </p>
                <p className="h3">Upload and paste</p>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#C5CFDA' }}>
                  Upload your resume and paste the job description.
                </p>
              </li>
              <li style={{ borderLeft: '3px solid #FF8A63', paddingLeft: '20px' }}>
                <p className="mono" style={{ margin: '0 0 8px', color: '#FF8A63' }}>
                  Step 2
                </p>
                <p className="h3">See the gap</p>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#C5CFDA' }}>
                  See your score and the skills you are missing.
                </p>
              </li>
              <li style={{ borderLeft: '3px solid #FF8A63', paddingLeft: '20px' }}>
                <p className="mono" style={{ margin: '0 0 8px', color: '#FF8A63' }}>
                  Step 3
                </p>
                <p className="h3">Fix and apply</p>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#C5CFDA' }}>
                  Get AI suggestions and a ready cover letter PDF.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section style={{ padding: '88px 0' }}>
          <h2 className="h2" style={{ marginBottom: '48px', maxWidth: '760px' }}>
            Four tools in one place
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px'
            }}
          >
            <div style={{ borderTop: '3px dashed #10233A', paddingTop: '24px' }}>
              <span className="mark">A</span>
              <h3 className="h3" style={{ marginTop: '16px' }}>
                ATS-style score
              </h3>
              <p style={{ margin: 0, lineHeight: 1.65, color: '#3E5068' }}>
                A score out of 100, split into six parts: skills, keywords, sections, formatting, achievements and readability.
              </p>
            </div>
            <div style={{ borderTop: '3px dashed #10233A', paddingTop: '24px' }}>
              <span className="mark">B</span>
              <h3 className="h3" style={{ marginTop: '16px' }}>
                Skills gap
              </h3>
              <p style={{ margin: 0, lineHeight: 1.65, color: '#3E5068' }}>
                Matched skills in one list and missing skills in another, with a count such as 6 of 12 required skills.
              </p>
            </div>
            <div style={{ borderTop: '3px dashed #10233A', paddingTop: '24px' }}>
              <span className="mark">C</span>
              <h3 className="h3" style={{ marginTop: '16px' }}>
                AI suggestions
              </h3>
              <p style={{ margin: 0, lineHeight: 1.65, color: '#3E5068' }}>
                Ask for them only when you want them. You get issues, fixes and rewritten bullets with a copy button.
              </p>
            </div>
            <div style={{ borderTop: '3px dashed #10233A', paddingTop: '24px' }}>
              <span className="mark">D</span>
              <h3 className="h3" style={{ marginTop: '16px' }}>
                Cover letter PDF
              </h3>
              <p style={{ margin: 0, lineHeight: 1.65, color: '#3E5068' }}>
                Pick a tone, edit the text, preview the page and download it as a PDF.
              </p>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 88px' }}>
          <h2 className="h2" style={{ marginBottom: '16px', maxWidth: '820px' }}>
            One bullet, fitted to one requirement
          </h2>
          <p style={{ margin: '0 0 36px', color: '#3E5068', fontSize: '17px', lineHeight: 1.6, maxWidth: '640px' }}>
            This is what a rewritten bullet looks like. The example is made up, not a real resume.
          </p>
          <svg
            viewBox="0 0 1000 6"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ width: '100%', height: '6px', display: 'block', marginBottom: '32px' }}
          >
            <line className="stitch" x1="0" y1="3" x2="1000" y2="3" stroke="#B83A16" strokeWidth="3" strokeDasharray="8 8" />
          </svg>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '40px'
            }}
          >
            <div className="rise">
              <p className="mono" style={{ margin: '0 0 14px', color: '#3E5068' }}>
                1 · Job description asks for
              </p>
              <p className="h3" style={{ fontSize: '28px' }}>
                Experience building REST APIs with Node.js.
              </p>
            </div>
            <div className="rise">
              <p className="mono" style={{ margin: '0 0 14px', color: '#3E5068' }}>
                2 · Before
              </p>
              <p
                style={{
                  fontSize: '19px',
                  lineHeight: 1.55,
                  margin: '0 0 14px',
                  color: '#3E5068',
                  textDecoration: 'line-through',
                  textDecorationThickness: '1.5px'
                }}
              >
                Worked on the backend of a web application during my internship.
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#3E5068' }}>
                Gap: it names no tools and does not say what you built.
              </p>
            </div>
            <div className="rise">
              <p className="mono" style={{ margin: '0 0 14px', color: '#1F7A4D' }}>
                3 · After
              </p>
              <p style={{ fontSize: '19px', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                Built <span className="hl">REST API</span> endpoints with <span className="hl">Node.js</span> and Express during my internship, used by the React front end.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="honest"
          style={{
            border: '2px dashed #10233A',
            background: '#F6F8FA',
            padding: '32px clamp(20px, 3vw, 40px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px 48px',
            marginBottom: '88px'
          }}
        >
          <div>
            <h2 id="honest" className="mono" style={{ margin: '0 0 10px', color: '#B83A16' }}>
              An honest note
            </h2>
            <p style={{ margin: 0, fontSize: '19px', lineHeight: 1.55, fontWeight: 500 }}>
              This is an estimate. Every company's ATS is different, so no tool can give the real score.
            </p>
          </div>
          <div>
            <p className="mono" style={{ margin: '0 0 10px', color: '#3E5068' }}>
              Your privacy
            </p>
            <p style={{ margin: 0, fontSize: '19px', lineHeight: 1.55, fontWeight: 500 }}>
              Your name, email and phone are removed before text is sent to the AI.
            </p>
          </div>
        </section>

        <section id="faq" style={{ padding: '0 0 88px', maxWidth: '900px' }}>
          <h2 className="h2" style={{ marginBottom: '36px' }}>
            Questions
          </h2>
          <details className="faq">
            <summary>Is this a real ATS?</summary>
            <p>No. Real ATS systems are private and differ by company. This tool estimates how well your resume matches one job.</p>
          </details>
          <details className="faq">
            <summary>Where is my resume saved?</summary>
            <p>
              Your resume text is stored so it does not have to be read again. Your name, email and phone are removed before anything is sent to the AI, and you can delete any analysis from History.
            </p>
          </details>
          <details className="faq">
            <summary>Which PDFs work?</summary>
            <p>Text-based PDFs up to 5 MB. Scanned images do not work.</p>
          </details>
          <details className="faq">
            <summary>Is it free?</summary>
            <p>There is no payment step anywhere in the app. It is a portfolio project.</p>
          </details>
        </section>

        <section style={{ borderTop: '2px solid #10233A', padding: '88px 0 72px' }}>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(44px, 8vw, 120px)',
              lineHeight: 0.92,
              letterSpacing: '-0.03em',
              margin: '0 0 36px',
              maxWidth: '1000px'
            }}
          >
            Start with the job description<span style={{ color: '#B83A16' }}>.</span>
          </h2>
          <Button as={Link} to="/analysis" arrow>
            Analyze my resume
          </Button>
        </section>

        <Footer maxWidth="100%" />
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </PageShell>
  );
}
