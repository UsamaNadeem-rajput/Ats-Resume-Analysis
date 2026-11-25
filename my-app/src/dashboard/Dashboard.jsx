import { useContext, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../context/ContextApi";
import axios from "axios";
import {
  PageShell,
  Navbar,
  ScoreBadge,
  Chip,
  EmptyState,
  ErrorState,
  Skeleton
} from "../components";

function getScoreColor(score) {
  const num = Number(score || 0);
  if (num >= 70) return '#1F7A4D';
  if (num >= 40) return '#B45309';
  return '#B3261E';
}

function getMatchWord(score) {
  const num = Number(score || 0);
  if (num >= 70) return 'Good';
  if (num >= 40) return 'Fair';
  return 'Weak';
}

function getMatchSymbol(score) {
  const num = Number(score || 0);
  if (num >= 70) return '✓';
  if (num >= 40) return '~';
  return '✕';
}

export default function Dashboard() {
  const { name, user, logout } = useContext(Context);
  const [doclist, setdoclist] = useState();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    latestScore: null,
    bestOfLast10: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5000/api/resume/analyses/list", {
        withCredentials: true,
      });
      if (res.data.success) {
        const items = res.data.data || [];
        const totalCount = res.data?.totaldocs || 0;

        const latest = items.length > 0 ? items[0].score : null;

        const best = items.length > 0 ? Math.max(...items.map((item) => item.score)) : null;

        setdoclist(items);
        setStats({
          total: totalCount,
          latestScore: latest,
          bestOfLast10: best,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "We could not load your analyses.";
      console.log(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    list();
  }, [list]);

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

  const displayName = name || user?.name || "Usama";
  const latestItem = doclist && doclist.length > 0 ? doclist[0] : null;
  const bestItem = doclist && doclist.length > 0 ? doclist.find((item) => item.score === stats.bestOfLast10) : null;

  let tapeConfig;
  if (loading) {
    tapeConfig = { variant: 'base', caption: 'Measuring...' };
  } else if (error) {
    tapeConfig = { variant: 'base', caption: 'Not found' };
  } else if (!doclist || doclist.length === 0) {
    tapeConfig = { variant: 'base', caption: 'No analyses yet' };
  } else {
    tapeConfig = {
      variant: 'compare',
      value: stats.latestScore,
      compareValue: stats.bestOfLast10
    };
  }

  return (
    <PageShell
      tape={tapeConfig}
      style={{
        minHeight: '1900px',
        background: '#E9EEF2',
        color: '#10233A',
        fontFamily: "'Figtree', system-ui, sans-serif"
      }}
      data-canvas-width="1440"
      data-canvas-height="1900"
      data-document-role="page"
      data-label="B — Dashboard copy"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px) 64px' }}>
        <Navbar
          isLoggedIn={true}
          activeKey="dashboard"
          user={{ name: displayName }}
          onLogout={handleLogout}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px 40px',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            margin: '28px 0 44px'
          }}
        >
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(44px, 6.4vw, 96px)',
              lineHeight: 0.94,
              letterSpacing: '-.03em',
              margin: 0,
              flex: '1 1 420px'
            }}
          >
            Welcome back, {displayName}
            <span style={{ color: '#B83A16' }}>.</span>
          </h1>
          <Link
            className="btn"
            to="/analysis"
            style={{ minHeight: '64px', padding: '0 36px', fontSize: '19px' }}
          >
            New analysis <span className="pin" aria-hidden="true">→</span>
          </Link>
        </div>

        <div style={{ position: 'relative' }}>
          {loading ? (
            <div className="st1">
              <div aria-hidden="true">
                <div className="stats">
                  <div className="cell">
                    <Skeleton height="14px" width="50%" style={{ marginBottom: '16px' }} />
                    <Skeleton height="84px" width="60%" />
                  </div>
                  <div className="cell">
                    <Skeleton height="14px" width="50%" style={{ marginBottom: '16px' }} />
                    <Skeleton height="84px" width="60%" />
                  </div>
                  <div className="cell">
                    <Skeleton height="14px" width="50%" style={{ marginBottom: '16px' }} />
                    <Skeleton height="84px" width="60%" />
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px', marginTop: '56px' }}>
                  <Skeleton height="64px" />
                  <Skeleton height="64px" />
                  <Skeleton height="64px" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="st4">
              <ErrorState
                variant="outline"
                title="Something went wrong"
                message={error}
                retryLabel="Try again"
                onRetry={list}
              />
            </div>
          ) : (!doclist || doclist.length === 0) ? (
            <div className="st2">
              <EmptyState
                title="No analyses yet"
                description="Upload your resume to see your first score."
                actionLabel="Analyze my first resume"
                actionHref="/analysis"
              />
            </div>
          ) : (
            <div className="st3">
              <div className="stats" role="group" aria-label="Your numbers">
                <div className="cell rise" style={{ animationDelay: '0.1s' }}>
                  <p className="mono" style={{ margin: '0 0 14px', color: '#3E5068' }}>
                    Total analyses
                  </p>
                  <p
                    style={{
                      font: "800 clamp(64px, 8vw, 112px)/.9 'Bricolage Grotesque', sans-serif",
                      letterSpacing: '-.04em',
                      margin: '0 0 12px',
                      color: '#10233A'
                    }}
                  >
                    {stats.total}
                  </p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#3E5068', lineHeight: 1.5 }}>
                    Since you joined
                  </p>
                </div>

                <div className="cell rise" style={{ animationDelay: '0.2s' }}>
                  <p className="mono" style={{ margin: '0 0 14px', color: '#3E5068' }}>
                    Latest score
                  </p>
                  <p
                    style={{
                      font: "800 clamp(64px, 8vw, 112px)/.9 'Bricolage Grotesque', sans-serif",
                      letterSpacing: '-.04em',
                      margin: '0 0 12px',
                      color: getScoreColor(stats.latestScore)
                    }}
                  >
                    {stats.latestScore}
                  </p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#3E5068', lineHeight: 1.5 }}>
                    {latestItem?.jobTitle || 'Analysis'}
                  </p>
                  <p style={{ margin: '10px 0 0' }}>
                    <ScoreBadge score={stats.latestScore} label={`${getMatchWord(stats.latestScore)} match`}>
                      {`${getMatchSymbol(stats.latestScore)} ${getMatchWord(stats.latestScore)} match`}
                    </ScoreBadge>
                  </p>
                </div>

                <div className="cell rise" style={{ animationDelay: '0.3s' }}>
                  <p className="mono" style={{ margin: '0 0 14px', color: '#3E5068' }}>
                    Best of last 10
                  </p>
                  <p
                    style={{
                      font: "800 clamp(64px, 8vw, 112px)/.9 'Bricolage Grotesque', sans-serif",
                      letterSpacing: '-.04em',
                      margin: '0 0 12px',
                      color: getScoreColor(stats.bestOfLast10)
                    }}
                  >
                    {stats.bestOfLast10}
                  </p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#3E5068', lineHeight: 1.5 }}>
                    {bestItem?.jobTitle || 'Best match'}
                  </p>
                  <p style={{ margin: '10px 0 0' }}>
                    <ScoreBadge score={stats.bestOfLast10} label={`${getMatchWord(stats.bestOfLast10)} match`}>
                      {`${getMatchSymbol(stats.bestOfLast10)} ${getMatchWord(stats.bestOfLast10)} match`}
                    </ScoreBadge>
                  </p>
                </div>
              </div>

              <h2
                style={{
                  font: "800 clamp(32px, 4vw, 48px)/1 'Bricolage Grotesque', sans-serif",
                  letterSpacing: '-.02em',
                  margin: '56px 0 22px'
                }}
              >
                Recent analyses
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table className="rt">
                  <caption className="sr-only">Your five most recent analyses</caption>
                  <thead>
                    <tr>
                      <th scope="col">Job title</th>
                      <th scope="col">Score</th>
                      <th scope="col">Date</th>
                      <th scope="col">AI</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doclist.map((value, index) => {
                      const formattedDate = value.createdAt
                        ? new Date(value.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        : '—';

                      return (
                        <tr className="slide" key={value._id || index} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                          <td data-l="Job title">
                            <Link
                              to={`/analysis/${value._id}`}
                              style={{
                                font: "800 22px/1.15 'Bricolage Grotesque', sans-serif",
                                textDecoration: 'none',
                                color: '#10233A'
                              }}
                            >
                              {value.jobTitle ? value.jobTitle : 'Untitled position'}
                            </Link>
                          </td>
                          <td data-l="Score">
                            <ScoreBadge score={value.score} />
                          </td>
                          <td data-l="Date" style={{ color: '#3E5068' }}>
                            {formattedDate}
                          </td>
                          <td data-l="AI">
                            {value.aiStatus === 'ok' ? (
                              <Chip variant="ok">AI ready</Chip>
                            ) : value.aiStatus === 'failed' ? (
                              <Chip variant="bad">AI failed</Chip>
                            ) : (
                              <Chip variant="gr">AI not requested</Chip>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              className="btn btn2"
                              to={`/analysis/${value._id}`}
                              style={{ minHeight: '44px', padding: '0 20px', fontSize: '15px' }}
                            >
                              View<span className="sr-only"> {value.jobTitle || 'analysis'}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p style={{ margin: '20px 0 0' }}>
                <Link
                  to="/dashboard"
                  style={{
                    fontWeight: 600,
                    color: '#B83A16',
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '44px',
                    textDecoration: 'none'
                  }}
                >
                  View all →
                </Link>
              </p>
            </div>
          )}
        </div>

        <section
          aria-labelledby="tp"
          style={{
            marginTop: '72px',
            border: '2px dashed #10233A',
            background: '#F6F8FA',
            padding: '30px clamp(20px, 3vw, 40px)'
          }}
        >
          <h2 id="tp" className="mono" style={{ margin: '0 0 22px', color: '#B83A16' }}>
            Tips
          </h2>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px 40px'
            }}
          >
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="mark">1</span>
              <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.5, fontWeight: 500 }}>
                Paste the full job description for a better match.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="mark">2</span>
              <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.5, fontWeight: 500 }}>
                Use a text-based PDF. Scanned images do not work.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="mark">3</span>
              <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.5, fontWeight: 500 }}>
                Ask for AI suggestions only when you want them, and keep only what is true.
              </p>
            </li>
          </ol>
        </section>
      </div>
    </PageShell>
  );
}
