import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"

// @ts-ignore
import "./globals.css"
import TrpcProvider from "@/lib/trpc/Provider"

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
        <TrpcProvider>{props.children}</TrpcProvider>
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
