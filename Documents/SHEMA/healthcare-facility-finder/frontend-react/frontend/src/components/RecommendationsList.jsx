import React from "react";

export default function RecommendationsList({ recommendations, analysis }) {
  if (!recommendations || !recommendations.recommendations) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">
          AI-Generated Recommendations
        </h2>
        <p className="text-purple-100 text-sm">
          Optimized facility locations to improve healthcare access
        </p>
      </div>

      <div className="p-6">
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
          <p className="text-sm text-purple-900 font-medium">
            {recommendations.summary || "Recommended facility placements based on accessibility analysis"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="border border-purple-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {rec.name}
                </h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    rec.type === "health_center"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {rec.type === "health_center"
                    ? "Health Center"
                    : "Clinic"}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-xs">
                  <p className="text-gray-600">
                    <span className="font-medium">Location:</span> {rec.lat.toFixed(4)},
                    {rec.lon.toFixed(4)}
                  </p>
                </div>

                <div className="text-xs bg-gray-50 p-2 rounded">
                  <p className="text-gray-700">
                    <span className="font-medium">Rationale:</span>{" "}
                    {rec.justification}
                  </p>
                </div>

                {rec.estimated_impact && (
                  <div className="text-xs bg-green-50 p-2 rounded">
                    <p className="text-green-700 font-medium">
                      {rec.estimated_impact}
                    </p>
                  </div>
                )}
              </div>

              <button className="w-full text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 rounded transition">
                View on Map
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Next Steps:</span> These recommendations
            should be validated through field assessments, staff capacity planning, and
            community engagement before implementation.
          </p>
        </div>
      </div>
    </div>
  );
}
