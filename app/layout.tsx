import type React from "react"
import type { Metadata } from "next"
import { Roboto_Mono } from 'next/font/google'
import { AnalyticsWrapper } from "@/lib/analytics"
import "./globals.css"
import { Header } from "@/components/header"
import { AppNavigation } from "@/components/app-navigation"
import MetaMaskConnectButton from "@/components/ui/metamask-connect"

const geistMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: "DENWEN - Advanced DeFi Arbitrage Platform",
  description: "Real-time arbitrage opportunities with MEV protection and advanced path finding across multiple DEXs",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
         <AnalyticsWrapper>
        <Header />
        <div className="flex flex-row items-center justify-between px-4 py-2">
          <AppNavigation />
          <MetaMaskConnectButton className="ml-4" />
        </div>
        {children}
         </AnalyticsWrapper>
      </body>
    </html>
  )
}
