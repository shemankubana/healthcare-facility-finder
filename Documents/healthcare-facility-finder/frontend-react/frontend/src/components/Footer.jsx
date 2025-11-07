import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">HealthAccess</h3>
            <p className="text-gray-400 leading-relaxed">
              Transforming healthcare accessibility through ML-powered satellite
              analysis and strategic planning.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

        </div> */}

        <div className="text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} HealthAccess
          </p>
        </div>
      </div>
    </footer>
  );
};
