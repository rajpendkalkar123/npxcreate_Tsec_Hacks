"use client"

import * as React from "react"
import {
  IconGrain,
  IconChartBar,
  IconDashboard,
  IconWallet,
  IconBuildingWarehouse,
  IconMapPin,
  IconSettings,
  IconHelp,
  IconHistory,
  IconInnerShadowTop,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: { name: "Farmer Nikita", email: "nikita@agrimail.com", avatar: "/avatars/farmer.jpg" },
  navMain: [
    { title: "Farm Overview", url: "#", icon: IconDashboard },
    { title: "My Harvests", url: "#", icon: IconGrain },
    { title: "Market Insights", url: "#", icon: IconChartBar },
    { title: "Finternet Wallet", url: "#", icon: IconWallet },
    { title: "Warehouses", url: "#", icon: IconBuildingWarehouse },
  ],
  navSecondary: [
    { title: "Yield History", url: "#", icon: IconHistory },
    { title: "Mandi Locator", url: "#", icon: IconMapPin },
    { title: "Settings", url: "#", icon: IconSettings },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props} className="bg-[#fcfbf9]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-green-50">
              <a href="#">
                <div className="size-8 rounded-lg bg-green-800 flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-lg font-bold text-green-900">CropLock</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="mt-auto px-2 py-4">
          <div className="rounded-xl bg-green-900 p-4 text-white">
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Instant Credit</p>
            <p className="text-lg font-bold">₹8.5 Lakhs</p>
            <button className="mt-2 w-full rounded-lg bg-white/20 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors">Withdraw Now</button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}