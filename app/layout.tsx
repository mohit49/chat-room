import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SocketProvider } from "@/lib/contexts/SocketContext";
import { SoundProvider } from "@/lib/contexts/SoundContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { NudgeProvider } from "@/lib/contexts/NudgeContext";
import { PushNotificationProvider } from "@/lib/contexts/PushNotificationContext";
import { EnhancedNudgeProvider } from "@/lib/contexts/EnhancedNudgeContext";
import { BroadcastProvider } from "@/lib/contexts/BroadcastContext";
import { GlobalAuthChecker } from "@/components/auth/GlobalAuthChecker";
import GlobalChatManager from "@/components/layout/GlobalChatManager";
import GlobalSocketConnection from "@/components/layout/GlobalSocketConnection";
import GlobalNudgeNotification from "@/components/layout/GlobalNudgeNotification";
import GlobalNudgeListener from "@/components/layout/GlobalNudgeListener";
import GlobalFollowListener from "@/components/layout/GlobalFollowListener";
import GlobalBroadcastPanel from "@/components/layout/GlobalBroadcastPanel";
import { PWASocketManager } from "@/components/layout/PWASocketManager";
import { PWAManager } from "@/components/pwa/PWAManager";
import { DynamicThemeColor } from "@/components/pwa/DynamicThemeColor";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { NoSSR } from "@/components/ui/NoSSR";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Chat App",
  description: "A modern chat application with user profiles",
  manifest: "/manifest.json",
  themeColor: "#FDFEFF",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chat App",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FDFEFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chat App" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Listen for messages from service worker
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data && event.data.type === 'NAVIGATE') {
                    window.location.href = event.data.url;
                  }
                });
              }
            `,
          }}
        />
        <NoSSR>
          <AuthProvider>
            <GlobalAuthChecker>
              <SocketProvider>
                <ThemeProvider>
                  <DynamicThemeColor />
                  <SoundProvider>
                    <NotificationProvider>
                      <NudgeProvider>
                        <PushNotificationProvider>
                          <EnhancedNudgeProvider>
                            <BroadcastProvider>
                              <PWAManager>
                                <GlobalSocketConnection />
                                <PWASocketManager />
                                <GlobalNudgeListener />
                                <GlobalFollowListener />
                                <GlobalBroadcastPanel />
                                {children}
                                <GlobalChatManager />
                                <GlobalNudgeNotification />
                                <Toaster />
                              </PWAManager>
                            </BroadcastProvider>
                          </EnhancedNudgeProvider>
                        </PushNotificationProvider>
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
