import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const hospitalIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZWYzYzMxIi8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkjwn4+YPC90ZXh0Pjwvc3ZnPg==",
  iconSize: [32, 32],
  popupAnchor: [0, -16],
});

const healthCenterIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMTBiOTgxIi8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkjPrDwvdGV4dD48L3N2Zz4=",
  iconSize: [28, 28],
  popupAnchor: [0, -14],
});

const clinicIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjU5ZTA4Ii8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkO8L3RleHQ+PC9zdmc+",
  iconSize: [24, 24],
  popupAnchor: [0, -12],
});

const recommendedIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNzk2MGVlIi8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPisr0Kc8L3RleHQ+PC9zdmc+",
  iconSize: [32, 32],
  popupAnchor: [0, -16],
});

const getIcon = (type) => {
  switch (type) {
    case "hospital":
      return hospitalIcon;
    case "health_center":
      return healthCenterIcon;
    case "clinic":
      return clinicIcon;
    case "recommended":
      return recommendedIcon;
    default:
      return L.Icon.Default;
  }
};

export default function MapView({ analysis, recommendations = [] }) {
  if (!analysis) {
    return null;
  }

  const center = [-1.95, 30.07];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-screen max-h-96 md:max-h-screen">
        <MapContainer
          center={center}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {recommendations.map((rec, idx) => (
            <Marker
              key={`recommended-${idx}`}
              position={[rec.lat, rec.lon]}
              icon={getIcon("recommended")}
            >
              <Popup>
                <div className="text-sm">
                  <h4 className="font-bold text-purple-700">{rec.name}</h4>
                  <p className="text-xs text-gray-600">{rec.justification}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {rec.estimated_impact}
                  </p>
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mt-1">
                    {rec.type === "health_center"
                      ? "Health Center"
                      : "Clinic"}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {analysis.bounds && (
            <Circle
              center={[
                (analysis.bounds.minLat + analysis.bounds.maxLat) / 2,
                (analysis.bounds.minLon + analysis.bounds.maxLon) / 2,
              ]}
              radius={
                ((analysis.bounds.maxLat - analysis.bounds.minLat) * 111000) /
                2
              }
              color="rgba(0,0,0,0.1)"
              fillOpacity={0.02}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
