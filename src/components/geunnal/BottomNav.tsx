'use client'
import { Home, Camera, LayoutDashboard, MapPinned } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'photobooth', label: '포토부스', icon: Camera },
  { id: 'dashboard', label: '그날', icon: LayoutDashboard },
  { id: 'venues', label: '모임장소', icon: MapPinned },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4F0] z-50 pb-safe">
      <div className="flex items-center justify-around max-w-[430px] mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center py-2 px-4 flex-1 transition-colors min-h-[60px]"
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-colors ${
                  isActive ? 'text-[#8B75D0]' : 'text-[#9B8CC4]'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive ? 'text-[#8B75D0] font-semibold' : 'text-[#9B8CC4] font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
