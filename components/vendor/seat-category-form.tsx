"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical } from "lucide-react"

export interface SeatCategoryConfig {
    name: string
    price: number
    color: string
    rows: string[]
    seatsPerRow: number
    aisleAfter: string
}

interface SeatCategoryFormProps {
    categories: SeatCategoryConfig[]
    onChange: (categories: SeatCategoryConfig[]) => void
}

const DEFAULT_COLORS = [
    "#f59e0b", // Amber - VIP
    "#22c55e", // Green - First Class
    "#3b82f6", // Blue - General
    "#8b5cf6", // Purple
    "#ef4444", // Red
]

const ROW_OPTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function SeatCategoryForm({ categories, onChange }: SeatCategoryFormProps) {
    const addCategory = () => {
        const newCategory: SeatCategoryConfig = {
            name: categories.length === 0 ? "VIP" :
                categories.length === 1 ? "First Class" : "General",
            price: categories.length === 0 ? 100 :
                categories.length === 1 ? 50 : 25,
            color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
            rows: [],
            seatsPerRow: 14,
            aisleAfter: "",
        }
        onChange([...categories, newCategory])
    }

    const removeCategory = (index: number) => {
        onChange(categories.filter((_, i) => i !== index))
    }

    const updateCategory = (index: number, updates: Partial<SeatCategoryConfig>) => {
        const updated = categories.map((cat, i) =>
            i === index ? { ...cat, ...updates } : cat
        )
        onChange(updated)
    }

    const toggleRow = (categoryIndex: number, row: string) => {
        const category = categories[categoryIndex]
        const newRows = category.rows.includes(row)
            ? category.rows.filter(r => r !== row)
            : [...category.rows, row].sort()
        updateCategory(categoryIndex, { rows: newRows })
    }

    // Get rows already used by other categories
    const getUsedRows = (excludeIndex: number): string[] => {
        return categories
            .filter((_, i) => i !== excludeIndex)
            .flatMap(c => c.rows)
    }

    return (
        <div className="space-y-4">
            {categories.map((category, index) => {
                const usedRows = getUsedRows(index)

                return (
                    <Card key={index} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <CardTitle className="text-base">{category.name || `Category ${index + 1}`}</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCategory(index)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Category Name */}
                                <div className="space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                        value={category.name}
                                        onChange={(e) => updateCategory(index, { name: e.target.value })}
                                        placeholder="VIP, First Class, General..."
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label>Price per Seat ($)</Label>
                                    <Input
                                        type="number"
                                        value={category.price}
                                        onChange={(e) => updateCategory(index, { price: Number(e.target.value) })}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Color */}
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={category.color}
                                            onChange={(e) => updateCategory(index, { color: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={category.color}
                                            onChange={(e) => updateCategory(index, { color: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                {/* Seats per Row */}
                                <div className="space-y-2">
                                    <Label>Seats per Row</Label>
                                    <Input
                                        type="number"
                                        value={category.seatsPerRow}
                                        onChange={(e) => updateCategory(index, { seatsPerRow: Number(e.target.value) })}
                                        min={1}
                                        max={30}
                                    />
                                </div>
                            </div>

                            {/* Row Selection */}
                            <div className="space-y-2">
                                <Label>Select Rows</Label>
                                <div className="flex flex-wrap gap-1">
                                    {ROW_OPTIONS.slice(0, 16).map(row => {
                                        const isSelected = category.rows.includes(row)
                                        const isUsed = usedRows.includes(row)

                                        return (
                                            <button
                                                key={row}
                                                type="button"
                                                onClick={() => !isUsed && toggleRow(index, row)}
                                                disabled={isUsed}
                                                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${isSelected
                                                        ? "text-white"
                                                        : isUsed
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                    }`}
                                                style={isSelected ? { backgroundColor: category.color } : {}}
                                            >
                                                {row}
                                            </button>
                                        )
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selected: {category.rows.join(", ") || "None"}
                                </p>
                            </div>

                            {/* Aisle Configuration */}
                            <div className="space-y-2">
                                <Label>Aisle After Seats (comma separated)</Label>
                                <Input
                                    value={category.aisleAfter}
                                    onChange={(e) => updateCategory(index, { aisleAfter: e.target.value })}
                                    placeholder="e.g., 3, 10 (adds gap after seat 3 and 10)"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            <Button
                type="button"
                variant="outline"
                onClick={addCategory}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Seat Category
            </Button>
        </div>
    )
}
