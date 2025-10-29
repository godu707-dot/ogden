"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, TrendingUp, BarChart3, Wallet, FlaskConical, Settings, Menu, X } from "lucide-react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: TrendingUp },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Portfolio", href: "/portfolio", icon: Wallet },
  { name: "Simulation", href: "/simulation", icon: FlaskConical },
  { name: "Admin", href: "/admin", icon: Settings },
]

export function AppNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-background/80 backdrop-blur-xl border-r border-foreground/10 z-50">
        <Link href="/" className="mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-background font-bold text-xl">D</span>
          </div>
        </Link>

        <nav className="flex-1 flex flex-col gap-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                  "hover:bg-foreground/10 relative group",
                  isActive && "bg-primary/20 text-primary",
                )}
              >
                <Icon className="w-5 h-5" />
                {isActive && <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />}
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-foreground/90 text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-t border-foreground/10 z-50">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                  isActive ? "text-primary" : "text-foreground/60",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-mono">{item.name}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-foreground/60"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-mono">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-xl z-50 animate-in fade-in duration-200">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-background font-bold text-xl">D</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center"
                type="button"
                aria-label="Close menu"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-foreground/5 text-foreground/80 hover:bg-foreground/10",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-lg font-mono">{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-6 border-t border-foreground/10">
              <div className="text-xs font-mono text-foreground/40 text-center">DENWEN v1.0</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
