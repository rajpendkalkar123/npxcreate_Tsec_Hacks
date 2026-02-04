"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartData = [
  { date: "2024-06-01", wheat: 2150, paddy: 1850 },
  { date: "2024-06-05", wheat: 2180, paddy: 1860 },
  { date: "2024-06-10", wheat: 2205, paddy: 1840 },
  { date: "2024-06-15", wheat: 2240, paddy: 1890 },
  { date: "2024-06-20", wheat: 2275, paddy: 1910 },
  { date: "2024-06-25", wheat: 2260, paddy: 1930 },
  { date: "2024-06-30", wheat: 2310, paddy: 1950 },
]

const chartConfig = {
  prices: { label: "Market Price (₹)" },
  wheat: { label: "Wheat", color: "#2e7d32" },
  paddy: { label: "Paddy", color: "#d9bc5d" },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  return (
    <Card className="@container/card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-zinc-800">Market Price Trends</CardTitle>
        <CardDescription>Real-time commodity price tracking per Quintal</CardDescription>
        <CardAction>
          <ToggleGroup type="single" value={timeRange} onValueChange={setTimeRange} variant="outline" className="hidden @[767px]/card:flex">
            <ToggleGroupItem value="90d">90 Days</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Days</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillWheat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} />
            <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area dataKey="paddy" type="monotone" fill="transparent" stroke="#d9bc5d" strokeWidth={2} />
            <Area dataKey="wheat" type="monotone" fill="url(#fillWheat)" stroke="#2e7d32" strokeWidth={3} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}