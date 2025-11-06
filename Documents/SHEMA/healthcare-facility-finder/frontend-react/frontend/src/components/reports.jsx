import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Eye,
  Share2,
  Plus,
  Search,
} from "lucide-react";

const Reports = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const reports = [
    {
      id: 1,
      title: "Q3 2025 Healthcare Accessibility Comprehensive Report",
      type: "Quarterly Analysis",
      date: "2025-09-30",
      author: "AI Analysis System",
      status: "completed",
      regions: ["All Rwanda"],
      metrics: {
        facilities: 1247,
        coverage: "83%",
        avgTravelTime: "47 min",
      },
      summary:
        "Comprehensive quarterly analysis showing 5% increase in population coverage. Identified 8 critical underserved areas requiring immediate attention.",
      fileSize: "3.2 MB",
      downloads: 45,
    },
    {
      id: 2,
      title: "Northern Province Infrastructure Gap Analysis",
      type: "Regional Study",
      date: "2025-10-15",
      author: "Regional Planning Team",
      status: "completed",
      regions: ["Northern Province"],
      metrics: {
        facilities: 156,
        coverage: "67%",
        avgTravelTime: "58 min",
      },
      summary:
        "Detailed analysis of healthcare accessibility gaps in Northern Province. Recommends 12 new facility locations with priority ranking.",
      fileSize: "1.8 MB",
      downloads: 28,
    },
    {
      id: 3,
      title: "Satellite Imagery ML Model Performance Report",
      type: "Technical Report",
      date: "2025-10-20",
      author: "AI Development Team",
      status: "completed",
      regions: ["Pilot Areas - Kigali"],
      metrics: {
        accuracy: "94.2%",
        facilities: "87 detected",
        confidence: "92%",
      },
      summary:
        "Evaluation of machine learning model performance in detecting healthcare facilities and building clusters from satellite imagery.",
      fileSize: "4.5 MB",
      downloads: 15,
    },
    {
      id: 4,
      title: "HSSP V Targets Progress Report - October 2025",
      type: "Progress Report",
      date: "2025-10-25",
      author: "Healthcare Planning Division",
      status: "in-progress",
      regions: ["All Rwanda"],
      metrics: {
        uhcProgress: "83%",
        targetProgress: "67%",
        facilitiesModernized: "45%",
      },
      summary:
        "Monthly progress tracking against Fifth Health Sector Strategic Plan targets. Analysis of achievements and remaining gaps.",
      fileSize: "2.1 MB",
      downloads: 0,
    },
    {
      id: 5,
      title: "Rural Healthcare Access Impact Study",
      type: "Impact Analysis",
      date: "2025-09-10",
      author: "Policy Research Team",
      status: "completed",
      regions: ["Eastern Province", "Western Province"],
      metrics: {
        facilities: 342,
        coverage: "71%",
        avgTravelTime: "52 min",
      },
      summary:
        "Study examining the impact of recent healthcare facility additions in rural areas. Demonstrates 12% improvement in accessibility.",
      fileSize: "2.7 MB",
      downloads: 52,
    },
  ];

  const reportTypes = [
    { value: "all", label: "All Reports", count: reports.length },
    {
      value: "quarterly",
      label: "Quarterly Analysis",
      count: reports.filter((r) => r.type === "Quarterly Analysis").length,
    },
    {
      value: "regional",
      label: "Regional Studies",
      count: reports.filter((r) => r.type === "Regional Study").length,
    },
    {
      value: "technical",
      label: "Technical Reports",
      count: reports.filter((r) => r.type === "Technical Report").length,
    },
    {
      value: "progress",
      label: "Progress Reports",
      count: reports.filter((r) => r.type === "Progress Report").length,
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      "in-progress": "bg-blue-100 text-blue-800",
      draft: "bg-gray-100 text-gray-800",
    };
    return colors[status];
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter =
      selectedFilter === "all" ||
      report.type.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Access comprehensive reports and analysis documents
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors">
            <Plus className="w-5 h-5" />
            Generate New Report
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c99]"
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Reports</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Downloads</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {reports.reduce((sum, r) => sum + r.downloads, 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {reports.filter((r) => r.status === "in-progress").length}
          </p>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {report.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {report.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                    <span>{report.author}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{report.summary}</p>

                  {/* Regions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {report.regions.map((region, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        📍 {region}
                      </span>
                    ))}
                  </div>

                  {/* Key Metrics */}
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(report.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button className="px-4 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>File size: {report.fileSize}</span>
                <span>{report.downloads} downloads</span>
              </div>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Generate Report Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-lg">
            <Plus className="w-6 h-6 text-[#004c99]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Need a Custom Report?
            </h3>
            <p className="text-gray-600 mb-4">
              Generate customized reports based on specific regions, time
              periods, or metrics. Our AI-powered system can create
              comprehensive analysis tailored to your needs.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[#004c99] text-white rounded-lg hover:bg-[#003d7a] transition-colors">
                Start Custom Report
              </button>
              <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Schedule Recurring Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;