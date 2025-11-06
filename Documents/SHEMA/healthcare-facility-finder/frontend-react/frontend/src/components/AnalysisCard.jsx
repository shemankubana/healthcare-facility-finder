import React from "react";

export default function AnalysisCard({ analysis }) {
  const isUnderserved = analysis.gap_status === "UNDERSERVED";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">{analysis.district}</h2>
        <p className="text-blue-100 text-sm">Healthcare Accessibility Analysis</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Population</p>
          <p className="text-2xl font-bold text-blue-900">
            {(analysis.population / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analysis.population_density} per km²
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">
            Current Facilities
          </p>
          <p className="text-2xl font-bold text-green-900">
            {analysis.currentFacilities}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analysis.facilityBreakdown.hospitals} hospitals,{" "}
            {analysis.facilityBreakdown.health_centers} centers
          </p>
        </div>

        <div
          className={`${
            isUnderserved ? "bg-red-50" : "bg-green-50"
          } rounded-lg p-4`}
        >
          <p className="text-gray-600 text-sm font-medium mb-1">
            Avg Travel Time
          </p>
          <p
            className={`text-2xl font-bold ${
              isUnderserved ? "text-red-900" : "text-green-900"
            }`}
          >
            {analysis.avgTravel} min
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Target: {analysis.target} min
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">
            Per Facility
          </p>
          <p className="text-2xl font-bold text-purple-900">
            {analysis.populationPerFacility.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">People per facility</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div
          className={`${
            isUnderserved
              ? "bg-red-50 border-l-4 border-red-500"
              : "bg-green-50 border-l-4 border-green-500"
          } p-4 rounded`}
        >
          <p className="font-semibold text-gray-900 mb-1">Status</p>
          <p
            className={`text-sm ${
              isUnderserved ? "text-red-700" : "text-green-700"
            }`}
          >
            {isUnderserved
              ? `⚠️ UNDERSERVED: Current travel time (${analysis.avgTravel} min) exceeds target (${analysis.target} min) by ${analysis.avgTravel - analysis.target} minutes. Consider adding ${Math.ceil((analysis.avgTravel - analysis.target) / 8)} facilities.`
              : `✓ ADEQUATE: Current travel time (${analysis.avgTravel} min) meets accessibility target.`}
          </p>
        </div>
      </div>
    </div>
  );
}
