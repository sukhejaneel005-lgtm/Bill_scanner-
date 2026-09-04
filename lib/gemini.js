const EXTRACTION_PROMPT = `You are extracting data from one or more scanned bills/invoices/receipts for a bookkeeping spreadsheet.

Return ONLY a raw JSON array (no markdown fences, no commentary). One object per distinct bill found in the document. Each object must have exactly these keys:
- "invoice_number": string. The bill/invoice number as printed. If handwritten/unclear, give your best reading and say so in remarks.
- "invoice_date": string, format DD-MMM-YYYY if possible (e.g. "17-Jul-2026"). Use the invoice's own date, not any "paid on" date.
- "vendor_name": string. The company/shop/person who issued the bill. For internal reimbursement/expense claim forms, use the claimant's name followed by "(Reimbursement)".
- "paid_for": string, short description of what was purchased/paid for (item names or service). For a reimbursement form with multiple line items, write "Reimbursement" here.
- "invoice_amount": number only (no currency symbol, no commas), the FINAL amount actually payable — i.e. after GST/tax, discounts, and rounding are applied (the Grand Total / Net Amount / Total Payable). For a reimbursement form, use the Grand Total of all line items as ONE combined row — do not create a row per line item.
- "paid_on_date": string, format DD-MMM-YYYY. Only fill this if the document has an explicit "Paid on <date>" note, stamp, or signature date. Leave as empty string "" if there is no such note.
- "remarks": string. Empty string if everything is clear. Otherwise explain briefly what is unclear, illegible, handwritten, or uncertain (e.g. "handwritten total, please verify", "courier note, not a tax invoice", "date format ambiguous").
- "unclear": boolean. true if invoice_number, vendor_name, or invoice_amount had to be guessed, is illegible, or is genuinely ambiguous. false if everything was clearly printed and legible.

If a page is not a bill at all (blank, unrelated), skip it. If you cannot make out a field at all, put your best visible guess in the field itself (never leave invoice_amount blank if any number is visible) and explain in remarks.`;

// GEMINI_MODEL is an env var on purpose - Google's free-tier model lineup
// changes fairly often. "gemini-flash-latest" is Google's own always-current
// alias (see ai.google.dev/gemini-api/docs/models); if it ever 404s, swap in
// whatever current free Flash model ID Google AI Studio shows you.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export async function extractBillsWithGemini(base64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY env var");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\[[\s\S]*\]/);
    parsed = match ? JSON.parse(match[0]) : [];
  }
  return Array.isArray(parsed) ? parsed : [parsed];
}
