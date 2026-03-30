"use client"

import { Bell, Settings, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title?: string
  subtitle?: string
  onSettingsClick?: () => void
  onLogoutClick?: () => void
}

export default function Header({ 
  title = "交互式医疗报告生成系统",
  subtitle = "左侧为流程图和影像对比分析，右侧为医疗报告生成。",
  onSettingsClick,
  onLogoutClick
}: HeaderProps) {
  return (
    <header className="w-full bg-white border-b-2 border-[var(--brand-iris)]">
      {/* Top Bar - Title and Actions */}
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground">
            <img src="/svg/Q-生物.svg" alt="系统图标" className="h-8 w-8" />
            <span>{title}</span>
          </h1>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-8">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-ink-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings Button */}
          <button 
            onClick={onSettingsClick}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-ink-muted" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-border"></div>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">医生用户</p>
              <p className="text-xs text-ink-muted">**医院</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-iris)]/20 to-[var(--brand-mist)]/20 flex items-center justify-center border border-[var(--brand-iris)]/30">
              <User className="w-5 h-5 text-[var(--brand-iris)]" />
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={onLogoutClick}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
            title="登出"
          >
            <LogOut className="w-5 h-5 text-ink-muted" />
          </button>
        </div>
      </div>
    </header>
  )
}
