"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Bills → Excel</h1>
        <p style={styles.sub}>Sign in with your office Google account to upload bills.</p>
        <button style={styles.btn} onClick={() => signIn("google")}>
          Sign in with Google
        </button>
        <p style={styles.hint}>Only approved email addresses can access this tool.</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F6F7F9",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  card: {
    background: "#fff",
    border: "1px solid #DCE1E6",
    borderRadius: 10,
    padding: "40px 36px",
    textAlign: "center",
    maxWidth: 360,
  },
  title: { margin: "0 0 8px", color: "#0F2A47", fontSize: 22 },
  sub: { margin: "0 0 22px", color: "#5B6B7A", fontSize: 13.5 },
  btn: {
    background: "#0F2A47",
    color: "#fff",
    border: "none",
    padding: "11px 22px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
  hint: { marginTop: 16, fontSize: 11.5, color: "#9AA7B2" },
};
