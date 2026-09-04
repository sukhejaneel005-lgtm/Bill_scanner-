"use client";
import { useRef, useState } from "react";
import { signOut } from "next-auth/react";

export default function Dashboard({ userEmail }) {
  const [queue, setQueue] = useState([]); // {id, name, status, message}
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "";

  function updateQueue(id, patch) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    for (const file of files) {
      const qid = Math.random().toString(36).slice(2);
      setQueue((q) => [...q, { id: qid, name: file.name, status: "working", message: "Reading…" }]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Extraction failed");

        const count = data.count || 0;
        const anyUnclear = (data.items || []).some((it) => it.unclear);
        updateQueue(qid, {
          status: "done",
          message: count === 0
            ? "No bill detected"
            : `${count} bill${count === 1 ? "" : "s"} added to sheet${anyUnclear ? " (check highlighted row)" : ""}`,
        });
      } catch (e) {
        console.error(e);
        updateQueue(qid, { status: "error", message: "Failed — try again" });
      }
    }
  }

  function onInputChange(e) {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.h1}>Bills → Sheet</h1>
          <p style={S.hSub}>Shared with your team · every upload lands as a new row, live</p>
        </div>
        <div style={S.headerRight}>
          <a href="/qr" style={S.qrLink}>Show QR code</a>
          <span style={S.userEmail}>{userEmail}</span>
          <button style={S.signOutBtn} onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <div
            style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <h3 style={S.dzTitle}>Drop a bill here, or choose a file</h3>
            <p style={S.dzSub}>Photos (JPG/PNG) or a PDF. One bill at a time, or a small batch, works best.</p>
            <div style={S.dzButtons}>
              <button style={S.btn} onClick={() => fileInputRef.current.click()}>Choose files</button>
              <button style={S.btnOutline} onClick={() => cameraInputRef.current.click()}>Take a photo</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={onInputChange} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={onInputChange} />
          </div>

          {queue.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {queue.map((item) => (
                <div key={item.id} style={S.queueItem}>
                  <span>{item.name}</span>
                  <span style={{ ...S.pill, ...S.pillByStatus[item.status] }}>{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>Your shared sheet</h2>
          <p style={S.sheetSub}>
            Every bill anyone uploads — from any device — appears here instantly, with a
            highlighted background on any row that needs a manual check.
          </p>
          {sheetUrl ? (
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={S.sheetBtn}>
              Open Google Sheet ↗
            </a>
          ) : (
            <p style={S.warn}>
              Set NEXT_PUBLIC_GOOGLE_SHEET_URL in your environment variables to show a direct
              link here — until then, open the sheet from your Google Drive.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { fontFamily: "Arial, Helvetica, sans-serif", background: "#F6F7F9", minHeight: "100vh", color: "#1C2733" },
  header: { background: "#0F2A47", color: "#fff", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  h1: { margin: 0, fontSize: 20 },
  hSub: { margin: "2px 0 0", fontSize: 12.5, color: "#B9C6D6" },
  headerRight: { display: "flex", alignItems: "center", gap: 14, fontSize: 13 },
  qrLink: { color: "#DCEBFF", textDecoration: "underline" },
  userEmail: { color: "#B9C6D6" },
  signOutBtn: { background: "transparent", border: "1px solid #3E5D7C", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer" },
  main: { maxWidth: 760, margin: "0 auto", padding: "24px 20px 60px" },
  card: { background: "#fff", border: "1px solid #DCE1E6", borderRadius: 8, padding: 20, marginBottom: 20 },
  dropzone: { border: "2px dashed #B7C4D1", borderRadius: 8, padding: "34px 20px", textAlign: "center", background: "#FBFCFD" },
  dropzoneActive: { borderColor: "#173A5E", background: "#EEF3F8" },
  dzTitle: { margin: "0 0 6px", fontSize: 16, color: "#173A5E" },
  dzSub: { margin: 0, fontSize: 13, color: "#5B6B7A" },
  dzButtons: { display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" },
  btn: { background: "#0F2A47", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 6, fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
  btnOutline: { background: "#fff", color: "#0F2A47", border: "1px solid #0F2A47", padding: "8px 16px", borderRadius: 6, fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
  queueItem: { display: "flex", justifyContent: "space-between", padding: "8px 12px", border: "1px solid #DCE1E6", borderRadius: 6, fontSize: 13, marginBottom: 6, background: "#fff" },
  pill: { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase" },
  pillByStatus: {
    working: { background: "#E4ECF6", color: "#173A5E" },
    done: { background: "#E7F5EC", color: "#1E7A46" },
    error: { background: "#FBEAE9", color: "#B3261E" },
  },
  h2: { margin: "0 0 8px", fontSize: 16, color: "#0F2A47" },
  sheetSub: { margin: "0 0 16px", fontSize: 13, color: "#5B6B7A", lineHeight: 1.5 },
  sheetBtn: { display: "inline-block", background: "#0F2A47", color: "#fff", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 13.5, textDecoration: "none" },
  warn: { fontSize: 12.5, color: "#B4790A", background: "#FDF3DF", padding: "10px 12px", borderRadius: 6, margin: 0 },
};
