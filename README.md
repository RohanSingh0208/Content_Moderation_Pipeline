---
title: Content Moderation Pipeline
emoji: 🛡️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🛡️ AI-Driven Content Moderation Pipeline

## 🚀 Live Demo
**[▶ Experience it live on HuggingFace Spaces](https://abhijeet-2005-content-moderation-pipeline.hf.space)**

> A deployment-ready, full-stack content moderation solution powered by **Groq (LLaMA 3.3-70B)** — complete with automated classification, confidence-driven routing, a human review workflow, transparent decision-making, and customizable per-platform policy controls.

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

Moderating content at scale remains a significant operational challenge. Basic classifiers tend to generate excessive false positives, and any practical system needs to be configurable — since different platforms demand different tolerance levels — while ensuring every decision remains traceable.

This project addresses those challenges through a **multi-stage AI moderation pipeline**:

1. **AI Classification** → The Groq LLM analyzes content across 7 distinct harm categories
2. **Confidence-Driven Routing** → Clear-cut violations are automatically removed; ambiguous cases are escalated to human moderators
3. **Human Review Workflow** → Reviewers receive full AI context and can override any decision
4. **Audit Trail** → Every action is recorded with its timestamp, platform, outcome, and rationale
5. **Policy Management** → Per-platform severity thresholds are adjustable through intuitive sliders

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
Evaluates content across **7 harm categories**, each with its own confidence score (0.0 – 1.0):
- `hate_speech` — Dehumanizing rhetoric directed at protected groups
- `harassment` — Direct personal attacks, threats, or intimidation
- `spam` — Unwanted promotional content or repetitive messaging
- `misinformation` — Verifiably false claims related to health or safety
- `graphic_violence` — Explicit portrayals of physical harm
- `adult_content` — Sexually explicit material
- `self_harm` — Content that encourages or depicts self-injury

### 2. 🧠 Context-Sensitive Analysis
Identical statements can be harmless in one setting and harmful in another. Each moderation request supports:
- **Platform** — Every platform operates under its own policy thresholds (children's, gaming, adult, social)
- **Conversation Context** — e.g., *"User is referencing a film"*, *"Response in a heated discussion"*
- **User History** — e.g., *"New user"*, *"Flagged 3 times previously for spam"*

All three signals are dynamically incorporated into the AI prompt.

### 3. 🔀 Confidence-Based Routing
Entirely mathematical routing — no hardcoded keywords:
```
Score ≥ threshold           →  auto_removed
Score ≥ threshold / 2       →  needs_review
Score < threshold / 2       →  approved
```
Thresholds are fetched in real time from the in-memory policy store with every request.

### 4. 🔍 Transparent Decision-Making
Every AI response provides:
- **`flagged_segment`** — The precise substring from the original content that triggered the flag
- **`triggered_category`** — The specific harm category involved
- **`reasoning`** — A clear, one-sentence explanation in plain language
- **`confidence`** — Overall assessment confidence (0.0 – 1.0)

### 5. 👥 Human Review Queue
Moderators are able to:
- View the complete content with the flagged segment highlighted in amber
- Review the AI's reasoning and confidence score
- Add a review note
- **Approve** or **Remove** the content
- Every outcome is recorded in the Audit Log with `decidedBy: "Human Reviewer"`

### 6. ⚙️ Policy Configuration
Live per-platform policy management:
- 4 pre-built platforms: **Children's Platform**, **General Social Media**, **Adult Platform**, **Gaming Platform**
- Threshold sliders (0–100) for each of the 7 categories per platform
- Updates are stored in the backend's in-memory store and take effect immediately on subsequent moderation requests

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
│   ├── main.py                     # Application entry point, CORS setup, all API routes
│   ├── groq_client.py              # Groq SDK wrapper (with JSON-mode enforcement)
│   ├── routing.py                  # Threshold-based routing logic (pure functions)
│   ├── models.py                   # Pydantic request/response schemas
│   ├── data_store.py               # In-memory storage (policies, queue, audit log)
│   ├── test_pipeline.py            # Pytest test suite (5 success criteria)
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

Ensure you have the following installed:
- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Groq API Key** — obtain one for free at [console.groq.com](https://console.groq.com)

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
# Open .env and set:  GROQ_API_KEY=your_key_here
```

---

### 3. Frontend Setup (React + Vite)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install
```

---

### 4. Running the Application

Launch **two terminals** from the project root:

**Terminal 1 — Start the FastAPI backend:**
```bash
uvicorn backend.main:app --reload
```
The API will be accessible at: `http://localhost:8000`
Interactive API documentation: `http://localhost:8000/docs`

**Terminal 2 — Start the React frontend:**
```bash
cd frontend
npm run dev
```
The dashboard will be available at: `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/moderate` | Submit content for AI-powered moderation |
| `GET` | `/policies` | Fetch all platform policies |
| `PUT` | `/policies/{platform}` | Modify thresholds for a specific platform |
| `GET` | `/queue` | Retrieve all items awaiting human review |
| `POST` | `/queue/{id}/resolve` | Approve or remove a queued item |
| `GET` | `/audit-log` | Fetch the complete moderation audit history |

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

Create a `.env` file in the **project root** (at the same level as `backend/`):

```env
GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ Never commit your `.env` file. It is included in `.gitignore` by default.

---

## 🧪 Running Tests

The test suite verifies all **5 core success criteria** using Pytest:

```bash
# From the project root
$env:PYTHONPATH="."; pytest -v backend/test_pipeline.py
```

| Test | What It Verifies |
|------|------------------|
| `test_multi_category_classification` | Sends 7 targeted messages and confirms the correct harm category scores highest for each |
| `test_context_aware_analysis` | Sends identical content on "Children's Platform" vs "Gaming Platform" and confirms different verdicts |
| `test_confidence_based_routing` | Confirms safe content → `approved`, harmful content → `auto_removed`, borderline → `needs_review` |
| `test_explainability` | Confirms the flagged segment is a genuine substring of the input and that reasoning is non-empty |
| `test_policy_configuration` | Reduces thresholds to 0 via PUT, re-moderates, and confirms the verdict changes to `auto_removed` |

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

Default threshold settings (values range from 0–100, representing the `auto_remove` score boundary):

| Category | Children's Platform | General Social Media | Adult Platform | Gaming Platform |
|---|---|---|---|---|
| Hate Speech | 50 | 75 | 80 | 70 |
| Harassment | 50 | 75 | 80 | 60 |
| Spam | 50 | 80 | 80 | 80 |
| Misinformation | 50 | 75 | 80 | 80 |
| Graphic Violence | 50 | 70 | 80 | 80 |
| Adult Content | 50 | 70 | 100 | 60 |
| Self Harm | 50 | 60 | 70 | 60 |

> Thresholds can be modified at runtime through the **Policy Settings** page or via the `PUT /policies/{platform}` API endpoint.

---

## 🔀 How Routing Works

The routing logic in [`backend/routing.py`](backend/routing.py) is implemented in pure Python without any hardcoded keywords:

```
For each harm category:
  threshold = platform_policy[category] / 100.0
  review_threshold = threshold / 2.0

  if score >= threshold      → verdict = "auto_removed"
  elif score >= review_threshold  → verdict = "needs_review"
  else                       → verdict = "approved"
```

The most severe verdict across all categories takes precedence (auto_removed > needs_review > approved).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push the branch: `git push origin feature/my-new-feature`
5. Submit a Pull Request

---

## 📄 License

This project is open-source and distributed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ using **FastAPI** · **React** · **Groq (LLaMA 3.3-70B)**

</div>
