"use client"

import { useState } from "react"
import { Home, Users, FileText, Settings, ChevronRight } from "lucide-react"

interface SidebarProps {
  activeItem?: string
  onItemClick?: (item: string) => void
}

export default function Sidebar({ activeItem = "dashboard", onItemClick }: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "工作台",
      icon: Home,
    },
    {
      id: "patients",
      label: "患者管理",
      icon: Users,
    },
    {
      id: "reports",
      label: "报告统计",
      icon: FileText,
    },
    {
      id: "settings",
      label: "系统设置",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-64 bg-[var(--brand-iris)] text-white flex flex-col h-screen border-r border-[var(--brand-iris)]">
      {/* Logo / Title */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">📋</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">智慧医疗</span>
            <span className="text-xs text-white/70">AI指挥台</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/20 shadow-md"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          )
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">系统管理员</p>
            <p className="text-xs text-white/70 truncate">admin@hospital.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
