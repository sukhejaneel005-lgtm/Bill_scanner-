import Providers from "@/components/Providers";

export const metadata = {
  title: "Bills → Excel",
  description: "Scan a bill, get it dropped into a shared spreadsheet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
