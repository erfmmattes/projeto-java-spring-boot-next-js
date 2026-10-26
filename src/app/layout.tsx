import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clínica Aurora | Atendimento",
  description: "Acompanhe seu atendimento na Clínica Aurora.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

