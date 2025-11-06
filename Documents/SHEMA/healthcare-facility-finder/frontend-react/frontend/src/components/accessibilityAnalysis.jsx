import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Download,
} from "lucide-react";

const AccessibilityAnalysis = () => {
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("travel-time");

  const provinces = [
    { value: "all", label: "All Provinces" },
    { value: "kigali", label: "Kigali" },
    { value: "eastern", label: "Eastern Province" },
    { value: "western", label: "Western Province" },
    { value: "northern", label: "Northern Province" },
    { value: "southern", label: "Southern Province" },
  ];

  const keyMetrics = [
    {
      icon: Clock,
      label: "Average Travel Time",
      value: "47 minutes",
      target: "25 minutes",
      status: "below",
      change: "-3 min",
    },
    {
      icon: Users,
      label: "Population Coverage",
      value: "83%",
      target: "95%",
      status: "below",
      change: "+5%",
    },
    {
      icon: MapPin,
      label: "Facility Density",
      value: "3.2 per 10k",
      target: "5 per 10k",
      status: "below",
      change: "+0.4",
    },
    {
      icon: CheckCircle,
      label: "Meeting WHO Standards",
      value: "67%",
      target: "100%",
      status: "below",
      change: "+8%",
    },
  ];

  const districtAnalysis = [
    {
      district: "Gasabo",
      province: "Kigali",
      population: "530,000",
      facilities: 45,
      avgTravelTime: "18 min",
      coverage: "94%",
      status: "good",
      gap: "Low",
    },
    {
      district: "Gicumbi",
      province: "Northern",
      population: "485,000",
      facilities: 12,
      avgTravelTime: "62 min",
      coverage: "58%",
      status: "critical",
      gap: "High",
    },
    {
      district: "Kayonza",
      province: "Eastern",
      population: "344,000",
      facilities: 18,
      avgTravelTime: "45 min",
      coverage: "72%",
      status: "moderate",
      gap: "Medium",
    },
    {
      district: "Rusizi",
      province: "Western",
      population: "489,000",
      facilities: 21,
      avgTravelTime: "51 min",
      coverage: "68%",
      status: "moderate",
      gap: "Medium",
    },
    {
      district: "Huye",
      province: "Southern",
      population: "381,000",
      facilities: 25,
      avgTravelTime: "38 min",
      coverage: "79%",
      status: "moderate",
      gap: "Medium",
    },
  ];

  const underservedAreas = [
    {
      area: "Gicumbi - Byumba Sector",
      population: "45,000",
      nearestFacility: "12.5 km",
      travelTime: "78 min",
      severity: "Critical",
      recommendation: "Urgent: New health center required",
    },
    {
      area: "Kayonza - Mukarange Sector",
      population: "32,000",
      nearestFacility: "8.2 km",
      travelTime: "52 min",
      severity: "High",
      recommendation: "Priority: Clinic establishment needed",
    },
    {
      area: "Rusizi - Kamembe Sector",
      population: "28,000",
      nearestFacility: "6.8 km",
      travelTime: "45 min",
      severity: "Medium",
      recommendation: "Consider: Mobile health services",
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      good: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  const getGapColor = (gap) => {
    const colors = {
      Low: "text-green-600",
      Medium: "text-yellow-600",
      High: "text-red-600",
    };
    return colors[gap];
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: "bg-red-500",
      High: "bg-orange-500",
      Medium: "bg-yellow-500",
    };
    return colors[severity];
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Healthcare Accessibility Analysis
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive analysis of healthcare access across Rwanda
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
            >
              {provinces.map((province) => (
                <option key={province.value} value={province.value}>
                  {province.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
            >
              <option value="travel-time">Travel Time</option>
              <option value="population-coverage">Population Coverage</option>
              <option value="facility-density">Facility Density</option>
              <option value="accessibility-score">Accessibility Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon className="w-6 h-6 text-[#004c99]" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  {metric.change}
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">{metric.label}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500">
                Target: <span className="font-medium">{metric.target}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* District Analysis Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            District-Level Analysis
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facilities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Travel Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {districtAnalysis.map((district, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {district.district}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {district.province}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {district.population}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {district.facilities}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {district.avgTravelTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {district.coverage}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        district.status
                      )}`}
                    >
                      {district.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${getGapColor(
                        district.gap
                      )}`}
                    >
                      {district.gap}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Underserved Areas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-gray-900">
              Critical Underserved Areas
            </h3>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
            {underservedAreas.length} Areas Requiring Attention
          </span>
        </div>
        <div className="p-6 space-y-4">
          {underservedAreas.map((area, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {area.area}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Population: {area.population}
                  </p>
                </div>
                <div
                  className={`${getSeverityColor(
                    area.severity
                  )} px-3 py-1 rounded-full text-white text-xs font-medium`}
                >
                  {area.severity}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    Nearest Facility
                  </p>
                  <p className="font-semibold text-gray-900">
                    {area.nearestFacility}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    Estimated Travel Time
                  </p>
                  <p className="font-semibold text-gray-900">
                    {area.travelTime}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-[#004c99]">
                  💡 {area.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Travel Time Distribution
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart: Travel time histogram</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Coverage Trends
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart: Coverage over time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityAnalysis;