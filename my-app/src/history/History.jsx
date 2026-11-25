import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../context/ContextApi';
import {
  PageShell,
  Navbar,
  ScoreBadge,
  Chip,
  ConfirmDialog,
  Toast,
  EmptyState,
  ErrorState,
  Skeleton
} from '../components';

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

function mapAiStatus(status) {
  if (status === 'ok') {
    return { label: 'Ready', variant: 'ok' };
  }
  if (status === 'failed') {
    return { label: 'Failed', variant: 'bad' };
  }
  return { label: 'Not requested', variant: 'gr' };
}

export default function History() {
  const { user, logout } = useContext(Context);
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const [filterText, setFilterText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAnalyses = useCallback(
    async (currentPage = page, currentLimit = limit) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/resume/analyses/list?page=${currentPage}&limit=${currentLimit}`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          setAnalyses(res.data.data || []);
          setTotalPages(res.data.totalpages || 1);
          setTotalDocs(res.data.totaldocs || 0);
        } else {
          setError('We could not load your history.');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', {
            state: { message: 'Your session has expired. Please log in again.' }
          });
          return;
        }
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a minute.');
          return;
        }
        setError('We could not load your history.');
      } finally {
        setLoading(false);
      }
    },
    [page, limit, navigate]
  );

  useEffect(() => {
    fetchAnalyses(page, limit);
  }, [page, limit, fetchAnalyses]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      try {
        await axios.post(
          'http://localhost:5000/api/auth/logout',
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error('Logout error:', err.response?.data?.message || err.message);
      }
    }
    navigate('/');
  };

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/resume/analysis/doc/remove/${deleteTarget._id}`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        const remaining = analyses.filter((item) => item._id !== deleteTarget._id);
        setAnalyses(remaining);
        setToast({ message: '✓ Analysis deleted' });
        setDeleteTarget(null);

        if (analyses.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          fetchAnalyses(page, limit);
        }
      } else {
        setDeleteTarget(null);
        setToast({ message: 'Could not delete analysis. Please try again.' });
      }
    } catch (err) {
      setDeleteTarget(null);
      if (err.response?.status === 401) {
        navigate('/login', {
          state: { message: 'Your session has expired. Please log in again.' }
        });
        return;
      }
      if (err.response?.status === 429) {
        setToast({ message: 'Too many requests. Please wait a minute.' });
        return;
      }
      const msg =
        err.response?.data?.message || 'Could not delete analysis. Please try again.';
      setToast({ message: msg });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((item) => {
    if (!filterText.trim()) return true;
    const title = (item.jobTitle || 'Untitled position').toLowerCase();
    return title.includes(filterText.toLowerCase().trim());
  });

  let tapeConfig = {
    variant: 'position',
    page,
    totalPages,
    caption: `Page ${page} of ${totalPages}`
  };

  if (loading) {
    tapeConfig = {
      variant: 'base',
      caption: 'Measuring...'
    };
  } else if (error) {
    tapeConfig = {
      variant: 'base',
      caption: 'We could not load your history.'
    };
  } else if (analyses.length === 0 && totalDocs === 0) {
    tapeConfig = {
      variant: 'base',
      caption: 'No analyses yet'
    };
  }

  return (
    <PageShell
      tape={tapeConfig}
      style={{
        minHeight: '100vh',
        background: '#E9EEF2',
        color: '#10233A',
        fontFamily: "'Figtree', system-ui, sans-serif"
      }}
      data-canvas-width="1440"
      data-document-role="page"
      data-label="B — History"
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(20px, 5vw, 56px) 64px',
          boxSizing: 'border-box'
        }}
      >
        <Navbar
          isLoggedIn={true}
          activeKey="history"
          user={user || { name: 'User' }}
          onLogout={handleLogout}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px 40px',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            margin: '28px 0 36px'
          }}
        >
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(44px, 6.4vw, 96px)',
              lineHeight: 0.94,
              letterSpacing: '-0.03em',
              margin: 0,
              flex: '1 1 360px'
            }}
          >
            History<span style={{ color: '#B83A16' }}>.</span>
          </h1>
          <Link
            className="btn"
            to="/analysis"
            style={{ minHeight: '60px', padding: '0 32px', fontSize: '18px' }}
          >
            New analysis <span className="pin" aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div aria-hidden="true" style={{ display: 'grid', gap: '12px' }}>
            <Skeleton height="48px" />
            <Skeleton height="72px" />
            <Skeleton height="72px" />
            <Skeleton height="72px" />
            <Skeleton height="72px" />
          </div>
        ) : error ? (
          <ErrorState
            title="Something went wrong"
            message={error}
            retryLabel="Try again"
            onRetry={() => fetchAnalyses(page, limit)}
            variant="outline"
          />
        ) : analyses.length === 0 && totalDocs === 0 ? (
          <EmptyState
            title="Your history is empty"
            description="Every analysis you run is saved here."
            actionLabel="Analyze a resume"
            actionHref="/analysis"
          />
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 24px',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0 0 20px'
              }}
            >
              <div style={{ flex: '1 1 280px', maxWidth: '420px' }}>
                <label htmlFor="fq" className="sr-only">
                  Filter this page by job title
                </label>
                <input
                  id="fq"
                  type="text"
                  placeholder="Filter this page by job title"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{
                    font: "500 17px 'Figtree', sans-serif",
                    color: '#10233A',
                    background: '#fff',
                    border: '2px solid #10233A',
                    borderRadius: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0 16px',
                    height: '48px'
                  }}
                />
              </div>
              <span style={{ fontSize: '14px', color: '#3E5068' }}>
                Newest first
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="rt">
                <caption className="sr-only">Your analyses, newest first</caption>
                <thead>
                  <tr>
                    <th scope="col">Job title</th>
                    <th scope="col">Score</th>
                    <th scope="col">AI</th>
                    <th scope="col">Date</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody id="hb">
                  {filteredAnalyses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: '#3E5068',
                          fontSize: '16px'
                        }}
                      >
                        No analyses matching &ldquo;{filterText}&rdquo; on this page.
                      </td>
                    </tr>
                  ) : (
                    filteredAnalyses.map((item, idx) => {
                      const ai = mapAiStatus(item.aiStatus);
                      const title = item.jobTitle || 'Untitled position';

                      return (
                        <tr
                          key={item._id}
                          className="slide"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td data-l="Job title">
                            <Link
                              to={`/analysis/${item._id}`}
                              style={{
                                font: "800 21px/1.15 'Bricolage Grotesque', sans-serif",
                                textDecoration: 'none',
                                color: '#10233A'
                              }}
                            >
                              {title}
                            </Link>
                          </td>
                          <td>
                            <ScoreBadge score={item.score} />
                          </td>
                          <td>
                            <Chip variant={ai.variant}>{ai.label}</Chip>
                          </td>
                          <td style={{ color: '#3E5068' }}>
                            {formatDate(item.createdAt)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Link
                              className="btn btn2"
                              to={`/analysis/${item._id}`}
                              style={{
                                minHeight: '44px',
                                padding: '0 18px',
                                fontSize: '15px'
                              }}
                            >
                              View<span className="sr-only"> {title}</span>
                            </Link>{' '}
                            <button
                              type="button"
                              className="del"
                              aria-label={`Delete ${title}`}
                              onClick={() => handleDeleteClick(item)}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3 5h14M8 5V3h4v2M5 5l1 12h8l1-12M8.5 8.5v5M11.5 8.5v5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <nav
              aria-label="Pagination"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px 28px',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '28px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className={`btn btn2 ${page <= 1 ? 'dis' : ''}`}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ minHeight: '48px' }}
                >
                  ← Previous
                </button>
                <span className="mono" style={{ color: '#10233A' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={`btn btn2 ${page >= totalPages ? 'dis' : ''}`}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ minHeight: '48px' }}
                >
                  Next →
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label
                  htmlFor="rp"
                  style={{ fontWeight: 600, fontSize: '15px' }}
                >
                  Rows per page
                </label>
                <select
                  id="rp"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    font: "600 16px 'Figtree', sans-serif",
                    minHeight: '44px',
                    padding: '0 12px',
                    border: '2px solid #10233A',
                    background: '#fff',
                    color: '#10233A',
                    borderRadius: 0
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </nav>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Are you sure?"
        message="Delete this analysis and its cover letter?"
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        isDestructive={true}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </PageShell>
  );
}
