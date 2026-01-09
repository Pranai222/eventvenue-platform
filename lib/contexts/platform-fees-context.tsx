"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { adminApi, type PlatformFees } from '@/lib/api/admin'

interface PlatformFeesContextType {
    platformFees: PlatformFees
    isLoading: boolean
    refreshFees: () => Promise<void>
}

const defaultFees: PlatformFees = {
    userPlatformFeePoints: 2,
    venueCreationPoints: 10,
    eventCreationPointsQuantity: 10,
    eventCreationPointsSeat: 20,
}

const PlatformFeesContext = createContext<PlatformFeesContextType>({
    platformFees: defaultFees,
    isLoading: true,
    refreshFees: async () => { },
})

export function PlatformFeesProvider({ children }: { children: React.ReactNode }) {
    const [platformFees, setPlatformFees] = useState<PlatformFees>(defaultFees)
    const [isLoading, setIsLoading] = useState(true)

    const fetchFees = async () => {
        try {
            const fees = await adminApi.getPlatformFees()
            setPlatformFees(fees)
        } catch (error: any) {
            if (error?.status !== 401 && !error?.message?.includes('Unauthorized')) {
                console.error('[PlatformFees] Failed to fetch:', error)
            }
            setPlatformFees(defaultFees)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFees()
        const interval = setInterval(fetchFees, 30000)
        const handleFocus = () => fetchFees()
        window.addEventListener('focus', handleFocus)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    return (
        <PlatformFeesContext.Provider value={{ platformFees, isLoading, refreshFees: fetchFees }}>
            {children}
        </PlatformFeesContext.Provider>
    )
}

export function usePlatformFees() {
    const context = useContext(PlatformFeesContext)
    if (!context) {
        throw new Error('usePlatformFees must be used within PlatformFeesProvider')
    }
    return context
}
