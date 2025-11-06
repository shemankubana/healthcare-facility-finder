import React, { useState, useEffect } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import AnalysisCard from "../components/AnalysisCard";
import RecommendationsList from "../components/RecommendationsList";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function HealthFacilityPlanner() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("Kayonza");
  const [targetTravel, setTargetTravel] = useState(30);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/districts`);
      setDistricts(response.data);
      if (response.data.length > 0) {
        setSelectedDistrict(response.data[0].name);
      }
    } catch (err) {
      console.error("Error fetching districts:", err);
      setError("Failed to load districts");
    }
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations(null);

      const response = await axios.get(`${API_BASE}/api/analyze`, {
        params: {
          district: selectedDistrict,
          targetTravel,
        },
      });

      setAnalysis(response.data);
    } catch (err) {
      console.error("Error analyzing:", err);
      setError("Failed to analyze district. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!analysis) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/api/recommend`, {
        analysis,
      });

      setRecommendations(response.data.recommendation);
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Rural Healthcare Facility Planner
          </h1>
          <p className="text-gray-600">
            Analyze healthcare accessibility and get AI-powered recommendations for new facility locations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Controls
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {districts.map((district) => (
                      <option key={district.id} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Travel Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={targetTravel}
                    onChange={(e) => setTargetTravel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    WHO target: 30 minutes
                  </p>
                </div>

                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition"
                >
                  {loading ? "Analyzing..." : "Analyze District"}
                </button>

                {analysis && (
                  <button
                    onClick={getRecommendations}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition"
                  >
                    {loading ? "Generating..." : "Get Recommendations"}
                  </button>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading && !analysis && <LoadingSpinner />}

            {analysis && (
              <div className="space-y-6">
                <AnalysisCard analysis={analysis} />

                {recommendations && (
                  <RecommendationsList
                    recommendations={recommendations}
                    analysis={analysis}
                  />
                )}

                <MapView
                  analysis={analysis}
                  recommendations={recommendations?.recommendations || []}
                />
              </div>
            )}

            {!loading && !analysis && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 mb-4">
                  Select a district and click "Analyze District" to begin
                </p>
                <p className="text-gray-400">
                  The analysis will show current healthcare accessibility and identify gaps
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
