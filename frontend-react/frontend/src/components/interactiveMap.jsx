import React, { useState } from "react";
import {
  Filter,
  Layers,
  Search,
  Hospital,
  Home,
  MapPin,
  Users,
} from "lucide-react";

const InteractiveMap = () => {
  const [selectedLayer, setSelectedLayer] = useState({
    facilities: true,
    population: true,
    roads: true,
    accessibility: false,
  });

  const [selectedFacilityType, setSelectedFacilityType] = useState("all");

  const facilities = [
    {
      id: 1,
      name: "Kigali University Teaching Hospital",
      type: "Hospital",
      district: "Gasabo",
      sector: "Kimironko",
      capacity: 500,
      services: ["Emergency", "Surgery", "Maternity"],
      coordinates: { lat: -1.9536, lng: 30.0909 },
    },
    {
      id: 2,
      name: "Remera Health Center",
      type: "Health Center",
      district: "Gasabo",
      sector: "Remera",
      capacity: 50,
      services: ["Primary Care", "Vaccination"],
      coordinates: { lat: -1.9500, lng: 30.1044 },
    },
    {
      id: 3,
      name: "Nyarugenge District Hospital",
      type: "Hospital",
      district: "Nyarugenge",
      sector: "Nyarugenge",
      capacity: 200,
      services: ["Emergency", "General Medicine"],
      coordinates: { lat: -1.9705, lng: 30.0588 },
    },
  ];

  const [selectedFacility, setSelectedFacility] = useState(null);

  const accessibilityZones = [
    { zone: "High Access", color: "bg-green-500", percentage: "45%" },
    { zone: "Medium Access", color: "bg-yellow-500", percentage: "32%" },
    { zone: "Low Access", color: "bg-orange-500", percentage: "15%" },
    { zone: "No Access", color: "bg-red-500", percentage: "8%" },
  ];

  const toggleLayer = (layer) => {
    setSelectedLayer((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left Sidebar - Controls */}
      <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search location or facility..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
            />
          </div>
        </div>

        {/* Layers Control */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Map Layers</h3>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLayer.facilities}
                onChange={() => toggleLayer("facilities")}
                className="w-4 h-4 text-[#004c99] rounded focus:ring-[#004c99]"
              />
              <Hospital className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Healthcare Facilities
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLayer.population}
                onChange={() => toggleLayer("population")}
                className="w-4 h-4 text-[#004c99] rounded focus:ring-[#004c99]"
              />
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Population Density</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLayer.roads}
                onChange={() => toggleLayer("roads")}
                className="w-4 h-4 text-[#004c99] rounded focus:ring-[#004c99]"
              />
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Road Networks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLayer.accessibility}
                onChange={() => toggleLayer("accessibility")}
                className="w-4 h-4 text-[#004c99] rounded focus:ring-[#004c99]"
              />
              <Home className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Accessibility Zones
              </span>
            </label>
          </div>
        </div>

        {/* Filter by Facility Type */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Filter Facilities</h3>
          </div>
          <select
            value={selectedFacilityType}
            onChange={(e) => setSelectedFacilityType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
          >
            <option value="all">All Facilities</option>
            <option value="hospital">Hospitals</option>
            <option value="health-center">Health Centers</option>
            <option value="clinic">Clinics</option>
          </select>
        </div>

        {/* Accessibility Legend */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Accessibility Zones
          </h3>
          <div className="space-y-2">
            {accessibilityZones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${zone.color} rounded`}></div>
                  <span className="text-sm text-gray-700">{zone.zone}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {zone.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Facilities List */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            Nearby Facilities ({facilities.length})
          </h3>
          <div className="space-y-2">
            {facilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => setSelectedFacility(facility)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedFacility?.id === facility.id
                    ? "border-[#004c99] bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  {facility.name}
                </div>
                <div className="text-xs text-gray-600">
                  {facility.type} • {facility.sector}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
          {/* Placeholder Map - Replace with actual map library like Leaflet or Mapbox */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-[#004c99] mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Interactive Map View
              </p>
              <p className="text-sm text-gray-600 max-w-md">
                Integrate with Leaflet, Mapbox, or Google Maps API to display
                Rwanda's healthcare facilities, population density, and
                accessibility zones
              </p>
            </div>
          </div>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded">
              +
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded">
              -
            </button>
          </div>

          {/* Coordinates Display */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600">
            Lat: -1.9536, Lng: 30.0909
          </div>
        </div>

        {/* Facility Details Panel */}
        {selectedFacility && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedFacility.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedFacility.district} District • {selectedFacility.sector}{" "}
                  Sector
                </p>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-semibold text-gray-900">
                  {selectedFacility.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Capacity</p>
                <p className="font-semibold text-gray-900">
                  {selectedFacility.capacity} beds
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Services</p>
                <p className="font-semibold text-gray-900">
                  {selectedFacility.services.length}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Available Services</p>
              <div className="flex flex-wrap gap-2">
                {selectedFacility.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;