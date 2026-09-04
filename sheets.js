import { JWT } from "google-auth-library";

// Order must match the header row you create in the sheet yourself (Step 5 of README).
const COLUMN_ORDER = [
  "invoice_number",
  "invoice_date",
  "vendor_name",
  "paid_for",
  "invoice_amount",
  "paid_on_date",
  "remarks",
  "uploaded_by",
  "uploaded_at",
];

const UNCLEAR_COLOR = { red: 0.992, green: 0.953, blue: 0.812 }; // matches the amber highlight used elsewhere in this app

function getSheetName() {
  return process.env.GOOGLE_SHEET_TAB_NAME || "Sheet1";
}
function getSheetGid() {
  return Number(process.env.GOOGLE_SHEET_TAB_GID || 0);
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars"
    );
  }
  const key = rawKey.replace(/\\n/g, "\n");
  const client = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await client.getAccessToken();
  return token;
}

// Appends one row per item and highlights any row flagged "unclear".
// Returns the number of rows written.
export async function appendBillsToSheet(items, uploaderEmail) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const sheetName = getSheetName();
  const nowIso = new Date().toISOString();

  const values = items.map((it) =>
    COLUMN_ORDER.map((key) => {
      if (key === "uploaded_by") return uploaderEmail || "";
      if (key === "uploaded_at") return nowIso;
      if (key === "invoice_amount") {
        return it.invoice_amount === "" || it.invoice_amount === undefined || it.invoice_amount === null
          ? ""
          : Number(it.invoice_amount);
      }
      if (key === "remarks") {
        return (it.unclear ? "[CHECK] " : "") + (it.remarks || "");
      }
      return it[key] || "";
    })
  );

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    sheetName
  )}!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendResp = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!appendResp.ok) {
    const errText = await appendResp.text();
    throw new Error(`Sheets append failed: ${errText}`);
  }

  const appendData = await appendResp.json();
  const updatedRange = appendData?.updates?.updatedRange; // e.g. "Sheet1!A12:I14"
  const unclearFlags = items.map((it) => !!it.unclear);

  if (updatedRange && unclearFlags.some(Boolean)) {
    const match = updatedRange.match(/![A-Z]+(\d+):[A-Z]+(\d+)/);
    if (match) {
      const startRow = Number(match[1]); // 1-indexed, inclusive
      const requests = [];
      unclearFlags.forEach((isUnclear, i) => {
        if (!isUnclear) return;
        const rowIndex0 = startRow - 1 + i; // 0-indexed for the API
        requests.push({
          repeatCell: {
            range: {
              sheetId: getSheetGid(),
              startRowIndex: rowIndex0,
              endRowIndex: rowIndex0 + 1,
              startColumnIndex: 0,
              endColumnIndex: COLUMN_ORDER.length,
            },
            cell: { userEnteredFormat: { backgroundColor: UNCLEAR_COLOR } },
            fields: "userEnteredFormat.backgroundColor",
          },
        });
      });

      if (requests.length) {
        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
        const batchResp = await fetch(batchUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        });
        if (!batchResp.ok) {
          // Row was still written - highlighting is best-effort, so don't fail the whole request.
          console.error("Sheets highlight failed:", await batchResp.text());
        }
      }
    }
  }

  return values.length;
}
