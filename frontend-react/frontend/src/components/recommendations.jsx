import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  TrendingUp,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  RefreshCw,
} from "lucide-react";

const Recommendations = () => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [analyzing, setAnalyzing] = useState(false);

  const recommendations = [
    {
      id: 1,
      priority: "Critical",
      location: "Gicumbi District, Byumba Sector",
      coordinates: { lat: -1.5761, lng: 30.0669 },
      type: "Health Center",
      reasoning: {
        population: "45,000 residents underserved",
        distance: "Average 12.5km to nearest facility",
        demographics: "High proportion of children under 5",
        infrastructure: "Good road network accessibility",
      },
      impact: {
        populationServed: "45,000+",
        travelTimeReduction: "52 minutes",
        coverageIncrease: "18%",
        estimatedCost: "$250,000",
      },
      aiInsight:
        "Based on satellite imagery analysis and ML modeling, this location shows the highest concentration of underserved population with existing road infrastructure. The area has seen recent building development, indicating growing population density.",
      confidence: 94,
      status: "recommended",
    },
    {
      id: 2,
      priority: "High",
      location: "Kayonza District, Mukarange Sector",
      coordinates: { lat: -1.8822, lng: 30.5844 },
      type: "Clinic",
      reasoning: {
        population: "32,000 residents underserved",
        distance: "Average 8.2km to nearest facility",
        demographics: "Growing young population",
        infrastructure: "Moderate road connectivity",
      },
      impact: {
        populationServed: "32,000+",
        travelTimeReduction: "38 minutes",
        coverageIncrease: "12%",
        estimatedCost: "$150,000",
      },
      aiInsight:
        "LLM analysis indicates this sector is experiencing rapid population growth based on new building clusters detected. Current healthcare infrastructure is inadequate for projected 5-year population increase.",
      confidence: 87,
      status: "recommended",
    },
    {
      id: 3,
      priority: "Medium",
      location: "Rusizi District, Kamembe Sector",
      coordinates: { lat: -2.4697, lng: 28.9083 },
      type: "Mobile Health Unit",
      reasoning: {
        population: "28,000 residents underserved",
        distance: "Average 6.8km to nearest facility",
        demographics: "Dispersed rural population",
        infrastructure: "Limited road access",
      },
      impact: {
        populationServed: "28,000+",
        travelTimeReduction: "25 minutes",
        coverageIncrease: "9%",
        estimatedCost: "$80,000",
      },
      aiInsight:
        "Given the dispersed population pattern detected via satellite analysis and challenging terrain, a mobile health unit would be more cost-effective than a fixed facility while maintaining service quality.",
      confidence: 82,
      status: "under-review",
    },
  ];

  const [selectedRecommendation, setSelectedRecommendation] = useState(
    recommendations[0]
  );

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: "bg-red-500",
      High: "bg-orange-500",
      Medium: "bg-yellow-500",
      Low: "bg-green-500",
    };
    return colors[priority];
  };

  const getStatusColor = (status) => {
    const colors = {
      recommended: "bg-green-100 text-green-800",
      "under-review": "bg-blue-100 text-blue-800",
      approved: "bg-purple-100 text-purple-800",
      implemented: "bg-gray-100 text-gray-800",
    };
    return colors[status];
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#004c99] to-[#686d72] rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AI-Powered Recommendations</h1>
        </div>
        <p className="text-white/90">
          Data-driven insights and strategic recommendations for optimal
          healthcare facility placement using machine learning and satellite
          imagery analysis
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
            >
              <option value="all">All Rwanda</option>
              <option value="kigali">Kigali City</option>
              <option value="eastern">Eastern Province</option>
              <option value="western">Western Province</option>
              <option value="northern">Northern Province</option>
              <option value="southern">Southern Province</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 ${analyzing ? "animate-spin" : ""}`}
              />
              {analyzing ? "Analyzing..." : "Run New Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-[#004c99]" />
            <span className="text-sm text-gray-600">
              Recommended Facilities
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {recommendations.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">
              Total Population Impact
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">105K+</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Coverage Increase</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">39%</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Est. Total Investment</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">$480K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations List */}
        <div className="lg:col-span-1 space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => setSelectedRecommendation(rec)}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all ${
                selectedRecommendation.id === rec.id
                  ? "border-[#004c99] shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`${getPriorityColor(
                      rec.priority
                    )} w-2 h-2 rounded-full`}
                  ></div>
                  <span className="text-xs font-medium text-gray-600">
                    {rec.priority} Priority
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    rec.status
                  )}`}
                >
                  {rec.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">
                {rec.location}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{rec.type}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{rec.impact.populationServed} people</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">AI Confidence</span>
                  <span className="text-xs font-semibold text-[#004c99]">
                    {rec.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-[#004c99] h-1.5 rounded-full"
                    style={{ width: `${rec.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`${getPriorityColor(
                      selectedRecommendation.priority
                    )} w-3 h-3 rounded-full`}
                  ></div>
                  <span className="text-sm font-medium text-gray-600">
                    {selectedRecommendation.priority} Priority
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedRecommendation.location}
                </h2>
                <p className="text-gray-600">
                  Recommended: {selectedRecommendation.type}
                </p>
              </div>
              <button className="px-4 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors">
                View on Map
              </button>
            </div>

            {/* AI Insight */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#004c99] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    AI Analysis Insight
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRecommendation.aiInsight}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">
                      Confidence Score: {selectedRecommendation.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning Grid */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Key Factors
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Population
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRecommendation.reasoning.population}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Distance
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRecommendation.reasoning.distance}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Demographics
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRecommendation.reasoning.demographics}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Infrastructure
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRecommendation.reasoning.infrastructure}
                  </p>
                </div>
              </div>
            </div>

            {/* Expected Impact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Expected Impact
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedRecommendation.impact.populationServed}
                  </p>
                  <p className="text-xs text-gray-600">People Served</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedRecommendation.impact.travelTimeReduction}
                  </p>
                  <p className="text-xs text-gray-600">Time Saved</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedRecommendation.impact.coverageIncrease}
                  </p>
                  <p className="text-xs text-gray-600">Coverage Increase</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedRecommendation.impact.estimatedCost}
                  </p>
                  <p className="text-xs text-gray-600">Investment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Approve Recommendation
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Request Detailed Analysis
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Export Report
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Share with Stakeholders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;