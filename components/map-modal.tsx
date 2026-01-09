"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface MapModalProps {
    currentAddress: string
    onSelect: (address: string, lat: number, lng: number) => void
    onClose: () => void
}

const libraries: ("places" | "geometry")[] = ["places"]

const mapContainerStyle = {
    width: '100%',
    height: '500px'
}

const defaultCenter = {
    lat: 28.6139, // Delhi, India
    lng: 77.2090
}

export default function MapModal({ currentAddress, onSelect, onClose }: MapModalProps) {
    const [markerPosition, setMarkerPosition] = useState(defaultCenter)
    const [selectedAddress, setSelectedAddress] = useState(currentAddress)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    // Geocode the current address on mount
    useEffect(() => {
        if (isLoaded && currentAddress && window.google) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ address: currentAddress }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location
                    const newPos = { lat: location.lat(), lng: location.lng() }
                    setMarkerPosition(newPos)
                    if (map) {
                        map.panTo(newPos)
                    }
                }
            })
        }
    }, [isLoaded, currentAddress, map])

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()
            setMarkerPosition({ lat, lng })

            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    setSelectedAddress(results[0].formatted_address)
                }
            })
        }
    }, [])

    const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()
            setMarkerPosition({ lat, lng })

            // Reverse geocode
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    setSelectedAddress(results[0].formatted_address)
                }
            })
        }
    }, [])

    const onPlaceChanged = useCallback(() => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace()
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                const newPos = { lat, lng }
                setMarkerPosition(newPos)
                setSelectedAddress(place.formatted_address || place.name || '')

                if (map) {
                    map.panTo(newPos)
                    map.setZoom(15)
                }
            }
        }
    }, [map])

    const handleConfirm = () => {
        onSelect(selectedAddress, markerPosition.lat, markerPosition.lng)
    }

    if (loadError) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Maps</h3>
                    <p className="text-gray-600 mb-4">
                        Please add your Google Maps API key to .env.local:
                    </p>
                    <code className="block bg-gray-100 p-3 rounded text-sm mb-4">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
                    </code>
                    <p className="text-sm text-gray-500 mb-4">
                        Get your free API key at: <br />
                        <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 hover:underline">
                            console.cloud.google.com
                        </a>
                    </p>
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
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
                <div className="p-4 border-b">
                    <Autocomplete
                        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search for a place..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </Autocomplete>
                </div>

                {/* Map */}
                <div className="relative">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={13}
                        center={markerPosition}
                        onClick={onMapClick}
                        onLoad={setMap}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        <Marker
                            position={markerPosition}
                            draggable={true}
                            onDragEnd={onMarkerDragEnd}
                        />
                    </GoogleMap>
                </div>

                {/* Selected Address */}
                <div className="p-4 bg-gray-50 border-t">
                    <p className="text-sm text-gray-600 mb-1">Selected Location:</p>
                    <p className="font-medium text-gray-900">{selectedAddress || 'Click on map to select'}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAddress}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    )
}
