---
title: Content Moderation Pipeline
emoji: 🛡️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🛡️ AI-Powered Content Moderation Pipeline

## 🚀 Live Demo
**[▶ Try it live on HuggingFace Spaces](https://abhijeet-2005-content-moderation-pipeline.hf.space)**

> A production-ready, full-stack content moderation system powered by **Groq (LLaMA 3.3-70B)** — featuring automated classification, confidence-based routing, a human review queue, explainable decisions, and per-platform policy configuration.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Demo Architecture](#-live-demo-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
  - [4. Running the Application](#4-running-the-application)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Running Tests](#-running-tests)
- [Platform Policies](#-platform-policies)
- [How Routing Works](#-how-routing-works)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

Content moderation at scale is an unsolved operational problem. Simple classifiers produce too many false positives, and the system must be tunable — different platforms have different thresholds — while every decision must be auditable.

This project solves that by building a **multi-stage AI moderation pipeline**:

1. **AI Classification** → Groq LLM evaluates content across 7 harm categories
2. **Confidence-Based Routing** → High-confidence violations are auto-removed; borderline cases go to human reviewers
3. **Human Review Queue** → Moderators see full AI context and override decisions
4. **Audit Log** → Every action is logged with timestamp, platform, decision, and reasoning
5. **Policy Configuration** → Per-platform severity thresholds controlled via sliders

---

## 🏗️ Live Demo Architecture

```
Browser (React + Vite :5173)
        │
        │  fetch("http://localhost:8000/...")
        ▼
FastAPI Backend (:8000)
        │
        ├── POST /moderate ──────────► Groq API (LLaMA 3.3-70B)
        │                                      │
        │                              JSON scores returned
        │                                      │
        ├── routing.py ◄──────────────── Apply platform thresholds
        │      │
        │  ┌───┴──────────────────┐
        │  │  auto_removed        │  → Audit Log
        │  │  needs_review        │  → Human Queue
        │  │  approved            │  → Audit Log
        │  └──────────────────────┘
        │
        ├── GET /queue
        ├── POST /queue/{id}/resolve
        ├── GET /policies
        ├── PUT /policies/{platform}
        └── GET /audit-log
```

---

## ✨ Features

### 1. 🎯 Multi-Category Classification
Classifies content across **7 harm categories** with individual confidence scores (0.0 – 1.0):
- `hate_speech` — Dehumanizing language targeting protected groups
- `harassment` — Personal attacks, threats, or bullying
- `spam` — Unsolicited commercial content or repetitive noise
- `misinformation` — Demonstrably false health/safety claims
- `graphic_violence` — Detailed depictions of physical harm
- `adult_content` — Sexually explicit material
- `self_harm` — Content promoting or depicting self-injury

### 2. 🧠 Context-Aware Analysis
The same statement may be acceptable in one context and harmful in another. Every moderation request accepts:
- **Platform** — Each platform has different policy thresholds (children's, gaming, adult, social)
- **Conversation Context** — *"User is quoting a movie"*, *"Reply to a heated debate"*
- **User History** — *"First-time user"*, *"Previously flagged 3 times for spam"*

All three signals are injected dynamically into the AI prompt.

### 3. 🔀 Confidence-Based Routing
Pure mathematical routing — no hardcoded phrases:
```
Score ≥ threshold           →  auto_removed
Score ≥ threshold / 2       →  needs_review
Score < threshold / 2       →  approved
```
Thresholds are read live from the in-memory policy store on every request.

### 4. 🔍 Explainable Decisions
Every AI response includes:
- **`flagged_segment`** — The exact substring from the original content that triggered the violation
- **`triggered_category`** — The specific harm category
- **`reasoning`** — A human-readable one-sentence explanation
- **`confidence`** — Overall assessment confidence (0.0 – 1.0)

### 5. 👥 Human Review Queue
Moderators can:
- View the full content with flagged segment highlighted in amber
- Read AI reasoning and confidence score
- Attach a review note
- **Approve** or **Remove** the content
- Every decision is logged to the Audit Log with `decidedBy: "Human Reviewer"`

### 6. ⚙️ Policy Configuration
Real-time per-platform policy management:
- 4 pre-configured platforms: **Children's Platform**, **General Social Media**, **Adult Platform**, **Gaming Platform**
- Threshold sliders (0–100) for all 7 categories per platform
- Changes persist in backend in-memory store and immediately affect new moderation decisions

---

## 📸 Screenshots

### Moderate Content
![Moderate Content](https://raw.githubusercontent.com/AbhijeetPatil2005/Content_Moderation_Pipeline/main/screenshots/moderate_screenshot.png)

### Human Review Queue
![Review Queue](https://raw.githubusercontent.com/AbhijeetPatil2005/Content_Moderation_Pipeline/main/screenshots/queue_screenshot.png)

### Audit Log
![Audit Log](https://raw.githubusercontent.com/AbhijeetPatil2005/Content_Moderation_Pipeline/main/screenshots/audit_screenshot.png)

### Policy Settings
![Policy Settings](https://raw.githubusercontent.com/AbhijeetPatil2005/Content_Moderation_Pipeline/main/screenshots/policy_screenshot.png)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **AI Model** | [Groq](https://groq.com/) — `llama-3.3-70b-versatile` |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) |
| **Frontend** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) |
| **Styling** | Vanilla CSS with CSS custom properties (dark theme) |
| **Testing** | [Pytest](https://pytest.org/) + [HTTPX](https://www.python-httpx.org/) (via Starlette TestClient) |
| **Environment** | [python-dotenv](https://pypi.org/project/python-dotenv/) |

---

## 📁 Project Structure

```
Content_Moderation_Pipeline/
│
├── backend/                        # Python FastAPI application
│   ├── main.py                     # App entry point, CORS, all API routes
│   ├── groq_client.py              # Groq SDK wrapper (JSON-mode enforced)
│   ├── routing.py                  # Pure threshold-based routing logic
│   ├── models.py                   # Pydantic request/response schemas
│   ├── data_store.py               # In-memory DB (policies, queue, audit log)
│   ├── test_pipeline.py            # Pytest test suite (5 success metrics)
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Environment variable template
│
├── frontend/                       # React + Vite application
│   ├── src/
│   │   ├── App.jsx                 # Root component, global state, routing
│   │   ├── index.css               # Global styles, CSS variables, dark theme
│   │   └── components/
│   │       ├── Sidebar.jsx         # Navigation sidebar with queue badge
│   │       ├── Header.jsx          # Platform switcher dropdown
│   │       ├── ModerateContent.jsx # Content submission form + results
│   │       ├── ResultsCard.jsx     # AI verdict display with score bars
│   │       ├── ReviewQueue.jsx     # Human moderator review interface
│   │       ├── AuditLog.jsx        # Searchable/filterable decision history
│   │       └── PolicySettings.jsx  # Per-platform threshold sliders
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .env                            # Local environment variables (git-ignored)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Groq API Key** — get one free at [console.groq.com](https://console.groq.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/AbhijeetPatil2005/Content-Moderation-Pipeline.git
cd Content-Moderation-Pipeline
```

---

### 2. Backend Setup (FastAPI)

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Copy the environment template
cp backend/.env.example .env

# Add your Groq API key to .env
# Edit .env and set:  GROQ_API_KEY=your_key_here
```

---

### 3. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install
```

---

### 4. Running the Application

Open **two terminals** from the project root:

**Terminal 1 — Start the FastAPI backend:**
```bash
uvicorn backend.main:app --reload
```
The API will be available at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

**Terminal 2 — Start the React frontend:**
```bash
cd frontend
npm run dev
```
The dashboard will open at: `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/moderate` | Submit content for AI moderation |
| `GET` | `/policies` | Retrieve all platform policies |
| `PUT` | `/policies/{platform}` | Update thresholds for a platform |
| `GET` | `/queue` | Get all items pending human review |
| `POST` | `/queue/{id}/resolve` | Approve or remove a queued item |
| `GET` | `/audit-log` | Retrieve the full moderation audit log |

### POST `/moderate` — Request Body
```json
{
  "content": "The text content to evaluate",
  "platform": "General Social Media",
  "context": "User is replying to a news article",
  "user_history": "Previously flagged for spam twice"
}
```

### POST `/moderate` — Response
```json
{
  "scores": {
    "hate_speech": 0.05,
    "harassment": 0.72,
    "spam": 0.0,
    "misinformation": 0.0,
    "graphic_violence": 0.1,
    "adult_content": 0.0,
    "self_harm": 0.0
  },
  "verdict": "needs_review",
  "triggered_category": "harassment",
  "flagged_segment": "you should be fired and humiliated",
  "reasoning": "The message contains a direct personal attack targeting the individual's professional standing.",
  "confidence": 0.88
}
```

---

## 🔐 Environment Variables

Create a `.env` file in the **project root** (same level as `backend/`):

```env
GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore` by default.

---

## 🧪 Running Tests

The test suite validates all **5 core success metrics** using Pytest:

```bash
# From the project root
$env:PYTHONPATH="."; pytest -v backend/test_pipeline.py
```

| Test | What It Validates |
|------|-------------------|
| `test_multi_category_classification` | Sends 7 targeted messages and asserts the correct harm category scores highest for each |
| `test_context_aware_analysis` | Sends the same message on "Children's Platform" vs "Gaming Platform" and asserts different verdicts |
| `test_confidence_based_routing` | Asserts safe content → `approved`, harmful content → `auto_removed`, borderline → `needs_review` |
| `test_explainability` | Asserts the flagged segment is a real substring of the input, and reasoning is non-empty |
| `test_policy_configuration` | Lowers thresholds to 0 via PUT, re-moderates, and asserts verdict changes to `auto_removed` |

**Expected output:**
```
backend/test_pipeline.py::test_multi_category_classification  PASSED
backend/test_pipeline.py::test_context_aware_analysis         PASSED
backend/test_pipeline.py::test_confidence_based_routing       PASSED
backend/test_pipeline.py::test_explainability                 PASSED
backend/test_pipeline.py::test_policy_configuration           PASSED

============================== 5 passed in 8.26s ==============================
```

---

## ⚙️ Platform Policies

Default threshold configuration (values are 0–100, representing the `auto_remove` score boundary):

| Category | Children's Platform | General Social Media | Adult Platform | Gaming Platform |
|---|---|---|---|---|
| Hate Speech | 50 | 75 | 80 | 70 |
| Harassment | 50 | 75 | 80 | 60 |
| Spam | 50 | 80 | 80 | 80 |
| Misinformation | 50 | 75 | 80 | 80 |
| Graphic Violence | 50 | 70 | 80 | 80 |
| Adult Content | 50 | 70 | 100 | 60 |
| Self Harm | 50 | 60 | 70 | 60 |

> Thresholds are adjustable at runtime via the **Policy Settings** page or the `PUT /policies/{platform}` API endpoint.

---

## 🔀 How Routing Works

The routing logic in [`backend/routing.py`](backend/routing.py) is pure Python with no hardcoded phrases:

```
For each harm category:
  threshold = platform_policy[category] / 100.0
  review_threshold = threshold / 2.0

  if score >= threshold      → verdict = "auto_removed"
  elif score >= review_threshold  → verdict = "needs_review"
  else                       → verdict = "approved"
```

The worst verdict across all categories wins (auto_removed > needs_review > approved).

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ using **FastAPI** · **React** · **Groq (LLaMA 3.3-70B)**

</div>