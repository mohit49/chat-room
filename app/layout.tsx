import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SocketProvider } from "@/lib/contexts/SocketContext";
import { SoundProvider } from "@/lib/contexts/SoundContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { NudgeProvider } from "@/lib/contexts/NudgeContext";
import { GlobalAuthChecker } from "@/components/auth/GlobalAuthChecker";
import GlobalChatManager from "@/components/layout/GlobalChatManager";
import GlobalSocketConnection from "@/components/layout/GlobalSocketConnection";
import GlobalNudgeNotification from "@/components/layout/GlobalNudgeNotification";
import GlobalNudgeListener from "@/components/layout/GlobalNudgeListener";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { NoSSR } from "@/components/ui/NoSSR";

export const metadata: Metadata = {
  title: "Chat App",
  description: "A modern chat application with user profiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NoSSR>
          <AuthProvider>
            <GlobalAuthChecker>
              <SocketProvider>
                <ThemeProvider>
                  <SoundProvider>
                    <NotificationProvider>
                      <NudgeProvider>
                        <GlobalSocketConnection />
                        <GlobalNudgeListener />
                        {children}
                        <GlobalChatManager />
                        <GlobalNudgeNotification />
                      </NudgeProvider>
                    </NotificationProvider>
                  </SoundProvider>
                </ThemeProvider>
              </SocketProvider>
            </GlobalAuthChecker>
          </AuthProvider>
        </NoSSR>
      </body>
    </html>
  );
}
