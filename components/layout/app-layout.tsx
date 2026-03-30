"use client"

import { ReactNode, useState } from "react"
import Sidebar from "./sidebar"
import Header from "./header"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AppLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  headerProps?: {
    onSettingsClick?: () => void
    onLogoutClick?: () => void
  }
  sidebarProps?: {
    activeItem?: string
    onItemClick?: (item: string) => void
  }
}

export default function AppLayout({
  children,
  title,
  subtitle,
  headerProps,
  sidebarProps,
}: AppLayoutProps) {
  const [activeMenuItem, setActiveMenuItem] = useState(sidebarProps?.activeItem || "dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item)
    sidebarProps?.onItemClick?.(item)
  }

  return (
    <div className="relative flex h-screen bg-background">
      {/* Sidebar */}
      {!isSidebarCollapsed && <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />}

      <button
        type="button"
        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
        className={`absolute left-1 top-8 z-20 h-6 w-6 -translate-y-1/2 rounded-full border bg-white text-[var(--brand-iris)] shadow-md transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--brand-iris)_10%,white)] ${
          isSidebarCollapsed ? "left-3" : "left-[15rem]"
        }`}
        aria-label={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        title={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {isSidebarCollapsed ? <ChevronRight className="mx-auto h-4 w-4" /> : <ChevronLeft className="mx-auto h-4 w-4" />}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          onSettingsClick={headerProps?.onSettingsClick}
          onLogoutClick={headerProps?.onLogoutClick}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
