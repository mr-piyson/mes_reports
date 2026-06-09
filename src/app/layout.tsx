import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { Toaster } from "@/components/ui/sonner"
import TrpcProvider from "@/lib/trpc/Provider"

// @ts-ignore
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ITSM - IT Service Management",
  description: "Best CRM system for your business to manage transactions",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default async function RootLayout(props: any) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <TrpcProvider>{props.children}</TrpcProvider>
        </NuqsAdapter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--normal-bg)",
              color: "var(--normal-text)",
              border: "1px solid var(--normal-border)",
            },
          }}
        />
      </body>
    </html>
  )
}
