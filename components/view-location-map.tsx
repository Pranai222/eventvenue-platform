"use client"

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
// import L from 'leaflet' - Removed to prevent SSR window error

// Fix for default markers - Moved inside component


// Dynamically import map components to avoid SSR issues
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
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
)

// Helper component to update map view
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const { useMap } = require('react-leaflet')
    const map = useMap()
    map.setView(center, zoom)
    return null
}

interface ViewLocationMapProps {
    address: string
    onClose: () => void
}

export default function ViewLocationMap({ address, onClose }: ViewLocationMapProps) {
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [leafletIcon, setLeafletIcon] = useState<any>(null)

    useEffect(() => {
        // Dynamically load Leaflet and create icon to avoid SSR "window not defined"
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

    useEffect(() => {
        const geocodeAddress = async () => {
            if (!address) {
                setLoading(false)
                return
            }

            try {
                // Nominatim API Search
                // Add a small delay/debounce if needed, but for "view" mode usually fine to call once
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                    { headers: { 'User-Agent': 'EventVenuePlatform/1.0' } }
                )

                const data = await response.json()

                if (data && data.length > 0) {
                    setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                } else {
                    // Fallback: Try searching just the city part if the full address fails
                    // Simple heuristic: take the last part of the string if it looks like "City, Country"
                    // Or just fail gracefully
                    setError('Location not found on map')
                }
            } catch (err) {
                console.error("Geocoding error:", err)
                setError('Failed to load location')
            } finally {
                setLoading(false)
            }
        }

        geocodeAddress()
    }, [address])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Location</h2>
                        <p className="text-green-100 text-sm line-clamp-1">{address}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="relative w-full h-[400px] bg-gray-100">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                            <p>{error}</p>
                            <p className="text-sm mt-2">({address})</p>
                        </div>
                    )}

                    {!loading && position && (
                        <MapContainer
                            center={position}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={position} icon={leafletIcon}>
                                <Popup>
                                    {address}
                                </Popup>
                            </Marker>
                            <ChangeView center={position} zoom={15} />
                        </MapContainer>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center flex-shrink-0">
                    <div className="text-sm text-gray-600 max-w-[70%]">
                        <p className="font-medium truncate">{address}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

