import React from "react";
import { Satellite, MapPin, Brain, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Satellite,
    title: "Satellite Imagery Analysis",
    description:
      "Satellite imagery processing to identify underserved areas and assess infrastructure needs",
  },
  {
    icon: Brain,
    title: "ML-Based Insights",
    description:
      "Machine learning algorithms analyze population density, road networks, and existing healthcare access",
  },
  {
    icon: MapPin,
    title: "Optimal Location Planning",
    description:
      "Data-driven recommendations for new healthcare facility locations to maximize community impact",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    description:
      "Forecast future healthcare demands and plan infrastructure accordingly with predictive models",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for Healthcare Planning
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Leverage cutting-edge technology to make data-backed decisions about
            healthcare facility placement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-14 h-14 bg-[#004c99] rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 flex items-center justify-center">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};