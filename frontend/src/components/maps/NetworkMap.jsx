// src/components/maps/NetworkMap.jsx
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

function FitBoundsToGeoJSON({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data || !data.features || data.features.length === 0) return;

    const coords = [];

    data.features.forEach((feat) => {
      const geom = feat.geometry;
      if (!geom) return;

      if (geom.type === "LineString") {
        geom.coordinates.forEach(([lng, lat]) => coords.push([lat, lng]));
      } else if (geom.type === "MultiLineString") {
        geom.coordinates.forEach((line) =>
          line.forEach(([lng, lat]) => coords.push([lat, lng]))
        );
      }
    });

    if (!coords.length) return;

    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const latMin = Math.min(...lats);
    const latMax = Math.max(...lats);
    const lngMin = Math.min(...lngs);
    const lngMax = Math.max(...lngs);

    map.fitBounds(
      [
        [latMin, lngMin],
        [latMax, lngMax],
      ],
      { padding: [20, 20] }
    );
  }, [data, map]);

  return null;
}

export default function NetworkMap({ edges, removedEdges }) {
  // Nothing loaded yet
  if (!edges || !edges.features || edges.features.length === 0) {
    return (
      <div
        style={{
          height: "520px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
        }}
      >
        Run a simulation to see the map.
      </div>
    );
  }

  // --- style for intact edges (match Legend) ---
  const styleEdges = (feature) => {
    const highway = feature.properties?.highway || "";
    const isMajor =
      highway.includes("motorway") ||
      highway.includes("trunk") ||
      highway.includes("primary");

    return {
      color: isMajor ? "#1d4ed8" : "#9ca3af", // major blue, local grey
      weight: isMajor ? 3 : 1.4,
      opacity: 0.9,
    };
  };

  // --- style for removed edges (disrupted roads – red) ---
  const styleRemoved = () => ({
    color: "#ef4444",
    weight: 3,
    opacity: 0.95,
  });

  return (
    <div
      style={{
        height: "520px",
        width: "100%",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <MapContainer
        style={{ height: "100%", width: "100%" }}
        center={[40, -95]} // fallback; will be overridden by FitBounds
        zoom={5}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Base network */}
        <GeoJSON data={edges} style={styleEdges} />

        {/* Disrupted edges overlay, if any */}
        {removedEdges && removedEdges.features && removedEdges.features.length > 0 && (
          <GeoJSON data={removedEdges} style={styleRemoved} />
        )}

        <FitBoundsToGeoJSON data={edges} />
      </MapContainer>
    </div>
  );
}