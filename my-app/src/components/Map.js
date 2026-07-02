import React, { useRef, useEffect, useState } from 'react';

// Map Imports
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import * as turf from '@turf/turf';

// Cache to prevent redundant geocoding requests across re-renders
const geocodeCache = new Map();

function ShelterMap({data}){
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-79.34);
    const [lat, setLat] = useState(43.65);
    const [zoom, setZoom] = useState(9);
    const [markers, setMarkers] = useState([]); 
    const [loadingMarkers, setLoadingMarkers] = useState(true);

    // Function to find the nearest marker
    function findNearestMarker(lat, lng) {
      let nearestMarker = null;
      let nearestDistance = Infinity;
      markers.forEach(markerData => {
        const distance = turf.distance(turf.point([lng, lat]), turf.point(markerData.coordinates));
        if (distance < nearestDistance) {
            nearestMarker = markerData;
            nearestDistance = distance;
        }
    });
    return nearestMarker;
    }

    useEffect(() => {
        if (map.current){
          map.current.remove();
        }
        if (process.env.REACT_APP_MAPBOX) {
            mapboxgl.accessToken = process.env.REACT_APP_MAPBOX;
        }
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom
        });
        map.current.on('load', () => {
          const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken, // Set the access token
            mapboxgl: mapboxgl, // Set the mapbox-gl instance
            marker: true, // Use the geocoder's default marker style
            bbox: [-79.931030, 43.325178, -78.975220, 44.087585] // Set the bounding box to the GTA
          });
          
          // Add the geocoder to the map
          map.current.addControl(geocoder, 'top-right');

          // Add an event listener when an address is selected
          geocoder.on('result', (event) => {
            if (loadingMarkers) {
              alert("Markers are still loading.");
              //return;
            }
            console.log("Current Markers:", markers)
            const searchResult = event.result.geometry.coordinates;
            console.log("geocoder "+searchResult)
            // Get the nearest marker
            let nearest = findNearestMarker(searchResult[1],searchResult[0]);
            console.log("nearest "+nearest)
            // Open the popup
            if (nearest) {
              nearest.marker.togglePopup(); 
            }
          });
        });
        
        // Adjust the lat and long displayed on the site when map is moved 
        map.current.on('move', () => {
          setLng(map.current.getCenter().lng.toFixed(4));
          setLat(map.current.getCenter().lat.toFixed(4));
          setZoom(map.current.getZoom().toFixed(2));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);
    
    useEffect(() => {
      // add markers to map
      const addMarkers = async () => {
        if (data && data.length > 0) {
            const localMarkers = [];
            const uniqueAddresses = new Set();
            const addressToShelters = new Map();

            // Group shelters by address
            for (const entry of data) {
                if (entry.data) {
                    for (const org of entry.data) {
                        if (!org.address) continue;
                        uniqueAddresses.add(org.address);
                        if (!addressToShelters.has(org.address)) {
                            addressToShelters.set(org.address, []);
                        }
                        addressToShelters.get(org.address).push(org);
                    }
                }
            }

            // Identify addresses that need geocoding
            const uncachedAddresses = Array.from(uniqueAddresses).filter(addr => !geocodeCache.has(addr));
            
            // Geocode uncached addresses concurrently (with a basic concurrency limit if needed, but Promise.all is fine for ~200)
            if (uncachedAddresses.length > 0) {
                await Promise.all(uncachedAddresses.map(async (address) => {
                    try {
                        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`);
                        const geocodingData = await response.json();
                        if (geocodingData.features && geocodingData.features.length > 0) {
                            geocodeCache.set(address, geocodingData.features[0].center);
                        }
                    } catch (error) {
                        console.error('Error geocoding address:', address, error);
                    }
                }));
            }

            // Create markers
            for (const address of uniqueAddresses) {
                const coordinates = geocodeCache.get(address);
                if (coordinates) {
                    const shelters = addressToShelters.get(address) || [];
                    // Create a composite HTML string if multiple shelters are at the same address
                    const popupHtml = shelters.map(org => `<h3>${org.name}</h3><p>${org.address}</p>`).join('<hr/>');
                    
                    const marker = new mapboxgl.Marker()
                      .setLngLat(coordinates)
                      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
                      .addTo(map.current);
                      
                    localMarkers.push({
                        coordinates: coordinates,
                        marker: marker
                    });
                }
            }
            
            setMarkers(localMarkers);
            setLoadingMarkers(false);
        } else {
          console.log("error loading markers or no data");
        }
      };
      addMarkers();
    }, [data]);
    return(
        <div>
            <div className="sidebar">
                Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
            <div ref={mapContainer} className="map-container" />
        </div>
    );
}
export default ShelterMap