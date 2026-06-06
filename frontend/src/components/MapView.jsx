import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Custom SVG Icons
const normalTruckSvg = `
  <div class="flex items-center justify-center w-7 h-7 rounded bg-white border border-[#0284c7]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
      <rect x="1" y="3" width="15" height="13" rx="1" ry="1"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>
`;

const warningTruckSvg = `
  <div class="flex items-center justify-center w-7 h-7 rounded bg-white border border-[#EF4444]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
      <rect x="1" y="3" width="15" height="13" rx="1" ry="1"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>
`;

const rerouteIconSvg = `
  <div class="w-2.5 h-2.5 rounded bg-[#F59E0B] border border-white"></div>
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

    // Grayscale styled OSM Tiles using CSS filters defined in index.css
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
            color: "#CBD5E1",
            weight: 1,
            dashArray: "3, 3"
          }
        ).addTo(map);
        layers.edges.push(line);
      }
    });

    // Draw City Nodes
    config.cities.forEach(city => {
      const circle = L.circleMarker([city.lat, city.lon], {
        radius: 3,
        fillColor: "#FFFFFF",
        color: "#94A3B8",
        weight: 1.2,
        fillOpacity: 1
      }).addTo(map);
      
      circle.bindTooltip(city.name, {
        permanent: false,
        direction: "top",
        className: "bg-white text-slate-800 border border-slate-200 font-mono text-[9px] px-1 rounded shadow-none"
      });
      
      layers.nodes.push(circle);
    });

    // Initialize Zone Polygons
    Object.keys(layers.zones).forEach(id => map.removeLayer(layers.zones[id]));
    layers.zones = {};

    config.zones.forEach(zone => {
      const poly = L.polygon(zone.polygon, {
        fillOpacity: 0.08,
        weight: 1,
        dashArray: "2, 4"
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
          color = "#0284c7"; // Cool (Blue)
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
        poly.bindTooltip(`${zone.name}: ${liveTemp.toFixed(1)}C`, {
          sticky: true,
          className: "bg-white text-slate-800 border border-slate-200 font-mono text-[9px] px-1 rounded shadow-none"
        });
      }
    });

    // B. Draw Route Polylines
    // Clear old route lines
    if (layers.originalRoute) map.removeLayer(layers.originalRoute);
    if (layers.currentRoute) map.removeLayer(layers.currentRoute);
    
    // Draw Original Route (Red dotted)
    if (telemetry.original_route_coords && telemetry.original_route_coords.length > 0) {
      layers.originalRoute = L.polyline(telemetry.original_route_coords, {
        color: "#EF4444",
        weight: 2,
        opacity: 0.55,
        dashArray: "2, 6"
      }).addTo(map);
    }

    // Draw Current Active Route (Steel Blue)
    if (telemetry.route_coords && telemetry.route_coords.length > 0) {
      layers.currentRoute = L.polyline(telemetry.route_coords, {
        color: "#0284c7",
        weight: 3.5,
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
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const truckPos = [telemetry.truck_position.lat, telemetry.truck_position.lon];
    layers.truckMarker = L.marker(truckPos, { icon: truckIcon }).addTo(map);

    // Bind tooltip showing telemetry on truck marker (No emojis)
    layers.truckMarker.bindTooltip(
      `Temp: ${telemetry.internal_temp.toFixed(1)}C<br/>Zone: ${telemetry.current_zone_name}<br/>Speed: ${(telemetry.truck_speed_kmh * telemetry.speed_multiplier).toFixed(0)} km/h`,
      {
        permanent: false,
        direction: "top",
        className: "bg-white text-slate-800 border border-slate-200 font-mono text-[9px] px-2 py-1.5 rounded shadow-none"
      }
    );

    // D. Draw Reroute Event Points
    layers.rerouteMarkers.forEach(m => map.removeLayer(m));
    layers.rerouteMarkers = [];

    if (telemetry.reroute_points) {
      telemetry.reroute_points.forEach((point, i) => {
        const pingIcon = L.divIcon({
          html: rerouteIconSvg,
          className: "reroute-ping-icon",
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });

        const mark = L.marker(point, { icon: pingIcon }).addTo(map);
        mark.bindTooltip(`Reroute #${i+1}<br/>Risk limit exceeded`, {
          className: "bg-white text-slate-800 border border-slate-200 font-mono text-[9px] px-1 rounded shadow-none"
        });
        layers.rerouteMarkers.push(mark);
      });
    }

  }, [telemetry, config]);

  return (
    <div className="w-full h-full relative flex flex-col min-h-0 min-w-0">
      <div ref={mapContainerRef} className="flex-1 w-full min-h-0 min-w-0" />
      
      {/* Map Legends Overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white px-2 py-1.5 rounded border border-slate-200 text-[9px] font-mono space-y-1 pointer-events-none select-none">
        <div className="font-bold text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">Risk Zones</div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-1.5 rounded-sm bg-[#0284c7] opacity-80"></span>
          <span className="text-slate-600">Cool (&le; 15C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-1.5 rounded-sm bg-[#F59E0B] opacity-80"></span>
          <span className="text-slate-600">Moderate (15-32C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-1.5 rounded-sm bg-[#EF4444] opacity-80"></span>
          <span className="text-slate-600">Dangerous (&gt; 32C)</span>
        </div>
        <hr className="border-slate-100 my-0.5" />
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-0.5 bg-[#0284c7]"></span>
          <span className="text-slate-600">Computed Path</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-0.5 border-t border-dashed border-[#EF4444]"></span>
          <span className="text-slate-600">Original Path</span>
        </div>
      </div>
    </div>
  );
}
