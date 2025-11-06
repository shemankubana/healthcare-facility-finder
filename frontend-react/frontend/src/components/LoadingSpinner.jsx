import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="mb-4 inline-block">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Analyzing healthcare accessibility...</p>
        <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
      </div>
    </div>
  );
}
