"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, Cell } from "recharts";
import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

export interface HighlightedBarChartProps<T = any> {
  title: string
  data: T[]
  xKey: keyof T & string
  yKey: keyof T & string
  description?: string
  valueLabel?: string
  growthPercent?: number
  color?: string // CSS color value or var(--chart-x)
  patternId?: string
  shortLabel?: (raw: any) => string
  formatValue?: (v: number) => string
}

export function HighlightedBarChart<T extends Record<string, any>>({
  title,
  data,
  xKey,
  yKey,
  description,
  valueLabel = 'Value',
  growthPercent,
  color = 'var(--chart-1)',
  patternId = 'highlighted-pattern-dots',
  shortLabel = (v: any) => (typeof v === 'string' ? v.slice(0, 3) : v),
  formatValue = (v: number) => v.toString()
}: HighlightedBarChartProps<T>) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const activeData = React.useMemo(() => (activeIndex == null ? null : data[activeIndex]), [activeIndex, data])

  const chartConfig: ChartConfig = {
    series: { label: valueLabel, color }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {typeof growthPercent === 'number' && (
            <Badge variant="outline" className={growthPercent >= 0 ? 'text-green-500 bg-green-500/10 border-none' : 'text-red-500 bg-red-500/10 border-none'}>
              <TrendingUp className="h-4 w-4" />
              <span>{growthPercent}%</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {activeData
            ? `${activeData[xKey]}: ${formatValue(Number(activeData[yKey]))}`
            : description || ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data} onMouseLeave={() => setActiveIndex(null)}>
            <rect x="0" y="0" width="100%" height="85%" fill={`url(#${patternId})`} />
            <defs>
              <DottedBackgroundPattern id={patternId} />
            </defs>
            <XAxis dataKey={xKey} tickLine={false} tickMargin={10} axisLine={false} tickFormatter={shortLabel as any} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey={yKey} radius={4} fill="var(--color-series)">
              {data.map((_, index) => (
                <Cell
                  className="duration-200"
                  key={`cell-${index}`}
                  fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3}
                  stroke={activeIndex === index ? 'var(--color-series)' : ''}
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const DottedBackgroundPattern = ({ id }: { id: string }) => (
  <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
  </pattern>
)
