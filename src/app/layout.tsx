import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
  title: "Скарбничка",
  description: "Хто скільки відклав цього місяця",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" position="bottom-center" />
      </body>
    </html>
  )
}
