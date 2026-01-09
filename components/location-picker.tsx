"use client"

import { useState } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import MapModal from './map-modal'

interface LocationPickerProps {
    value: string
    onChange: (address: string, latitude?: number, longitude?: number) => void
    label?: string
    placeholder?: string
    required?: boolean
    error?: string
}

export default function LocationPicker({
    value,
    onChange,
    label = "Location",
    placeholder = "Enter address or click map icon to select",
    required = false,
    error
}: LocationPickerProps) {
    const [showMap, setShowMap] = useState(false)
    const [address, setAddress] = useState(value)

    const handleAddressChange = (newAddress: string) => {
        setAddress(newAddress)
        onChange(newAddress)
    }

    const handleLocationSelect = (selectedAddress: string, lat: number, lng: number) => {
        setAddress(selectedAddress)
        onChange(selectedAddress, lat, lng)
        setShowMap(false)
    }

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
                        }`}
                />

                <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                    title="Select location on map"
                >
                    <MapPinIcon className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {showMap && (
                <MapModal
                    currentAddress={address}
                    onSelect={handleLocationSelect}
                    onClose={() => setShowMap(false)}
                />
            )}
        </div>
    )
}
