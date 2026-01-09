"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SeatCategoryPreview {
    name: string
    price: number
    color: string
    rows: string[]
    seatsPerRow: number
    aisleAfter?: string
}

interface SeatLayoutPreviewProps {
    categories: SeatCategoryPreview[]
}

export function SeatLayoutPreview({ categories }: SeatLayoutPreviewProps) {
    // Generate all rows from all categories
    const allRows = useMemo(() => {
        const rows = new Set<string>()
        for (const category of categories) {
            for (const row of category.rows) {
                rows.add(row)
            }
        }
        return Array.from(rows).sort()
    }, [categories])

    // Get category for a specific row
    const getCategoryForRow = (rowLabel: string): SeatCategoryPreview | undefined => {
        return categories.find(c => c.rows.includes(rowLabel))
    }

    // Parse aisle positions
    const getAislePositions = (aisleAfter?: string): number[] => {
        if (!aisleAfter) return []
        return aisleAfter.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Add seat categories to see preview</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Screen/Stage indicator */}
            <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-t-full px-12 py-2 text-xs font-medium text-primary">
                    STAGE / SCREEN
                </div>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map((category, index) => (
                    <Badge
                        key={index}
                        variant="outline"
                        style={{ borderColor: category.color, color: category.color }}
                    >
                        {category.name} - ${category.price}
                    </Badge>
                ))}
            </div>

            {/* Seat Grid Preview */}
            <div className="overflow-x-auto pb-4">
                <div className="flex flex-col items-center gap-0.5 min-w-fit mx-auto">
                    {allRows.map(rowLabel => {
                        const category = getCategoryForRow(rowLabel)
                        if (!category) return null

                        const aisles = getAislePositions(category.aisleAfter)

                        return (
                            <div key={rowLabel} className="flex items-center gap-0.5">
                                {/* Row Label */}
                                <div className="w-6 text-center font-bold text-muted-foreground text-xs">
                                    {rowLabel}
                                </div>

                                {/* Seats */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: category.seatsPerRow }, (_, i) => {
                                        const seatNumber = i + 1
                                        const needsAisle = aisles.includes(seatNumber)

                                        return (
                                            <div key={seatNumber} className="flex items-center">
                                                <div
                                                    className="w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center border-2 bg-white"
                                                    style={{ borderColor: category.color }}
                                                    title={`${rowLabel}${seatNumber}`}
                                                >
                                                    {seatNumber}
                                                </div>
                                                {/* Aisle gap */}
                                                {needsAisle && <div className="w-3" />}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Row Label (right side) */}
                                <div className="w-6 text-center font-bold text-muted-foreground text-xs">
                                    {rowLabel}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Summary */}
            <div className="text-center text-sm text-muted-foreground">
                Total: {allRows.length} rows × {categories[0]?.seatsPerRow || 0} seats = {
                    allRows.reduce((sum, row) => {
                        const cat = getCategoryForRow(row)
                        return sum + (cat?.seatsPerRow || 0)
                    }, 0)
                } seats
            </div>
        </div>
    )
}
