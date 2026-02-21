import React from 'react';

export default function About() {
  return (
    <div className="w-full bg-[#2A2825] h-[100vh] text-gray-300">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI-Powered Code Generation */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M2 10c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8zm1 0a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">AI-Powered Code Generation</h3>
            </div>
            <p className="text-sm">
              The application integrates with the Google Generative AI API (Gemini-2.5-flash model) to generate HTML, CSS, and JavaScript code based on user prompts. 
            </p>
          </div>

          {/* Real-Time Live Preview */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm0 2h10v6H5V6z" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">Real-Time Live Preview</h3>
            </div>
            <p className="text-sm">
              Users can instantly preview the generated code in an interactive iframe, which renders the HTML, CSS, and JavaScript in a sandboxed environment. 
            </p>
          </div>

          {/* Dark Theme with Professional UI */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">Dark Theme with Professional UI</h3>
            </div>
            <p className="text-sm">
              The application features a sleek dark theme with a modern, professional design using Tailwind CSS.
            </p>
          </div>

          {/* Interactive Code Editor with Language Tabs */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4zm-5 0a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">Interactive Code Editor with Language Tabs</h3>
            </div>
            <p className="text-sm">
              The code editor allows users to toggle between HTML, CSS, and JavaScript views with dedicated tabs, each styled distinctly for clarity.
            </p>
          </div>

          {/* Expanded AI Response Display */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">Expanded AI Response Display</h3>
            </div>
            <p className="text-sm">
              The AI response section is prominently displayed in a larger, scrollable area with a gradient background, making it easy to read detailed responses from the AI. 
            </p>
          </div>

          {/* Dynamic Layout Adaptation */}
          <div data-aos="fade-up" className="bg-[#1F1D1B] p-6 rounded-lg shadow-lg hover:bg-[#2A2825] transition-colors duration-300">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 2a1 1 0 00-1 1v4H4a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V8a1 1 0 00-1-1h-3V3a1 1 0 00-1-1H8zm5 5V3h-2v4h2z" />
              </svg>
              <h3 className="ml-3 text-lg font-semibold">Dynamic Layout Adaptation</h3>
            </div>
            <p className="text-sm">
              The application dynamically adjusts its layout based on the state of code generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}