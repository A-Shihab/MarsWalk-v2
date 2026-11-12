import { useEffect, useRef, useState } from "react";
import GeminiReport from "./GeminiReport";
import { getRoverCommentary } from "../services/api";

export default function RoverCommentary({ energy, routeReason }) {
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), []);

  async function generate() {
    const controller = new AbortController();
    request.current = controller;
    setExplanation("");
    setError("");
    setLoading(true);
    try {
      const result = await getRoverCommentary(
        { energy, route_reason: routeReason },
        controller.signal
      );
      if (!result.explanation?.trim()) throw new Error("Gemini returned empty commentary.");
      if (!controller.signal.aborted) setExplanation(result.explanation);
    } catch (error) {
      if (!controller.signal.aborted) setError(error.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 p-4">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-violet-400/60 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {loading ? "Generating commentary..." : "Generate optional Gemini commentary"}
      </button>
      {(loading || explanation || error) && (
        <GeminiReport explanation={explanation} loading={loading} error={error} />
      )}
    </div>
  );
}
