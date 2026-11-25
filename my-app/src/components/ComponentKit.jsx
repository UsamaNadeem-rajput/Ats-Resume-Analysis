import React, { useState } from 'react';
import {
  MeasuringTape,
  Button,
  Chip,
  ScoreBadge,
  Navbar,
  Footer,
  ConfirmDialog,
  Toast,
  EmptyState,
  ErrorState,
  Skeleton,
  Tooltip
} from './index.js';

export default function ComponentKit() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <div style={{ background: '#E9EEF2', minHeight: '100vh', color: '#10233A', paddingBottom: '80px' }}>
      <MeasuringTape value={72} compareValue={86} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>
        <div style={{ padding: '40px 0 20px', borderBottom: '3px solid #10233A' }}>
          <p className="mono" style={{ margin: '0 0 12px', color: '#B83A16' }}>Design System · Component Kit</p>
          <h1 style={{ font: "800 clamp(36px, 5vw, 64px)/1 'Bricolage Grotesque', sans-serif", margin: 0 }}>
            Shared Components<span style={{ color: '#B83A16' }}>.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#3E5068', marginTop: '12px' }}>
            Testing all 12 shared components against DESIGN.md and design HTML specs.
          </p>
        </div>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0', marginTop: '36px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">A</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                MeasuringTape (6 Variants)
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Base, Score Marker, Compare, Progress, Out of Range, Compact</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>1. Base variant (no marker)</p>
              <MeasuringTape variant="base" showCaption={false} />
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>2. Score marker variants (Good 72, Fair 55, Weak 28)</p>
              <div style={{ display: 'grid', gap: '16px' }}>
                <MeasuringTape value={72} caption={<p className="mono" style={{ margin: '14px 0 0', color: '#1F7A4D' }}>Good Score: 72 / 100</p>} />
                <MeasuringTape value={55} caption={<p className="mono" style={{ margin: '14px 0 0', color: '#B45309' }}>Fair Score: 55 / 100</p>} />
                <MeasuringTape value={28} caption={<p className="mono" style={{ margin: '14px 0 0', color: '#B3261E' }}>Weak Score: 28 / 100</p>} />
              </div>
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>3. Compare variant (Latest: 72, Best of 10: 86)</p>
              <MeasuringTape value={72} compareValue={86} />
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>4. Progress variant (2 of 3 measurements)</p>
              <MeasuringTape progress={{ done: 2, total: 3 }} />
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>5. Out of range variant (404 dropped marker)</p>
              <MeasuringTape outOfRange={true} />
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>6. Compact phone variant (labels every 25)</p>
              <div style={{ maxWidth: '360px' }}>
                <MeasuringTape compact={true} value={72} />
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">B</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Button (All States & Variants)
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Normal, Outline/Secondary, Danger, Loading with Spinner, Disabled, Pin Arrow</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button>Primary button</Button>
            <Button arrow={true}>With pin arrow</Button>
            <Button variant="secondary">Secondary button</Button>
            <Button variant="danger">Danger button</Button>
            <Button loading={btnLoading} onClick={() => setBtnLoading(!btnLoading)}>
              {btnLoading ? 'Analyzing...' : 'Click to toggle loading'}
            </Button>
            <Button loading={true}>Loading state</Button>
            <Button disabled={true}>Disabled button</Button>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">C</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Chip & ScoreBadge
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Status chips and 3-tier score badges</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <p className="mono" style={{ margin: '0 0 10px', color: '#3E5068' }}>Chips</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Chip variant="ok">Ready</Chip>
                <Chip variant="gr">Not requested</Chip>
                <Chip variant="bad">Failed</Chip>
              </div>
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 10px', color: '#3E5068' }}>ScoreBadges (Good, Fair, Weak)</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ScoreBadge score={72} />
                <ScoreBadge score={58} />
                <ScoreBadge score={38} />
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">D</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Navbar (Public & Logged-in + Hamburger)
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Responsive navbar with desktop links and mobile hamburger menu</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ background: '#F6F8FA', border: '2px solid #10233A', padding: '10px 20px' }}>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>Public Navbar Variant</p>
              <Navbar isLoggedIn={false} />
            </div>

            <div style={{ background: '#F6F8FA', border: '2px solid #10233A', padding: '10px 20px' }}>
              <p className="mono" style={{ margin: '0 0 8px', color: '#3E5068' }}>Logged-in Navbar Variant</p>
              <Navbar isLoggedIn={true} activeKey="dashboard" />
            </div>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">E</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Tooltip (Hover & Focus)
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Accessible tooltip triggered on hover and keyboard focus</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '17px', fontWeight: 600 }}>ATS-style score (estimate)</span>
            <Tooltip text="Real ATS systems are private and differ by company. This score estimates how well your resume matches this job." />
            <span style={{ color: '#3E5068', fontSize: '14px' }}>← Hover or Tab onto the 'i' button</span>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">F</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Skeleton Loader (.sk shimmer)
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Shimmer loading placeholders</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
            <Skeleton height="48px" />
            <Skeleton height="72px" />
            <Skeleton height="72px" />
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">G</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Toast & ConfirmDialog
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Status alerts and action confirmation dialogs</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <p className="mono" style={{ margin: '0 0 10px', color: '#3E5068' }}>Toast (Inline & Floating Demo)</p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Toast
                  open={toastOpen}
                  message="✓ Analysis deleted"
                  onClose={() => setToastOpen(false)}
                  position="inline"
                />
                {!toastOpen && (
                  <Button variant="secondary" onClick={() => setToastOpen(true)}>
                    Re-open Toast
                  </Button>
                )}
              </div>
            </div>

            <div>
              <p className="mono" style={{ margin: '0 0 10px', color: '#3E5068' }}>ConfirmDialog</p>
              <Button variant="danger" onClick={() => setDialogOpen(true)}>
                Open Confirm Dialog
              </Button>

              <ConfirmDialog
                open={dialogOpen}
                title="Are you sure?"
                message="Delete this analysis and its cover letter?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isDestructive={true}
                onConfirm={() => {
                  setDialogOpen(false);
                  setToastOpen(true);
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </div>
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">H</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                EmptyState & ErrorState
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Full page or section feedback states</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <EmptyState
              title="No analyses yet"
              description="Upload your resume to see your first score."
              actionLabel="Analyze my first resume"
              onAction={() => alert('Analyze clicked')}
            />

            <ErrorState
              title="Something went wrong"
              message="We could not load your analyses."
              retryLabel="Try again"
              onRetry={() => alert('Retry clicked')}
            />
          </div>
        </section>

        <section style={{ borderTop: '3px dashed #10233A', padding: '36px 0 0' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span className="mark">I</span>
            <div>
              <h2 style={{ font: "800 28px/1.1 'Bricolage Grotesque', sans-serif", margin: '0 0 6px' }}>
                Footer
              </h2>
              <p style={{ margin: 0, color: '#3E5068' }}>Shared site footer</p>
            </div>
          </div>

          <Footer />
        </section>
      </div>
    </div>
  );
}
