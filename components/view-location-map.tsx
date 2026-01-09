"use client"

import { useState } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ViewLocationMapProps {
    address: string
    onClose: () => void
}

const libraries: ("places" | "geometry")[] = ["places"]

const mapContainerStyle = {
    width: '100%',
    height: '400px'
}

const defaultCenter = {
    lat: 28.6139, // Delhi, India
    lng: 77.2090
}

export default function ViewLocationMap({ address, onClose }: ViewLocationMapProps) {
    const [markerPosition, setMarkerPosition] = useState(defaultCenter)
    const [map, setMap] = useState<google.maps.Map | null>(null)

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    // Geocode address when component loads
    useState(() => {
        if (isLoaded && address && window.google) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location
                    const position = { lat: location.lat(), lng: location.lng() }
                    setMarkerPosition(position)
                    if (map) {
                        map.panTo(position)
                        map.setZoom(15)
                    }
                }
            })
        }
    })

    if (loadError) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Map</h3>
                    <p className="text-gray-600 mb-4">Could not load Google Maps. Please check your API key configuration.</p>
                    <button onClick={onClose} className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                        Close
                    </button>
                </div>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading map...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Location</h2>
                        <p className="text-green-100 text-sm">{address}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Map */}
                <div className="relative">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={15}
                        center={markerPosition}
                        onLoad={setMap}
                        options={{
                            streetViewControl: true,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        <Marker position={markerPosition} />
                    </GoogleMap>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <p className="font-medium">{address}</p>
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
