"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
// import 'leaflet/dist/leaflet.css' - Moved to layout.tsx
// import L from 'leaflet' - Removed to prevent SSR issues

// Fix for default markers - moved inside component

// Dynamically import map components
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
)
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
)

// Helper for map events (click to pick location)
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    const { useMapEvents } = require('react-leaflet')
    useMapEvents({
        click(e: any) {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

// Helper to update map view programmatically
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const { useMap } = require('react-leaflet')
    const map = useMap()
    map.setView(center, zoom)
    return null
}

// Use a simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface MapModalProps {
    currentAddress: string
    onSelect: (address: string, lat: number, lng: number) => void
    onClose: () => void
}

export default function MapModal({ currentAddress, onSelect, onClose }: MapModalProps) {
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]) // Default: Delhi
    const [markerPos, setMarkerPos] = useState<[number, number]>([28.6139, 77.2090])
    const [query, setQuery] = useState(currentAddress || "")
    const [selectedAddress, setSelectedAddress] = useState(currentAddress || "")
    const [isSearching, setIsSearching] = useState(false)
    const [leafletIcon, setLeafletIcon] = useState<any>(null)

    // Debounce the search query
    const debouncedQuery = useDebounce(query, 1500)

    // Initial load
    useEffect(() => {
        if (currentAddress) {
            handleSearch(currentAddress)
        }

        // Dynamically load Leaflet for icon to prevent SSR issues
        import('leaflet').then((L) => {
            const icon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            setLeafletIcon(icon)
        })
    }, [])

    // Effect: Trigger search when debounced query changes
    // Only if the user typed something new (and it's not just the address we just set from a map click)
    // To distinguish manual typing vs map click updates, we can check if query !== selectedAddress
    // But simplest is just to search if query is valid and different from last search.
    useEffect(() => {
        if (debouncedQuery && debouncedQuery !== selectedAddress) {
            handleSearch(debouncedQuery)
        }
    }, [debouncedQuery])

    const handleSearch = async (searchText: string) => {
        if (!searchText) return;
        setIsSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`,
                { headers: { 'User-Agent': 'EventVenuePlatform/1.0' } }
            )
            const data = await response.json()
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat)
                const lon = parseFloat(data[0].lon)
                setCenter([lat, lon])
                setMarkerPos([lat, lon])
                // We typically don't update 'query' here to avoid loops if this was triggered by query change
                // But we should update selectedAddress
                // setSelectedAddress(searchText) // Optional, keeps it in sync
            }
        } catch (error) {
            console.error("Search failed:", error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleMapClick = async (lat: number, lng: number) => {
        setMarkerPos([lat, lng])
        // Reverse Geocode
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'User-Agent': 'EventVenuePlatform/1.0' } }
            )
            const data = await response.json()
            if (data && data.display_name) {
                const address = data.display_name
                setQuery(address)
                setSelectedAddress(address)
            }
        } catch (error) {
            console.error("Reverse geocode failed:", error)
        }
    }

    const handleConfirm = () => {
        onSelect(selectedAddress || query, markerPos[0], markerPos[1])
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Location</h2>
                        <p className="text-blue-100 text-sm">Click on map or search for a place</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b flex-shrink-0">
                    <div className="relative">
                        <MagnifyingGlassIcon className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search for a place (e.g. Hyderabad)..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {isSearching && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                Searching...
                            </span>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="relative w-full h-[500px] bg-gray-100">
                    <MapContainer
                        center={center}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {leafletIcon && <Marker position={markerPos} icon={leafletIcon} />}
                        <MapEvents onMapClick={handleMapClick} />
                        <ChangeView center={center} zoom={13} />
                    </MapContainer>
                </div>

                {/* Selected Address */}
                <div className="p-4 bg-gray-50 border-t flex-shrink-0">
                    <p className="text-sm text-gray-600 mb-1">Selected Location:</p>
                    <p className="font-medium text-gray-900 line-clamp-2">
                        {selectedAddress || query || 'Click on map to select'}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAddress && !query}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    )
}

