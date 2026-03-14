'use client'
import { Home, Camera, LayoutDashboard, MapPinned } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'venues', label: '모임장소', icon: MapPinned },
  { id: 'dashboard', label: '그날', icon: LayoutDashboard },
  { id: 'photobooth', label: '포토부스', icon: Camera },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-[#E8E4F0] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-0.5
                w-full h-full min-w-[44px] min-h-[44px]
                transition-colors duration-150
                ${isActive ? 'text-[#8B75D0]' : 'text-[#9B8CC4]'}
              `}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
