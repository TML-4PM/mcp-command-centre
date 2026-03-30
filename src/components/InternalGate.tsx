import { useState, useEffect } from "react";

const GATE_KEY = "rf_internal_authed";
const CORRECT_PASSWORD = import.meta.env.VITE_INTERNAL_PASSWORD || "t4h-internal";

interface InternalGateProps {
  children: React.ReactNode;
}

export default function InternalGate({ children }: InternalGateProps) {
  // Check for widget bypass (?widget=true skips the gate)
  const params = new URLSearchParams(window.location.search);
  const isWidget = params.get("widget") === "true";

  const [authed, setAuthed] = useState(() => {
    return isWidget || sessionStorage.getItem(GATE_KEY) === "true";
  });
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isWidget) setAuthed(true);
  }, [isWidget]);

  if (authed) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === CORRECT_PASSWORD) {
      sessionStorage.setItem(GATE_KEY, "true");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#f8f9fa",
      fontFamily: "system-ui, sans-serif",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "40px 48px",
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>Report Factory</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Internal access only</div>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          autoFocus
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
            fontSize: 15,
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
        {error && (
          <div style={{ fontSize: 13, color: "#ef4444", marginTop: -8 }}>Incorrect password</div>
        )}
        <button
          type="submit"
          style={{
            padding: "10px",
            borderRadius: 8,
            background: "#0f172a",
            color: "#fff",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Enter
        </button>
      </form>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
