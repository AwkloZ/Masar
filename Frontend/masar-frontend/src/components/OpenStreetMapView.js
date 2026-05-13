import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const OpenStreetMapView = ({ markers = [], onMapPress, style, readOnly = false, hidePins = false, setScrollEnabled, userLocation }) => {
    const webViewRef = useRef(null);

    const generateMapHTML = () => {
        const sc = '<scr' + 'ipt';
        const ec = '</scr' + 'ipt>';

        const customIconJS = `
      var dotIcon = L.divIcon({
        html: '<div style="background:#E53935;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.5);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
        className: ''
      });
    `;

        const markersJS = hidePins ? '' : markers.map((marker, index) => `
      L.marker([${marker.latitude}, ${marker.longitude}], { icon: dotIcon })
        .addTo(map)
        .bindPopup('${index === 0 ? 'Start' : index === markers.length - 1 ? 'End' : 'Checkpoint ' + index}');
    `).join('\n');

        const latlngsJS = `var latlngs = [${markers.map(m => `[${m.latitude}, ${m.longitude}]`).join(',')}];`;
        const polylineJS = `if (latlngs.length > 1) { L.polyline(latlngs, {color: '#E53935', weight: 4}).addTo(map); }`;

        const clickJS = readOnly ? '' : `
      map.on('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapPress',
          coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng }
        }));
      });
    `;

        const fitBoundsJS = `
            if (latlngs.length > 1) { 
                map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [40, 40], maxZoom: 15 }); 
            } else if (latlngs.length === 1) {
                map.setView(latlngs[0], 15);
            }
        `;

        const centerLat = markers.length > 0 ? markers[markers.length - 1].latitude : (userLocation?.latitude || 24.0891);
        const centerLng = markers.length > 0 ? markers[markers.length - 1].longitude : (userLocation?.longitude || 38.0622);

        return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>${sc} src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">${ec}<style>body,html{margin:0;padding:0;height:100%;width:100%}#map{height:100%;width:100%}</style></head><body><div id="map"></div>${sc}>
      var map=L.map('map').setView([${centerLat},${centerLng}],15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
      ${customIconJS}
      ${markersJS}
      ${latlngsJS}
      ${polylineJS}
      ${clickJS}
      ${fitBoundsJS}
    ${ec}</body></html>`;
    };

    return (
        <View
            style={[styles.container, style]}
            onTouchStart={() => setScrollEnabled && setScrollEnabled(false)}
            onTouchEnd={() => setScrollEnabled && setScrollEnabled(true)}
            onTouchCancel={() => setScrollEnabled && setScrollEnabled(true)}
        >
            <WebView
                ref={webViewRef}
                key={markers.length + (readOnly ? 'ro' : 'edit') + (userLocation ? 'gps' : 'nogps')}
                source={{ html: generateMapHTML() }}
                style={styles.webview}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'mapPress' && onMapPress && !readOnly) onMapPress(data.coordinate);
                    } catch (error) { }
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
            />
        </View>
    );
};

const styles = StyleSheet.create({ container: { flex: 1 }, webview: { flex: 1 } });
export default OpenStreetMapView;