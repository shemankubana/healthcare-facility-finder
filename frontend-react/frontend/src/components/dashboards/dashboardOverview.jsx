import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const DashboardOverview = () => {
  const [stats, setStats] = useState([]);
  const [recentAnalysis, setRecentAnalysis] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [hsspTargets, setHsspTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAccessibilityData = async () => {}

  const getPredictions = async () => {}

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch accessibility data
      const accessibilityData = await getAccessibilityData();
      
      // Fetch predictions
      const predictionsData = await getPredictions();

      // Update stats
      setStats([
        {
          icon: Building2,
          label: "Total Healthcare Facilities",
          value: accessibilityData.stats?.total_facilities || "1,247",
          change: "+12%",
          trend: "up",
          color: "blue",
        },
        {
          icon: Users,
          label: "Population Covered",
          value: `${accessibilityData.stats?.population_covered || 83}%`,
          change: "+5%",
          trend: "up",
          color: "green",
        },
        {
          icon: Clock,
          label: "Avg. Travel Time",
          value: `${accessibilityData.stats?.avg_travel_time || 47} min`,
          change: "-3 min",
          trend: "down",
          color: "purple",
        },
        {
          icon: MapPin,
          label: "Underserved Areas",
          value: accessibilityData.stats?.underserved_areas || "342",
          change: "-8%",
          trend: "down",
          color: "orange",
        },
      ]);

      // Update priorities from API data
      if (accessibilityData.districts) {
        const highPriorityDistricts = accessibilityData.districts
          .filter(d => d.priority === 'High')
          .sort((a, b) => a.accessibility_score - b.accessibility_score)
          .slice(0, 3);

        setPriorities(highPriorityDistricts.map(d => ({
          area: d.name,
          population: "145,000", // You would get this from your backend
          facilities: "8",
          priority: d.priority,
          recommendation: d.accessibility_score < 0.3 
            ? "2 new health centers needed" 
            : "1 health center upgrade recommended",
        })));
      }

      // Set recent analysis (this could also come from API)
      setRecentAnalysis([
        {
          region: "Kigali - Gasabo District",
          status: "Completed",
          date: "2025-10-20",
          coverage: "89%",
        },
        {
          region: "Eastern Province - Rwamagana",
          status: "In Progress",
          date: "2025-10-22",
          coverage: "67%",
        },
        {
          region: "Southern Province - Huye",
          status: "Pending",
          date: "2025-10-23",
          coverage: "72%",
        },
      ]);

      // Set HSSP targets
      setHsspTargets({
        universal_coverage: 83,
        travel_time_25min: 67,
        facility_modernization: 45,
        rural_coverage: 72,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const getStatColor = (color) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
    };
    return colors[color];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-green-100 text-green-800",
    };
    return colors[priority];
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: "bg-green-100 text-green-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Pending: "bg-gray-100 text-gray-800",
    };
    return colors[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#004c99] to-[#686d72] rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome to HealthAccess Dashboard
        </h1>
        <p className="text-white/90">
          Data-driven insights for healthcare facility placement in Rwanda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`${getStatColor(
                    stat.color
                  )} p-3 rounded-lg text-white`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Analysis
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAnalysis.map((analysis, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {analysis.region}
                    </h3>
                    <p className="text-sm text-gray-600">{analysis.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">
                      {analysis.coverage}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        analysis.status
                      )}`}
                    >
                      {analysis.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HSSP V Targets Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              HSSP V Targets Progress
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Universal Health Coverage
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {hsspTargets.universal_coverage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${hsspTargets.universal_coverage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Travel Time {"<"} 25 minutes
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {hsspTargets.travel_time_25min}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${hsspTargets.travel_time_25min}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Facility Modernization
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {hsspTargets.facility_modernization}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${hsspTargets.facility_modernization}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Rural Coverage
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {hsspTargets.rural_coverage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${hsspTargets.rural_coverage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Areas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Priority Underserved Areas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facilities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priorities.length > 0 ? (
                priorities.map((priority, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {priority.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {priority.population}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {priority.facilities}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                          priority.priority
                        )}`}
                      >
                        {priority.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {priority.recommendation}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No priority areas identified
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;