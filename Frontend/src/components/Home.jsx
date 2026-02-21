import { Sparkles, Rocket, Code2 } from "lucide-react";
import { NavLink } from "react-router";
import HeaderProfile from "./headerProfile";

export default function Home() {
       

  return (
    <section className="relative min-h-screen bg-[#212942] text-white overflow-hidden">
      
      <HeaderProfile></HeaderProfile>

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFB900] opacity-20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFB900] opacity-10 blur-3xl rounded-full translate-x-1/3 translate-y-1/3"></div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/10">
          <Sparkles size={18} className="text-[#FFB900]" />
          <span className="text-sm text-white/80">
            Build. Customize. Deploy Instantly.
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-4xl">
          Create Stunning Websites
          <span className="block text-[#FFB900]">
            Without Writing Code
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl">
          Design your frontend visually, customize layouts, and deploy your
          website in seconds. Fast, simple, and powerful.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          
          {/* Primary CTA */}
          <NavLink
            to={"/builder"}
            className="group px-8 py-4 bg-[#FFB900] text-[#212942] font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Rocket size={18} />
            Start Building
          </NavLink>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          
          <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-[#FFB900]">
              Drag & Drop
            </h3>
            <p className="text-white/70">
              Easily design layouts with our visual builder interface.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-[#FFB900]">
              Responsive Ready
            </h3>
            <p className="text-white/70">
              Automatically optimized for mobile, tablet, and desktop.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-[#FFB900]">
              One-Click Deploy
            </h3>
            <p className="text-white/70">
              Publish your site instantly with a single click.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
