import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "EMZEE — Event OS",
  description: "Platformă de management evenimente: MC, jocuri, rentals, oferte, clienți.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
