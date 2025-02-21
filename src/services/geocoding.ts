interface GeocodingResult {
    lat: string;
    lon: string;
    display_name: string;
}

export async function geocodeAddress(address: string): Promise<{latitude: string; longitude: string}> {
    try {
        const encodedQuery = encodeURIComponent(address);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'VSCode-GrubhubExtension/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to geocode address');
        }

        const results = await response.json() as GeocodingResult[];
        if (!results.length) {
            throw new Error('Address not found');
        }

        return {
            latitude: results[0].lat,
            longitude: results[0].lon
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
} 