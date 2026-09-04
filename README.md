# Bills → Sheet

A shared, login-gated tool: your colleagues scan/upload a bill, Gemini reads
it, and it lands as a new row **directly in one shared Google Sheet** —
live, for everyone, with unclear rows highlighted automatically. No API
costs (uses Gemini's free tier) and no separate export step.

- **Auth:** Google Sign-In, gated by an email allowlist you control
- **Extraction:** Gemini (Google's free-tier API) reads the bill
- **Storage:** a Google Sheet you own — real-time, native sharing, and you
  can still download it as .xlsx from Sheets any time (File → Download)
- **QR code:** built in at `/qr` once you're signed in

---

## What you need before you start

1. A **GitHub** account (free) — to hold the code
2. A **Vercel** account (free tier) — to host the site, at [vercel.com](https://vercel.com)
3. A **Google Cloud** account (free) — for sign-in, and for the "robot"
   identity that writes to your Sheet
4. A **Gemini API key** — free, no credit card, from
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

You do the whole thing from GitHub's and Vercel's websites — no need to
install anything locally.

---

## Step 1 — Put this code on GitHub

Create a new **private** repo and upload all files in this folder (GitHub's
web UI → "uploading an existing file" lets you drag and drop).

---

## Step 2 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → create a new
   blank sheet, name it e.g. "Cargar Bills".
2. In row 1, type these headers exactly, one per column (A through I):

   `Invoice Number | Invoice Date | Vendor Name | Paid For | Invoice Amount | Paid On Date | Remarks | Uploaded By | Uploaded At`

3. Keep this tab's name as **Sheet1** (the default) — or note the actual
   name, you'll need it in Step 5.
4. Copy the Sheet's ID from its URL:
   `docs.google.com/spreadsheets/d/`**`THIS-LONG-PART`**`/edit` — save it
   somewhere, you'll need it in Step 5.

---

## Step 3 — Set up "Sign in with Google" (controls who can log in)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a
   new project (e.g. "Bill Scanner").
2. **APIs & Services → OAuth consent screen** → fill in app name and your
   email → save. User type: Internal if everyone's on your Workspace
   domain, else External.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → type: **Web application**. Leave the redirect URI for now (you'll add
   it after Step 6). Copy the **Client ID** and **Client Secret**.

---

## Step 4 — Create a Service Account (the "robot" that writes to your Sheet)

This is separate from Step 3 — Step 3 is about who can *log in*, this is
about what actually *writes rows* on everyone's behalf.

1. In the same Google Cloud project: **APIs & Services → Library** → search
   "Google Sheets API" → **Enable**.
2. **IAM & Admin → Service Accounts → Create Service Account** → any name
   (e.g. "sheet-writer") → Create and continue → Done (skip the optional
   role/access steps).
3. Click into the service account you just made → **Keys** tab → **Add Key
   → Create new key → JSON** → it downloads a `.json` file.
4. Open that file. You need two values from it:
   - `"client_email"` → this is `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `"private_key"` → this whole value (including the `-----BEGIN...-----`
     lines) is `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
5. Go back to your Google Sheet (Step 2) → click **Share** → paste that
   `client_email` address in → give it **Editor** access → Send/Share.
   *(Without this share step, the app can't write to your sheet.)*

---

## Step 5 — Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import your GitHub repo.
2. Before deploying, add these **Environment Variables**:

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | from aistudio.google.com/apikey |
   | `GEMINI_MODEL` | `gemini-flash-latest` (change only if this ever errors — see Troubleshooting) |
   | `GOOGLE_CLIENT_ID` | from Step 3 |
   | `GOOGLE_CLIENT_SECRET` | from Step 3 |
   | `NEXTAUTH_SECRET` | random string — [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
   | `NEXTAUTH_URL` | your Vercel URL (fill in after first deploy, then redeploy) |
   | `ALLOWED_EMAILS` | comma-separated, e.g. `neel@cargar.in,colleague1@cargar.in` |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | from Step 4 |
   | `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | from Step 4 (paste the whole thing, quotes are fine) |
   | `GOOGLE_SHEET_ID` | from Step 2 |
   | `GOOGLE_SHEET_TAB_NAME` | `Sheet1` (or your actual tab name) |
   | `NEXT_PUBLIC_GOOGLE_SHEET_URL` | the full sheet URL, e.g. `https://docs.google.com/spreadsheets/d/xxx/edit` |

3. **Deploy**. Copy the URL Vercel gives you.
4. Go back to Google Cloud → your OAuth client (Step 3) → add redirect URI:
   `https://<your-vercel-url>/api/auth/callback/google` → Save.
5. In Vercel, edit `NEXTAUTH_URL` to match your real URL exactly → redeploy.

Visit your URL, sign in, upload a bill — it should appear in your Sheet
within a few seconds.

---

## Step 6 — Get your QR code

Sign in → click **"Show QR code"** in the top bar (or visit `/qr`).
Screenshot or print it and put it up in the office.

---

## Managing access & the sheet later

- **Add/remove someone's login access:** Vercel → Settings → Environment
  Variables → edit `ALLOWED_EMAILS` → redeploy.
- **The data itself lives in your Google Sheet** — you can filter, sort,
  add formulas, or download it as .xlsx (File → Download → Microsoft Excel)
  any time, exactly like any other sheet. Don't rename or delete the header
  row, and don't remove the service account's Editor access.

## Costs

- **Vercel:** free tier is plenty for this.
- **Gemini API:** free tier (no card required) — generous for a small
  team's bill uploads, but Google's exact free-tier limits and model names
  shift fairly often. If uploads start failing, check
  [aistudio.google.com](https://aistudio.google.com) for your current quota
  and the current recommended free Flash model, and update `GEMINI_MODEL`
  accordingly.
- **Google Sheets API:** free, no billing account involved at all.

## Troubleshooting

- **"Access not granted":** email not on `ALLOWED_EMAILS`, or you forgot to
  redeploy after editing it.
- **Sign-in loops back to sign-in:** `NEXTAUTH_URL` or the Google redirect
  URI doesn't exactly match your live URL (must be `https://`, no trailing
  slash mismatch).
- **"Could not write to Google Sheet":** almost always means the sheet
  wasn't shared with the service account's `client_email` (Step 4.5), or
  `GOOGLE_SHEET_ID` / `GOOGLE_SHEET_TAB_NAME` don't match your actual sheet.
- **"Extraction failed" / Gemini errors:** your `GEMINI_MODEL` value may
  have been retired — open aistudio.google.com, check what free model is
  currently listed, and update the env var to that model's ID.
