import "./globals.css";

export const metadata = {
  title: "Nong Nam AI Companion",
  description: "Clean rebuild with admin and bookshelf"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body>{children}</body></html>;
}
