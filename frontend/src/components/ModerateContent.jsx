import React, { useState } from "react";
import ResultsCard from "./ResultsCard";
import {
  FileText,
  MessageSquare,
  User,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

const ModerateContent = ({
  currentPlatform,
  setCurrentPlatform,
  platforms,
  refreshState,
  queueCount,
}) => {
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [userHistory, setUserHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleModerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform: currentPlatform,
          context,
          user_history: userHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error (${response.status})`);
      }

      const data = await response.json();
      data.platformContext = currentPlatform;
      setResult(data);

      refreshState();
    } catch (err) {
      setError(err.message || "Failed to parse API response");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setContext("");
    setUserHistory("");
    setResult(null);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header section integrated into page */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <div className="page-title">Moderate content</div>
          <div className="page-subtitle">
            Run AI classification against your active policy
          </div>
        </div>
        <div className="platform-dropdown">
          <ShieldCheck size={16} />
          <select
            value={currentPlatform}
            onChange={(e) => setCurrentPlatform(e.target.value)}
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="form-group">
          <label
            className="form-label"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FileText size={16} /> Content to evaluate
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {content.length} / 2000
            </span>
          </label>
          <textarea
            style={{ width: "100%", resize: "vertical", minHeight: "130px" }}
            rows="5"
            placeholder="Paste the post, comment, or message here..."
            value={content}
            maxLength={2000}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              <MessageSquare size={16} /> Conversation context
            </label>
            <input
              type="text"
              style={{ width: "100%" }}
              placeholder="e.g. reply to a heated debate"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              <User size={16} /> User history
            </label>
            <input
              type="text"
              style={{ width: "100%" }}
              placeholder="e.g. previously flagged for spam"
              value={userHistory}
              onChange={(e) => setUserHistory(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className="btn-primary"
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "1rem",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleModerate}
            disabled={loading || !content.trim()}
          >
            <ShieldCheck size={18} />{" "}
            {loading ? "Running..." : "Run moderation"}
          </button>
          <button
            className="btn-outline"
            style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
            onClick={handleReset}
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "1rem",
              color: "white",
              padding: "1rem",
              backgroundColor: "var(--danger)",
              borderRadius: "6px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Info Cards Grid at bottom */}
      {!result && (
        <div className="info-cards-grid">
          <div className="info-card">
            <div className="info-card-label">Active platform</div>
            <div className="info-card-value">{currentPlatform || "None"}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Pending review</div>
            <div className="info-card-value">
              {queueCount !== undefined ? queueCount : 0} items
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Categories tracked</div>
            <div className="info-card-value">7</div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && <ResultsCard result={result} reset={() => setResult(null)} />}
    </div>
  );
};

export default ModerateContent;
