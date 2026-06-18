import React from "react";

const ResultsCard = ({ result, content, addToQueue, reset }) => {
  if (!result) return null;

  const {
    verdict,
    scores,
    flagged_segment,
    reasoning,
    confidence,
    triggered_category,
  } = result;

  const getStatusColor = (v) => {
    if (v === "approved") return "var(--success)";
    if (v === "auto_removed") return "var(--danger)";
    return "var(--warning)";
  };

  return (
    <div
      className="card animate-fade-in"
      style={{
        marginTop: "2rem",
        borderTop: `4px solid ${getStatusColor(verdict)}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            AI Verdict
          </h3>
          <div
            className={`status-badge status-${verdict}`}
            style={{
              fontSize: "1.25rem",
              padding: "0.5rem 1rem",
              marginTop: "0.5rem",
            }}
          >
            {verdict.replace("_", " ").toUpperCase()}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Confidence
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {(confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <strong>Reasoning:</strong>{" "}
        <span style={{ color: "var(--text-secondary)" }}>{reasoning}</span>
      </div>

      {flagged_segment && (
        <div
          style={{
            backgroundColor: "var(--bg-light)",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
          }}
        >
          <strong>Flagged Segment:</strong>
          <p
            style={{
              marginTop: "0.5rem",
              fontStyle: "italic",
              color: "var(--danger)",
            }}
          >
            "{flagged_segment}"
          </p>
          {triggered_category && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              <span className="badge">{triggered_category}</span>
            </div>
          )}
        </div>
      )}

      <div className="bar-chart-container">
        <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
          Category Scores
        </h4>
        {Object.entries(scores).map(([category, score]) => (
          <div className="bar-row" key={category}>
            <div className="bar-label">{category.replace("_", " ")}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${score * 100}%`,
                  backgroundColor:
                    score > 0.5
                      ? "var(--danger)"
                      : score > 0.2
                        ? "var(--warning)"
                        : "var(--success)",
                }}
              ></div>
            </div>
            <div className="bar-value">{(score * 100).toFixed(0)}</div>
          </div>
        ))}
      </div>

      {verdict === "needs_review" && (
        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
          }}
        >
          This item has been automatically added to the Human Review Queue.
        </div>
      )}
    </div>
  );
};

export default ResultsCard;
