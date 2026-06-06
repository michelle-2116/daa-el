import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Custom SVG Icons
const normalTruckSvg = `
  <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#1E3A8A]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>
`;

const warningTruckSvg = `
  <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#EF4444]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>
`;

const rerouteIconSvg = `
  <div class="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-white"></div>
`;

export default function MapView({ telemetry, config }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  // Layer references for clean updates
  const layersRef = useRef({
    zones: {},
    nodes: [],
    edges: [],
    originalRoute: null,
    currentRoute: null,
    truckMarker: null,
    rerouteMarkers: []
  });

  // 1. Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    // Create Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [22.9734, 78.6569], // Central India coordinates
      zoom: 5,
      zoomControl: true,
      minZoom: 4,
      maxZoom: 9
    });

    // Dark styled OSM Tiles using CSS filters defined in index.css
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;
  }, []);

  // 2. Draw Static Graph Networks (Nodes & Edges) & Initialize Zones
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !config) return;

    const layers = layersRef.current;

    // Clear old graph drawings if any
    layers.nodes.forEach(m => map.removeLayer(m));
    layers.edges.forEach(l => map.removeLayer(l));
    layers.nodes = [];
    layers.edges = [];

    // Draw Highway Edges
    config.graph.edges.forEach(edge => {
      const sourceCity = config.cities.find(c => c.name === edge.source);
      const targetCity = config.cities.find(c => c.name === edge.target);
      if (sourceCity && targetCity) {
        const line = L.polyline(
          [[sourceCity.lat, sourceCity.lon], [targetCity.lat, targetCity.lon]],
          {
            color: "rgba(255, 255, 255, 0.08)",
            weight: 2,
            dashArray: "4, 4"
          }
        ).addTo(map);
        layers.edges.push(line);
      }
    });

    // Draw City Nodes
    config.cities.forEach(city => {
      const circle = L.circleMarker([city.lat, city.lon], {
        radius: 4,
        fillColor: "#111928",
        color: "rgba(255, 255, 255, 0.4)",
        weight: 1.5,
        fillOpacity: 1
      }).addTo(map);
      
      circle.bindTooltip(city.name, {
        permanent: false,
        direction: "top",
        className: "bg-slate-900 text-slate-100 border border-slate-700 font-sans text-xs px-2 py-1 rounded shadow-sm"
      });
      
      layers.nodes.push(circle);
    });

    // Initialize Zone Polygons
    Object.keys(layers.zones).forEach(id => map.removeLayer(layers.zones[id]));
    layers.zones = {};

    config.zones.forEach(zone => {
      const poly = L.polygon(zone.polygon, {
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: "3, 3"
      }).addTo(map);

      // Save references
      layers.zones[zone.id] = poly;
    });

  }, [config]);

  // 3. Handle live state updates: routes, truck position, reroute marks, zone colors
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !telemetry || !config) return;

    const layers = layersRef.current;

    // A. Update Zone Colors based on live temperatures
    config.zones.forEach(zone => {
      const poly = layers.zones[zone.id];
      if (poly) {
        const liveTemp = telemetry.zones_temperatures[zone.id] ?? zone.default_temp;
        
        let color = "#10B981"; // Safe default
        if (liveTemp <= 15.0) {
          color = "#3B82F6"; // Cool (Blue)
        } else if (liveTemp <= 32.0) {
          color = "#F59E0B"; // Moderate (Yellow/Amber)
        } else {
          color = "#EF4444"; // Dangerous (Red)
        }
        
        poly.setStyle({
          color: color,
          fillColor: color
        });

        // Dynamic label tooltip on polygon hover
        poly.unbindTooltip();
        poly.bindTooltip(`${zone.name}: ${liveTemp.toFixed(1)}°C`, {
          sticky: true,
          className: "bg-slate-900 text-slate-100 border border-slate-700 font-sans text-xs px-2 py-1 rounded shadow-sm"
        });
      }
    });

    // B. Draw Route Polylines
    // Clear old route lines
    if (layers.originalRoute) map.removeLayer(layers.originalRoute);
    if (layers.currentRoute) map.removeLayer(layers.currentRoute);
    
    // Draw Original Route (Red)
    if (telemetry.original_route_coords && telemetry.original_route_coords.length > 0) {
      layers.originalRoute = L.polyline(telemetry.original_route_coords, {
        color: "#EF4444",
        weight: 3.5,
        opacity: 0.65,
        dashArray: "1, 8"
      }).addTo(map);
    }

    // Draw Current Active Route (Green/Emerald)
    if (telemetry.route_coords && telemetry.route_coords.length > 0) {
      layers.currentRoute = L.polyline(telemetry.route_coords, {
        color: "#10B981",
        weight: 4.5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);
    }

    // C. Draw Truck Icon
    if (layers.truckMarker) map.removeLayer(layers.truckMarker);

    const isAnomaly = telemetry.active_anomaly !== null || !telemetry.cooling_active || telemetry.internal_temp > telemetry.temp_threshold;
    const truckIcon = L.divIcon({
      html: isAnomaly ? warningTruckSvg : normalTruckSvg,
      className: "custom-truck-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const truckPos = [telemetry.truck_position.lat, telemetry.truck_position.lon];
    layers.truckMarker = L.marker(truckPos, { icon: truckIcon }).addTo(map);

    // Bind tooltip showing telemetry on truck marker
    layers.truckMarker.bindTooltip(
      `🚚 Temp: ${telemetry.internal_temp.toFixed(1)}°C<br/>Zone: ${telemetry.current_zone_name}<br/>Speed: ${telemetry.truck_speed_kmh * telemetry.speed_multiplier} km/h`,
      {
        permanent: false,
        direction: "top",
        className: "bg-slate-900 text-slate-100 border border-slate-700 font-sans text-xs px-2.5 py-1.5 rounded shadow-md"
      }
    );

    // Pan map to truck if it moves and we want auto-center
    // map.panTo(truckPos);

    // D. Draw Reroute Event Points
    layers.rerouteMarkers.forEach(m => map.removeLayer(m));
    layers.rerouteMarkers = [];

    if (telemetry.reroute_points) {
      telemetry.reroute_points.forEach((point, i) => {
        const pingIcon = L.divIcon({
          html: rerouteIconSvg,
          className: "reroute-ping-icon",
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const mark = L.marker(point, { icon: pingIcon }).addTo(map);
        mark.bindTooltip(`Reroute Event #${i+1}<br/>Safe routing activated`, {
          className: "bg-slate-900 text-red-200 border border-red-800 font-sans text-xs px-2 py-1 rounded shadow-sm"
        });
        layers.rerouteMarkers.push(mark);
      });
    }

  }, [telemetry, config]);

  return (
    <div className="w-full h-full relative border border-brand-glassBorder rounded-lg overflow-hidden bg-white flex flex-col">
      <div ref={mapContainerRef} className="flex-1 w-full min-h-[480px]" />
      
      {/* Map Legends Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white px-3 py-2 rounded border border-slate-200 text-[11px] space-y-1.5 pointer-events-none shadow-sm">
        <div className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">Temperature Risk Zones</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] opacity-80"></span>
          <span className="text-slate-700">Cool (&le; 15&deg;C)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] opacity-80"></span>
          <span className="text-slate-700">Moderate (15-32&deg;C)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] opacity-80"></span>
          <span className="text-slate-700">Dangerous (&gt; 32&deg;C)</span>
        </div>
        <hr className="border-slate-200 my-1" />
        <div className="flex items-center space-x-2">
          <span className="w-4 h-0.5 bg-[#10B981]"></span>
          <span className="text-slate-700">Active Route</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-4 h-0.5 border-t border-dashed border-[#EF4444]"></span>
          <span className="text-slate-700">Original Route</span>
        </div>
      </div>
    </div>
  );
}
