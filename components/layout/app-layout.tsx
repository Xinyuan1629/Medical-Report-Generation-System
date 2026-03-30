"use client"

import { ReactNode, useState } from "react"
import Sidebar from "./sidebar"
import Header from "./header"

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

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item)
    sidebarProps?.onItemClick?.(item)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />

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
