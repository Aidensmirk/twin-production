import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";
import Spinner from "../components/Spinner.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import TwinSignal from "../components/TwinSignal.jsx";

// Stages:
//   "writing"   -> seeded bank exhausted, twin is authoring a brand-new scenario
//   "locking"   -> server is generating + locking its prediction (hidden from us)
//   "answering" -> prediction is locked in the DB, user can type
//   "scoring"   -> answer submitted, waiting on the reveal
export default function PredictionRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const forceGenerate = location.state?.generate === true;

  const [question, setQuestion] = useState(null);
  const [predictionId, setPredictionId] = useState(null);
  const [stage, setStage] = useState("locking");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);

  async function beginRound() {
    setError(null);
    setQuestion(null);
    setPredictionId(null);
    setAnswer("");

    try {
      let q = null;

      if (!forceGenerate) {
        const res = await api.nextQuestion();
        q = res.data.question;
      }

      if (!q) {
        // Bank exhausted (or the user explicitly asked for a new scenario):
        // have the twin write one targeting its own weakest category.
        setStage("writing");
        const gen = await api.generateQuestion();
        q = gen.data;
      }

      setQuestion(q);
      setStage("locking");

      const started = await api.startRound(q.id);
      setPredictionId(started.data.prediction_id);
      setStage("answering");
    } catch (e) {
      setError("Your twin couldn't start this round just now.");
    }
  }

  useEffect(() => {
    beginRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e) {
    e.preventDefault();
    const val = answer.trim();
    if (!val || !predictionId) return;
    setStage("scoring");
    setError(null);
    api
      .submitRoundAnswer(predictionId, val)
      .then((res) => navigate("/reveal", { state: { round: res.data } }))
      .catch(() => {
        setError("Couldn't score this round.");
        setStage("answering");
      });
  }

  return (
    <div>
      <Nav minimal />
      <div className="max-w-[640px] mx-auto px-6 py-16">
        {question && (
          <>
            <div className="text-fg-faint text-[12px] mb-3">
              {question.category}
              {question.is_generated && " · written for you"}
            </div>
            <h2 className="font-serif text-[26px] leading-snug mb-7 font-medium">{question.text}</h2>
          </>
        )}

        {error && <ErrorBox message={error} onRetry={beginRound} />}

        {stage === "writing" && !error && (
          <Spinner label="You've answered everything in the bank — your twin is writing a new scenario to test where it understands you least." />
        )}

        {stage === "locking" && !error && (
          <Spinner label="Your twin is generating its prediction — locked before you type a word." />
        )}

        {stage === "answering" && (
          <>
            <TwinSignal value={answer} stage={stage} />
            <div className="flex items-center gap-2.5 text-fg-dim text-[13px] bg-bg-elevated border border-fg/10 px-3.5 py-3 rounded-sm mb-7">
              🔒 Prediction locked. Answer without seeing it.
            </div>
            <form onSubmit={submit}>
              <textarea
                className="field min-h-[110px]"
                placeholder="What would you actually do? Let the first honest answer surface."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoFocus
              />
              <div className="mt-5">
                <button className="btn-primary">Reveal</button>
              </div>
            </form>
          </>
        )}

        {stage === "scoring" && <Spinner label="Comparing your answer to the locked prediction…" />}
      </div>
    </div>
  );
}
