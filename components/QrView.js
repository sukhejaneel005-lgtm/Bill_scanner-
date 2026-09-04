"use client";
import { useEffect, useRef, useState } from "react";

export default function QrView() {
  const canvasRef = useRef(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(origin);
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, origin, {
        width: 320,
        margin: 2,
        color: { dark: "#0F2A47", light: "#FFFFFF" },
      });
    });
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>Scan to open</h1>
        <p style={S.sub}>
          Print this or display it in the office. Anyone who scans it will be
          asked to sign in with Google — only approved emails get in.
        </p>
        <canvas ref={canvasRef} style={S.canvas} />
        <p style={S.url}>{url}</p>
        <a href="/" style={S.back}>← Back to dashboard</a>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F6F7F9",
    fontFamily: "Arial, Helvetica, sans-serif",
    padding: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #DCE1E6",
    borderRadius: 10,
    padding: "36px 40px",
    textAlign: "center",
    maxWidth: 420,
  },
  title: { margin: "0 0 8px", color: "#0F2A47", fontSize: 20 },
  sub: { margin: "0 0 22px", color: "#5B6B7A", fontSize: 13.5, lineHeight: 1.5 },
  canvas: { border: "1px solid #DCE1E6", borderRadius: 8, padding: 10 },
  url: { margin: "16px 0 20px", color: "#5B6B7A", fontSize: 12.5, wordBreak: "break-all" },
  back: { color: "#0F2A47", fontSize: 13, fontWeight: 700, textDecoration: "underline" },
};
