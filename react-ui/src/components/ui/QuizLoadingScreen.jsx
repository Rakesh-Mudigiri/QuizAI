import React, { useState, useEffect } from "react";
import { TextShimmer } from "@/components/ui/shimmer-text";
import "./QuizLoadingScreen.css";

const statusMessages = [
  "Agent is thinking ...",
  "Reading your material ...",
  "Understanding key concepts ...",
  "Synthesizing quiz questions ...",
  "Checking answer keys & formatting ...",
  "Finalizing your quiz ...",
];

export default function QuizLoadingScreen({ error, onRetry }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <div className="quiz-loading-card error-card">
        <div className="error-icon-container">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>warning</span>
        </div>
        <h3 className="loading-title">Quiz generation failed</h3>
        <p className="loading-subtext">
          {typeof error === "string" ? error : "We couldn't generate your quiz. Please try again."}
        </p>
        <button
          onClick={onRetry}
          className="retry-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-loading-card">
      {/* AI Mascot & Glowing Pulse Area */}
      <div className="mascot-container">
        <div className="mascot-ping" />
        <div className="mascot-bounce">
          <span className="material-symbols-outlined" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>
            smart_toy
          </span>
        </div>
      </div>

      {/* Heading */}
      <h2 className="loading-title">
        Creating your quiz
      </h2>

      {/* Shimmer Text Component Status Line */}
      <div className="status-pill">
        <TextShimmer className="font-medium text-base tracking-tight text-[#4F46E5]" duration={2.2}>
          {statusMessages[statusIndex]}
        </TextShimmer>
      </div>

    </div>
  );
}
