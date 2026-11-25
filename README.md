# 🎯 Pattern Cutter — ATS Resume Analyzer

> **Know your ATS score before the recruiter does.**

A full-stack web application that analyzes your resume against a job description, scores it like an Applicant Tracking System (ATS), highlights skill gaps, generates AI-powered improvement suggestions, and produces a ready-to-send cover letter PDF — all with your personal data automatically redacted before it ever reaches an AI model.

---

## 📋 Table of Contents

- [Project Idea](#-project-idea)
- [Use Cases](#-use-cases)
- [What Makes It Different](#-what-makes-it-different)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started (Self-Hosting Guide)](#-getting-started-self-hosting-guide)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Pages & Features](#-pages--features)
- [Scoring Breakdown](#-scoring-breakdown)
- [Privacy & Security](#-privacy--security)
- [Important Disclaimer](#-important-disclaimer)
- [License](#-license)

---

## 💡 Project Idea

Most job seekers send dozens of resumes and hear nothing back — not because they're unqualified, but because their resume doesn't pass the automated filters that companies use before a human even sees it. These filters are called **ATS (Applicant Tracking Systems)**.

**Pattern Cutter** is a free, self-hostable tool that simulates what an ATS looks for:

- Keyword and skill alignment with the job description
- Resume section completeness (education, skills, experience)
- Formatting quality (contact info, clean text)
- Achievement language (quantified metrics, action verbs)
- Document readability and length

After scoring, it goes one step further — an integrated AI layer (Google Gemini or Groq) generates **specific, line-level suggestions** for improving your resume and writes a **tailored cover letter** you can download as a formatted PDF.

---

## 🎯 Use Cases

| Who | How they use it |
|-----|-----------------|
| **Job seekers** | Upload resume + paste job description → get an instant ATS score, see exactly which keywords and skills are missing, and receive AI suggestions on how to fix each line |
| **Career changers** | Understand the skill gap between their current resume and a new industry's requirements |
| **Fresh graduates** | Learn what recruiters and ATS systems look for before submitting their very first application |
| **Freelancers / Consultants** | Quickly tailor their resume for each contract and generate a matching cover letter PDF |
| **Career coaches** | Use as a demo tool to show clients the importance of keyword alignment |
| **Developers (self-hosting)** | Run the entire stack locally or on their own server for complete data privacy |

---

## ✨ What Makes It Different

Most resume checkers on the market are paywalled, opaque, or send your entire resume — including your name, phone, and email — to a third-party AI without telling you.

| Feature | Pattern Cutter | Typical online tools |
|---------|---------------|----------------------|
| **Privacy-first AI** | Name, email, phone & links are automatically stripped before sending anything to an AI | Full resume sent as-is |
| **Transparent scoring** | Six weighted sub-scores with full breakdown shown to the user | Single opaque score |
| **Dual AI provider** | Gemini + Groq with automatic fallback — if one is down, the other takes over | Single provider, no fallback |
| **On-demand AI** | Score is instant (no AI needed); suggestions and cover letter are requested separately, only when you want them | AI runs on every upload (slow & expensive) |
| **Cover letter PDF** | AI generates a tailored letter; you can edit it in-app and download a formatted PDF | Separate tool or not offered |
| **Fully open & self-hostable** | Run it on your own machine with your own API keys — zero third-party data sharing | Closed SaaS |
| **Duplicate-resume detection** | Same PDF re-uploaded for a new job is recognised by SHA-256 hash — text is re-used, not re-extracted | Re-processes every time |
| **Google OAuth + Email auth** | Both sign-in methods, JWT in `httpOnly` cookie | Usually one or the other |
| **Analysis history** | All past analyses stored, paginated, deleteable | No history |

---

## ⚙️ How It Works

```
User uploads PDF + pastes Job Description
        │
        ▼
┌─────────────────────────────┐
│  1. PDF Text Extraction     │  ← pdf-parse reads the raw text and page count
│     SHA-256 deduplication   │  ← same file? reuse cached extracted text
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  2. Keyword & Skill         │  ← job description is tokenized and normalized
│     Analysis                │  ← skills dictionary + fuzzy synonym matching
│                             │  ← matched vs missing keywords and skills found
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  3. Scoring Engine          │  ← six weighted dimensions (see Scoring section)
│     (instant, no AI)        │  ← score 0–100, full breakdown returned
└─────────────────────────────┘
        │
        ▼
   Score + Keyword/Skill gap shown to user immediately
        │
   (User clicks "Get AI Suggestions")
        │
        ▼
┌─────────────────────────────┐
│  4. Privacy Redaction       │  ← name (first line heuristic), email, phone,
│                             │     and all URLs replaced with [NAME] [EMAIL] etc.
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  5. AI Suggestion Engine    │  ← structured prompt sent to Gemini or Groq
│     (Gemini → Groq fallback)│  ← retries on transient errors, exponential backoff
│                             │  ← validates JSON schema before accepting response
└─────────────────────────────┘
        │
        ▼
   Line-by-line suggestions cached in DB, returned to user
        │
   (User clicks "Generate Cover Letter")
        │
        ▼
┌─────────────────────────────┐
│  6. Cover Letter Generation │  ← AI writes paragraphs in chosen tone
│     + PDF Export            │  ← user can edit in-app, download as A4 PDF
│                             │  ← generated by PDFKit, no external service
└─────────────────────────────┘
```

### Auth Flow

```
Register / Login (email+password  or  Google OAuth)
        │
        ▼
  JWT signed on server → stored in httpOnly, Secure, SameSite=Strict cookie
        │
        ▼
  Every protected API call reads cookie automatically — no localStorage token
        │
        ▼
  401 response anywhere → session cleared → redirect to /login
```

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Pagination | mongoose-paginate-v2 |
| Auth | JWT (`httpOnly` cookie) + Google OAuth 2.0 |
| Password hashing | bcryptjs |
| File upload | Multer (memory storage, 5 MB limit) |
| PDF parsing | pdf-parse |
| PDF generation | PDFKit |
| AI providers | Google Gemini API, Groq API |
| Validation | express-validator |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Bundler | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| HTTP client | Axios |
| Google login | @react-oauth/google |
| State | React Context API |

---

## 📁 Project Structure

```
Ats_project/
├── server/                        # Express backend
│   ├── server.js                  # App entry point
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── ai.js                  # AI provider config & priority
│   ├── controllers/
│   │   ├── auth.controller.js     # Register, login, Google OAuth, logout
│   │   ├── analysis.controller.js # Create analysis, suggestions, cover letter
│   │   └── resume.controller.js   # Resume delete (cascade)
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   ├── upload.js              # Multer file filter
│   │   ├── validate.js            # express-validator rules
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── users.js
│   │   ├── resumes.js
│   │   ├── analysis.js
│   │   └── coverletters.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── analysis.routes.js
│   │   └── health.js
│   ├── services/
│   │   ├── aiService.js           # Retry + fallback AI orchestration
│   │   ├── scoringService.js      # 6-dimension scoring engine
│   │   ├── keywordService.js      # Keyword + skill extraction & matching
│   │   ├── pdfService.js          # PDF text extraction
│   │   ├── coverLetterService.js  # AI cover letter generation
│   │   ├── coverLetterPdf.js      # PDFKit PDF builder
│   │   ├── cascadeService.js      # Cascade delete (resume → analyses → letters)
│   │   └── ai/
│   │       ├── providers.js       # Gemini + Groq HTTP clients
│   │       ├── prompt.js          # Suggestion prompt builder
│   │       ├── validate.js        # AI JSON schema validator (suggestions)
│   │       ├── coverLetterPrompt.js
│   │       └── coverLetterValidate.js
│   ├── utils/
│   │   ├── redact.js              # Strip name/email/phone before AI
│   │   ├── skillMatcher.js
│   │   ├── skillsDictionary.js
│   │   ├── actionVerbs.js
│   │   ├── textUtils.js
│   │   └── AppError.js
│   └── .env.example               # All required env variables documented
│
└── my-app/                        # React + Vite frontend
    └── src/
        ├── App.jsx                # Routes definition
        ├── context/ContextApi.jsx # Global auth state
        ├── authentication/        # Login.jsx, Register.jsx
        ├── home/HomePage.jsx      # Landing page
        ├── dashboard/Dashboard.jsx
        ├── analysis/              # NewAnalysis, AnalysisResult, Suggestion
        ├── coverletter/CoverLetter.jsx
        ├── history/History.jsx
        ├── settings/Settings.jsx
        ├── components/            # Shared: Navbar, Footer, Button, Toast, etc.
        ├── protection/            # Route guards (Protection, GuestRoute)
        └── utils/                 # score.js, skillLabel.js
```

---

## 🚀 Getting Started (Self-Hosting Guide)

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) v6+ running locally **or** a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string
- At least one AI API key: **Google Gemini** or **Groq** (both are free-tier available)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/ats-resume-analyzer.git
cd ats-resume-analyzer
```

---

### Step 2 — Set up the Backend

```bash
cd server
npm install
```

Copy the example environment file and fill in your values:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` in any editor and fill in your keys (see [Environment Variables](#-environment-variables) below).

Start the backend server:

```bash
npm start
# Server starts on http://localhost:5000
```

---

### Step 3 — Set up the Frontend

Open a new terminal:

```bash
cd my-app
npm install
npm run dev
# React app starts on http://localhost:5173
```

---

### Step 4 — Open the app

Visit **http://localhost:5173** in your browser.

- Register a new account (or use Google OAuth if you've configured `GOOGLE_CLIENT_ID`)
- Upload a PDF resume, paste a job description, and hit **Analyze**
- Your ATS score appears instantly
- Click **Get AI Suggestions** to trigger the AI layer
- Click **Generate Cover Letter** to create a downloadable PDF

---

### Quick Start (Both servers, one command)

If you want to run both simultaneously from the root:

```bash
# Install a simple concurrently runner
npm install
npm run dev
```

> Or simply open two terminals — one in `server/` and one in `my-app/`.

---

## 🔐 Environment Variables

All variables are documented in [`server/.env.example`](server/.env.example). Below is a summary:

```env
# ── Database ──────────────────────────────────────────
Mongourl=mongodb://127.0.0.1:27017/ats_resume_analyzer

# ── Server ────────────────────────────────────────────
PORT=5000
NODE_ENV=local
CLIENT_ORIGIN=http://localhost:5173   # Must match your frontend URL
MAX_UPLOAD_MB=5                       # Max PDF size (default 5)

# ── Authentication ────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_SECRET=your-google-client-secret
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

# ── AI Provider ───────────────────────────────────────
AI_PROVIDER=                          # Leave empty for auto (Gemini first)
                                      # Set to "groq" to prefer Groq
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key

GEMINI_MODEL=gemini-3.6-flash         # Optional — has sensible defaults
GROQ_MODEL=openai/gpt-oss-120b        # Optional — has sensible defaults

AI_TIMEOUT_MS=30000
AI_TOTAL_BUDGET_MS=45000
```

**Getting API keys (both free tier):**

| Provider | Where to get the key |
|----------|----------------------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) |

**Google OAuth (optional — only needed for Google sign-in button):**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add `http://localhost:5173` to Authorized JavaScript origins
5. Copy the **Client ID** into `GOOGLE_CLIENT_ID`

> Email + password registration works without Google OAuth configured.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register with name, email, password |
| `POST` | `/auth/login` | ❌ | Login with email, password |
| `POST` | `/auth/google` | ❌ | Login/register with Google ID token |
| `GET` | `/auth/me` | ✅ | Get current user info |
| `POST` | `/auth/logout` | ✅ | Clear session cookie |
| `GET` | `/session` | ✅ | Validate active session |

### Analysis

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/resume/analysis` | ✅ | Upload PDF + job description → instant score |
| `GET` | `/resume/analyses/list` | ✅ | Paginated history list |
| `GET` | `/resume/analysis/single/doc/:id` | ✅ | Full analysis detail |
| `DELETE` | `/resume/analysis/doc/remove/:id` | ✅ | Delete an analysis |
| `POST` | `/resume/analysis/:id/suggestions` | ✅ | Trigger AI suggestions (cached after first call) |
| `DELETE` | `/resume/resume/doc/remove/:id` | ✅ | Delete resume + cascade (analyses + letters) |

### Cover Letter

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/resume/analysis/:id/cover-letter` | ✅ | Generate AI cover letter |
| `PUT` | `/resume/analysis/:id/cover-letter` | ✅ | Update (edit) cover letter |
| `GET` | `/resume/analysis/:id/cover-letter` | ✅ | Fetch saved cover letter |
| `GET` | `/resume/analysis/:id/cover-letter/pdf` | ✅ | Download formatted PDF |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Server health check |

---

## 📄 Pages & Features

| # | Page | Route | Visible to |
|---|------|-------|------------|
| 1 | Landing | `/` | Everyone |
| 2 | Register | `/register` | Logged-out users |
| 3 | Login | `/login` | Logged-out users |
| 4 | Dashboard | `/dashboard` | Logged-in users |
| 5 | New Analysis | `/analysis/new` | Logged-in users |
| 6 | Result | `/analysis/:id` | Logged-in users |
| 7 | AI Suggestions | `/analysis/:id/suggestions` | Logged-in users |
| 8 | Cover Letter | `/analysis/:id/cover-letter` | Logged-in users |
| 9 | History | `/history` | Logged-in users |
| 10 | Settings | `/settings` | Logged-in users |
| 11 | 404 | `*` | Everyone |

**Route guards:** Logged-out users hitting a protected page are sent to `/login` and redirected back after login. Logged-in users hitting `/login` or `/register` are sent to `/dashboard`.

---

## 📊 Scoring Breakdown

The score (0–100) is computed from six weighted dimensions — no AI involved, results are instant:

| Dimension | Weight | What is measured |
|-----------|--------|-----------------|
| **Skills Match** | 40 pts | Skills mentioned in the job description that appear in your resume |
| **Keyword Match** | 20 pts | Key nouns and phrases from the JD found in your resume |
| **Section Completeness** | 15 pts | Presence of Education, Skills, and Experience/Projects sections |
| **Formatting** | 10 pts | Contact info (email, phone), professional link, clean encoding |
| **Achievements** | 10 pts | Quantified metrics (%, $, counts) + strong action verbs |
| **Readability** | 5 pts | Word count per page (200–750 is ideal), vocabulary variety |

**Score labels:**

| Range | Label | Colour |
|-------|-------|--------|
| 70–100 | ✓ Good | Green |
| 40–69 | ~ Fair | Amber |
| 0–39 | ✕ Weak | Red |

---

## 🔒 Privacy & Security

- **PII redaction before AI:** Before any resume text is sent to an external AI model, the system automatically strips:
  - Full name (detected as the first short line of the resume)
  - Email addresses
  - Phone numbers (international formats)
  - All URLs and profile links
  - These are replaced with `[NAME]`, `[EMAIL]`, `[PHONE]`, `[LINK]` placeholders
- **JWT stored in `httpOnly` cookies** — not accessible from JavaScript, resistant to XSS
- **Passwords hashed** with bcrypt (10 salt rounds) — never stored in plain text
- **SHA-256 file deduplication** — no duplicate binary storage
- **File size limit** — configurable via `MAX_UPLOAD_MB` (default 5 MB)
- **Resume text capped** at 5,000 characters and JD at 2,500 characters before AI calls to control cost and exposure

---

## ⚠️ Important Disclaimer

> **This tool provides an estimate, not a real ATS score.**
>
> Every company's ATS is configured differently — different weights, different keyword lists, different parsing engines. No third-party tool can replicate your actual score for a specific company's system. Use this as a directional guide to improve keyword alignment and resume quality, not as a guarantee of ATS pass/fail.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ · **Pattern Cutter ATS Resume Analyzer**

*Your name, email and phone are removed before text is sent to the AI.*

</div>
