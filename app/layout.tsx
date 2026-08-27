import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시그널 러시",
  description: "정보 조각이 지구 반대편 친구에게 도착하는 과정을 체험하는 3D 교육용 러너 게임",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
