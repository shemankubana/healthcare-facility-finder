import React from "react";

const steps = [
  {
    number: "01",
    title: "Data Collection",
    description:
      "Gather satellite imagery, demographic data, and existing healthcare facility information from multiple sources",
  },
  {
    number: "02",
    title: "ML Analysis",
    description:
      "Our advanced algorithms process the data to identify patterns, gaps, and opportunities in healthcare access",
  },
  {
    number: "03",
    title: "Strategic Planning",
    description:
      "Generate comprehensive reports with actionable recommendations for optimal facility placement",
  },
  {
    number: "04",
    title: "Implementation Support",
    description:
      "Ongoing monitoring and optimization to ensure maximum impact and community benefit",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our streamlined process transforms data into actionable
            healthcare facility placement insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-[#004c99] to-[#686d72] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {step.number}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};