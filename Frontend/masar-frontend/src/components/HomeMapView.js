import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const HomeMapView = ({ tracks = [], onTrackPress, userLocation }) => {
    const webViewRef = useRef(null);

    const generateMapHTML = () => {
        const markers = tracks
            .map(t => {
                let lat = parseFloat(t.Latitude || t.latitude);
                let lng = parseFloat(t.Longitude || t.longitude);

                if (t.RoutePoints) {
                    try {
                        const pts = typeof t.RoutePoints === 'string' ? JSON.parse(t.RoutePoints) : t.RoutePoints;
                        if (pts && pts.length > 0) {
                            lat = parseFloat(pts[0].latitude);
                            lng = parseFloat(pts[0].longitude);
                        }
                    } catch (e) { }
                }

                return {
                    id: t.TrackID,
                    lat: lat,
                    lng: lng,
                    name: t.TrackName || 'Unknown Track',
                    city: t.City || '',
                    rating: t.Rating || 0,
                    sports: (t.sportTypes || []).map(s => s.SportName).join(', ')
                };
            })
            .filter(m => !isNaN(m.lat) && !isNaN(m.lng));

        const centerLat = userLocation?.latitude || 24.7136;
        const centerLng = userLocation?.longitude || 46.6753;
        const zoomLevel = userLocation ? 12 : 5;

        return `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  body { margin: 0; padding: 0; }
  #map { width: 100%; height: 100vh; }
  .popup-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; font-family: sans-serif; }
  .popup-meta { font-size: 12px; color: #666; font-family: sans-serif; }
.popup-btn { display: inline-block; margin-top: 8px; padding: 6px 12px; background: #2E7D32; color: #FFFFFF !important; border-radius: 6px; text-decoration: none !important; font-size: 12px; font-family: sans-serif; font-weight: bold; }</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoomLevel});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  var greenIcon = L.divIcon({
    html: '<div style="background:#2E7D32;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
    className: ''
  });

  var markersData = ${JSON.stringify(markers)};
  var bounds = [];
  
  markersData.forEach(function(m) {
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < m.rating ? '★' : '☆';
    var popup = '<div class="popup-title">' + m.name + '</div>'
      + '<div class="popup-meta">' + m.city + '</div>'
      + '<div class="popup-meta" style="color:#FFC107">' + stars + '</div>'
      + (m.sports ? '<div class="popup-meta">' + m.sports + '</div>' : '')
      + '<a class="popup-btn" href="#" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({trackId:' + m.id + '}));return false;">View Details</a>';
    
    L.marker([m.lat, m.lng], { icon: greenIcon }).addTo(map).bindPopup(popup);
    bounds.push([m.lat, m.lng]);
  });

  ${userLocation ? '' : 'if (bounds.length > 0) { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }); }'}
</script>
</body></html>`;
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                key={tracks.length + (userLocation ? 'gps' : 'nogps')}
                source={{ html: generateMapHTML() }}
                style={styles.map}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.trackId && onTrackPress) onTrackPress(data.trackId);
                    } catch (e) { }
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
            />
        </View>
    );
};

const styles = StyleSheet.create({ container: { flex: 1 }, map: { flex: 1 } });
export default HomeMapView;