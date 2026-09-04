export default function AccessDenied() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Access not granted</h1>
        <p style={styles.sub}>
          This tool is restricted to specific email addresses. Yours isn't on
          the list yet — ask whoever manages this tool to add your email.
        </p>
        <a href="/" style={styles.link}>Try a different account</a>
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
    maxWidth: 380,
  },
  title: { margin: "0 0 8px", color: "#B3261E", fontSize: 20 },
  sub: { margin: "0 0 20px", color: "#5B6B7A", fontSize: 13.5, lineHeight: 1.5 },
  link: { color: "#0F2A47", fontWeight: 700, fontSize: 13.5, textDecoration: "underline" },
};
