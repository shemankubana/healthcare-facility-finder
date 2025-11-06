import React from "react";
import { Button } from "./buttons";
import { useNavigate } from "react-router-dom";

export const Navigation = () => {
  const navigate = useNavigate()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#004c99]">
              HealthAccess
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-700 hover:text-[#004c99] transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-[#004c99] transition-colors font-medium"
            >
              How It Works
            </a>
            <Button onClick={() => navigate("/signup")} className="bg-[#004c99] hover:bg-[#003d7a] text-white">
              Get Started
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" className="text-gray-700">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
