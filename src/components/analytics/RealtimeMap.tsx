'use client';

import { useState, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

interface MarkerData {
  location: [number, number]; // [lat, lon]
  size: number;
  country?: string;
  city?: string;
  label?: string; // עיר, מדינה או רק מדינה
  count?: number;
}

interface RealtimeMapProps {
  markers: Array<MarkerData>;
}

// URL למפת העולם
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export const RealtimeMap = memo(function RealtimeMap({ markers }: RealtimeMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // מציאת מרכז המפה - אם יש markers, נתמקד על הראשון, אחרת על ישראל
  const center: [number, number] = markers.length > 0 
    ? [markers[0].location[1], markers[0].location[0]] // [lon, lat] for react-simple-maps
    : [35.2137, 31.7683]; // ישראל

  const handleMarkerHover = (marker: MarkerData, event: React.MouseEvent) => {
    setHoveredMarker(marker);
    setTooltipPos({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="w-full h-full relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 150,
          center: center,
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ZoomableGroup center={center} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .filter((geo) => geo.properties.name !== 'Antarctica') // הסרת אנטרטיקה
                .map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E8E8E8"
                    stroke="#D6D6D6"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#D4D4D4', outline: 'none' },
                      pressed: { fill: '#BFBFBF', outline: 'none' },
                    }}
                  />
                ))
            }
          </Geographies>
          
          {/* Markers */}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinates={[marker.location[1], marker.location[0]]} // [lon, lat]
              onMouseEnter={(e) => handleMarkerHover(marker, e as unknown as React.MouseEvent)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              <circle
                r={Math.max(6, marker.count ? marker.count * 4 : 6)}
                fill="#4F46E5"
                fillOpacity={0.7}
                stroke="#ffffff"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              />
              {/* Pulse animation */}
              <circle
                r={Math.max(8, marker.count ? marker.count * 5 : 8)}
                fill="none"
                stroke="#4F46E5"
                strokeWidth={1}
                opacity={0.5}
              >
                <animate
                  attributeName="r"
                  from={Math.max(6, marker.count ? marker.count * 4 : 6)}
                  to={Math.max(20, marker.count ? marker.count * 8 : 20)}
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {hoveredMarker && hoveredMarker.count !== undefined && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl pointer-events-none text-sm"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-bold mb-0.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {hoveredMarker.count} מבקרים
          </div>
          {hoveredMarker.label && (
            <div className="text-xs text-gray-300 text-center">
              {hoveredMarker.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

