// src/components/section-cards.tsx
import { IconTrendingUp, IconGrain, IconWallet, IconScale } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>eWR Tokens (Wheat)</CardDescription>
          <CardTitle className="text-2xl font-semibold">450.00 MT</CardTitle>
          <CardAction><Badge variant="outline"><IconTrendingUp /> +2.5%</Badge></CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Current digitized stock</CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Total Asset Value</CardDescription>
          <CardTitle className="text-2xl font-semibold">₹12,45,000</CardTitle>
          <CardAction><Badge variant="outline"><IconTrendingUp /> +12%</Badge></CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Based on current market price</CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Instant Liquidity</CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-700">₹8,50,000</CardTitle>
          <CardAction><Badge variant="outline">Available</Badge></CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Collateralized via Finternet</CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Market Price (per Qtl)</CardDescription>
          <CardTitle className="text-2xl font-semibold">₹2,275</CardTitle>
          <CardAction><Badge variant="outline">+₹45 Today</Badge></CardAction>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">Updated from Mandi rates</CardFooter>
      </Card>
    </div>
  )
}