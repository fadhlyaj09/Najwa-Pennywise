
"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { Transaction } from "@/lib/types"
import { getWeek, parseISO } from "date-fns"
import { formatRupiah } from "@/lib/utils"

interface WeeklyChartProps {
  transactions: Transaction[]
}

const WeeklyChart = ({ transactions }: WeeklyChartProps) => {
  const chartData = useMemo(() => {
    const dataByWeek: { [key: string]: { week: string; income: number; expenses: number } } = {}

    transactions.forEach(t => {
      const weekNumber = getWeek(parseISO(t.date))
      const weekKey = `Week ${weekNumber}`

      if (!dataByWeek[weekKey]) {
        dataByWeek[weekKey] = { week: weekKey, income: 0, expenses: 0 }
      }

      if (t.type === "income") {
        dataByWeek[weekKey].income += t.amount
      } else {
        dataByWeek[weekKey].expenses += t.amount
      }
    })

    return Object.values(dataByWeek).sort((a,b) => parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1]));
  }, [transactions])

  const chartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-2))" },
    expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Overview</CardTitle>
        <CardDescription>Income vs. Expenses by Week</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(tick) => formatRupiah(tick, { short: true })}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" formatter={(value, name) => `${name}: ${formatRupiah(value as number)}`} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-sm font-semibold">No data to display</p>
              <p className="text-xs text-muted-foreground">Add transactions to see your weekly chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WeeklyChart

    