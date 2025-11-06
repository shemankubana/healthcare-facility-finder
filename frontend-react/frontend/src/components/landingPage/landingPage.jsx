import React from "react";
import { Button } from "../buttons";
import { Navigation } from "../Navigation";
import { Features } from "../Features";
import { HowItWorks } from "../HowItWorks";
import { CallToAction } from "../CallToAction";
import { Footer } from "../Footer";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white overflow-x-hidden">
      <Navigation />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          alt="Healthcare professional working"
          src="/entrepreneur-looking-laptop-screen-work-business-project-pandemi.png"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#004c99] to-[#686d72d1]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="font-anek font-medium text-white text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Optimize Healthcare Access
              </h1>

              <p className="font-outfit text-white text-xl leading-relaxed">
                Enhance accessibility and plan healthcare facility placement
                with AI-powered satellite analysis.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => navigate("/signup")} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white px-8 py-4 text-lg h-auto rounded-lg transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                {/* <Button
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#004c99] px-8 py-6 text-lg h-auto rounded-lg transition-all duration-300"
                >
                  Learn More
                </Button> */}
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <img
                className="h-auto w-full max-w-md drop-shadow-2xl"
                alt="Healthcare analytics dashboard"
                src="/landing.png"
              />
            </div>
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default LandingPage;