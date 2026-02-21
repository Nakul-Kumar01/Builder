import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import BackgroundAnimation from './Background';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';




const quickStart = [{ q: "Business", text: "build a Business Landing Page with professional layout and responsive design." },
{ q: "Blog", text: "Create a personal Blog website with a homepage, blog post layout, and categories." },
{ q: "Portfolio", text: "build a Portfolio website my name is " },
{ q: "Fitness", text: "Build a Fitness Tracker app that logs workouts and calories." }];



export default function App() {
  const [prompt, setPrompt] = useState("");
  const [codes, setCodes] = useState({
    html: '<!-- Your generated HTML will appear here -->',
    css: '/* Your generated CSS will appear here */',
    js: '// Your generated JavaScript will appear here',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiResponse, setAiResponse] = useState('');
  const [lang, setLang] = useState('HTML');
  const [cop, setCop] = useState('code');
  const [isVisible, setIsVisible] = useState(false);
  const [theme, setTheme] = useState('');
  // JSX version (no generics)
  const [viewport, setViewport] = useState('full');   // 'full' | 'desktop' | 'tablet' | 'mobile'
  const [deployedUrl, setDeployedUrl] = useState(''); // State for deployed URL


  const text = ['✦', '.', ' ', '─', '─', ' ', 'N', 'o', 'w', '✦', 'y', 'o', 'u', '’', 'r', 'e', '✦', 'B', 'u', 'i', 'l', 'd', 'e', 'r', ' ', '─', '─', ' ', '.', '✦'];

  useEffect(() => {
    setIsVisible(true);
  }, []);


  const generateCode = async (isEnhance = false) => {
  if (!prompt.trim()) {
    setError("Please enter a description of what you want to build.");
    return;
  }

  setIsLoading(true);
  setError(null);
  setAiResponse(""); // clear previous response

  try {
    // Use native fetch so we can read the stream
    const response = await fetch("https://builder.onrender.com/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ prompt, theme, isEnhance, chatHistory }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Server error: ${response.status} ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let aggregatedTextResponse = "";
    let donePayload = null; // will hold final done payload (if provided)
    const historyForThisTurn = [{ role: "user", parts: [{ text: isEnhance ? `Enhance this prompt: ${prompt}` : prompt }] }];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames end with '\n\n'. Process all complete frames in buffer.
      let boundaryIndex;
      while ((boundaryIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawPacket = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        // SSE `data: ` prefix may be present.
        let payloadText = rawPacket.startsWith("data: ") ? rawPacket.slice(6) : rawPacket;
        if (!payloadText.trim()) continue;

        let parsed;
        try {
          parsed = JSON.parse(payloadText);
        } catch (err) {
          // If parsing fails, skip this packet (defensive)
          console.warn("Failed to parse SSE payload:", payloadText, err);
          continue;
        }

        // Handle the packet types
        if (parsed.type === "token") {
          // incremental token
          aggregatedTextResponse += parsed.text;
          setAiResponse((prev) => prev + parsed.text);
        } else if (parsed.type === "done") {
          // final text + functionCalls
          donePayload = parsed;
          // ensure UI reflects final full text (some tokens may already have been applied)
          if (parsed.text && parsed.text.length > aggregatedTextResponse.length) {
            const remainder = parsed.text.slice(aggregatedTextResponse.length);
            aggregatedTextResponse = parsed.text;
            setAiResponse((prev) => prev + remainder);
          }
        } else if (parsed.type === "error") {
          throw new Error(parsed.message || "Server returned an error during streaming");
        } else {
          // unknown type - ignore
          console.warn("Unknown SSE message type:", parsed.type);
        }
      }
    }

    // if buffer leftover (server might not have terminated with \n\n), try parse
    if (buffer.trim()) {
      const leftover = buffer.trim();
      try {
        const parsedLeft = JSON.parse(leftover.replace(/^data:\s*/, ""));
        if (parsedLeft.type === "done") {
          donePayload = parsedLeft;
        }
      } catch (e) {
        // ignore
      }
    }

    // If the backend returned a 'done' with functionCalls, handle them
    const modelResponseParts = [];
    if (aggregatedTextResponse) {
      modelResponseParts.push({ text: aggregatedTextResponse });
    }

    const functionCalls = (donePayload && donePayload.functionCalls) || [];

    if (functionCalls && functionCalls.length > 0) {
      // add functionCall as model requested
      modelResponseParts.push({ functionCall: functionCalls[0] });

      // handle enhancePrompt function
      const enhancePromptCall = functionCalls.find((c) => c.name === "enhancePrompt");
      if (enhancePromptCall && isEnhance) {
        // expect arg structure: { prompt: "..." } or similar
        const enhancedPrompt = (enhancePromptCall.args && (enhancePromptCall.args.prompt || enhancePromptCall.args.result)) || null;
        if (enhancedPrompt) {
          setPrompt(enhancedPrompt);
          setAiResponse((prev) => prev + "\n\nPrompt enhanced successfully! Click 'Generate Code' to proceed.");

          historyForThisTurn.push({ role: "model", parts: modelResponseParts });
          historyForThisTurn.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: "enhancePrompt",
                  response: { result: enhancedPrompt },
                },
              },
            ],
          });

          setChatHistory((prev) => [...prev, ...historyForThisTurn]);
          setIsLoading(false);
          return; // stop after enhancing prompt
        }
      }

      // handle submitCode function
      const submitCodeCall = functionCalls.find((c) => c.name === "submitCode");
      if (submitCodeCall && !isEnhance) {
        const codeArgs = submitCodeCall.args || {};
        setCodes({
          html: codeArgs.html || "<!-- No HTML generated -->",
          css: codeArgs.css || "/* No CSS generated */",
          js: codeArgs.js || "// No JavaScript generated",
        });
        setPrompt("");

        historyForThisTurn.push({ role: "model", parts: modelResponseParts });
        historyForThisTurn.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: "submitCode",
                response: { result: "Code received and rendered successfully." },
              },
            },
          ],
        });
      }
    } else {
      // no function calls: just add model text
      historyForThisTurn.push({ role: "model", parts: modelResponseParts });
    }

    // Update chat history once
    setChatHistory((prev) => [...prev, ...historyForThisTurn]);
  } catch (error) {
    console.error("Streaming error:", error);
    setError(error.message || "An error occurred while generating code.");
  } finally {
    setIsLoading(false);
  }
};

  const getViewportWidth = () => {
    switch (viewport) {
      case 'desktop':
        return '1280px';        // typical laptop
      case 'tablet':
        return '768px';         // iPad portrait
      case 'mobile':
        return '375px';         // iPhone 14/15
      default:                 // 'full'
        return '100%';
    }
  };


  const handleTheme = (text) => {
    if (text === "Business & Corporate") setTheme("Color Palette: Blues, grays, whites with professional accents and Layout: Clean, structured, trust-focused");
    if (text === "E-commerce & Online Store") setTheme("Color Palette: Brand-focused with strong CTAs (often red, orange, green buttons) and ayout: Product-centric with galleries and shopping features")
    if (text === "Creative & Portfolio") setTheme("Color Palette: Bold, artistic, often black/white with accent colors and Layout: Visual-heavy, gallery-focused, minimal text");
    if (text === "Blog & Content") setTheme("Color Palette: Readable combinations (often blues, greens, earth tones) and Layout: Content-first with good typography and readability");
    if (text === "Service & Professional") setTheme("Color Palette: Industry-specific (blue for healthcare, green for education) and Layout: Service-focused with booking and information sections")
  }

  const handleDownloadZip = () => {
    const zip = new JSZip();

    // Add files to the ZIP
    zip.file("index.html", `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Component</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${codes.html}
  <script src="script.js"></script>
</body>
</html>
    `);
    zip.file("style.css", codes.css);
    zip.file("script.js", codes.js);

    // Generate ZIP and trigger download
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "project.zip");
    }).catch((err) => {
      console.error("Failed to generate ZIP:", err);
      setError("Failed to generate ZIP file. Please try again.");
    });
  };


//   const handleDeploy = async () => {
//     if (codes.html === '<!-- Your generated HTML will appear here -->') {
//       setError("No code to deploy. Please generate a website first.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setDeployedUrl('');

//     try {
//       const files = [
//         {
//           file: "index.html",
//           data: `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Generated Site</title>
//   <link rel="stylesheet" href="style.css">
// </head>
// <body>
//   ${codes.html}
//   <script src="script.js"></script>
// </body>
// </html>
//     `,
//         },
//         {
//           file: "style.css",
//           data: codes.css,
//         },
//         {
//           file: "script.js",
//           data: codes.js,
//         }
//       ];


//       const response = await fetch("https://api.vercel.com/v13/deployments", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${VERCEL_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: `website-${Date.now()}`,
//           files: files,
//           projectSettings: {
//             framework: null,
//             devCommand: null,
//             buildCommand: null,
//             outputDirectory: null
//           }
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         console.log("Error Data:", data);
//         throw new Error(`Deployment failed: ${data.error?.message || response.statusText}`);
//       }

//       const deploymentUrl = data.url.startsWith('https://')   // iski vjha se localhost se start nhi hua
//         ? data.url
//         : `https://${data.url}`;
//       setDeployedUrl(deploymentUrl);
//       setAiResponse(prev => prev + `\n\n✅ Deployment successful! View your site at: https://${deploymentUrl}`);
//     } catch (error) {
//       console.error("Deployment Failed:", error);
//       setError(`Failed to deploy the website: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleDeploy = async () => {
  if (codes.html === '<!-- Your generated HTML will appear here -->') {
    setError("No code to deploy. Please generate a website first.");
    return;
  }

  setIsLoading(true);
  setError(null);
  setDeployedUrl('');

  try {
    const response = await fetch("https://builder.onrender.com/vercel/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // if protected route
      body: JSON.stringify({
        html: codes.html,
        css: codes.css,
        js: codes.js,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Deployment failed");
    }

    setDeployedUrl(data.url);
    setAiResponse(prev =>
      prev + `\n\n✅ Deployment successful! View your site at: ${data.url}`
    );

  } catch (error) {
    console.error("Deployment Failed:", error);
    setError(`Failed to deploy the website: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

  const previewSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
          }
          ${codes.css}
        </style>
      </head>
      <body>
        ${codes.html}
        <script>
          try {
            ${codes.js}
          } catch (error) {
            console.error('JavaScript execution error:', error);
            document.body.insertAdjacentHTML('beforeend', 
              '<div style="color: #fecaca; background: #7f1d1d; padding: 10px; margin: 10px 0; border: 1px solid #ef4444; border-radius: 4px;">JavaScript Error: ' + error.message + '</div>'
            );
          }
        </script>
      </body>
    </html>
  `;

  const handleClearAll = () => {
    setCodes({
      html: '<!-- Your generated HTML will appear here -->',
      css: '/* Your generated CSS will appear here */',
      js: '// Your generated JavaScript will appear here',
    });
    setChatHistory([]);
    setAiResponse('');
    setPrompt('');
    setDeployedUrl('');
  };

  const handleCopyCode = (codeType) => {
    navigator.clipboard.writeText(codes[codeType]);
    const button = document.querySelector(`[data-copy="${codeType}"]`);
    if (button) {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }
  };

  const isInitialState = codes.html === '<!-- Your generated HTML will appear here -->';

  return (
    <div className="min-h-[150vh] bg-[#2A2825] text-gray-100 font-sans overflow-x-hidden">
      <BackgroundAnimation></BackgroundAnimation>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 animate-float-delay"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">

        <div className={`w-full mx-auto transition-all duration-1000 ease-out ${isInitialState ? 'max-w-4xl' : 'flex flex-col sm:flex-row flex-wrap justify-between gap-8 max-w-8xl'}`}>

          {/* Input Section */}
          <div className={`transition-all  duration-1000 ease-out ${isInitialState ? 'w-full' : 'w-2/5 min-w-96'}`}>
            <header className={`mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className={`text-center transition-all duration-1000 ease-out ${isInitialState ? 'mb-12' : 'mb-6'}`}>
                <h1 className={`font-bold font-sans bg-clip-text text-white transition-all duration-1000 ease-out ${isInitialState ? 'text-xl  sm:text-5xl' : 'hidden'}`}>
                  <div className=" text-center tracking-widest font-bold z-70 pt-4 sm:pt-7 md:pt-10">{text.map((char, index) => (
                    <span
                      key={index}
                      className="inline-block  transition-transform text-white duration-200 ease-out hover:scale-125 hover:text-amber-400"
                    >
                      {char}
                    </span>
                  ))}
                  </div>
                </h1>
                <div className="flex justify-center mt-4">
                  <div className={`w-12 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 ${isInitialState ? 'text-5xl sm:text-5xl' : 'hidden text-3xl'} rounded-full animate-pulse`}></div>
                </div>
                <p className={`text-gray-400 mt-6 transition-all duration-1000 ease-out ${isInitialState ? 'text-lg' : 'hidden text-sm'}`}>
                  Transform your ideas into production-ready code with AI assistance
                </p>
              </div>
            </header>

            {/* Input Card */}
            <div className={`bg-gray-800  rounded-2xl p-6 border border-gray-700 shadow-2xl shadow-gray-900/50 transition-all duration-700 ease-out ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}>
              <div className="mb-6">
                <label className="relative block text-lg font-semibold text-gray-300 mb-3 transition-all duration-300 group">
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-indigo-400 group-hover:text-indigo-500 transition-transform duration-300 group-hover:rotate-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 20h9M12 4h9M4 12h16M4 20h9M4 4h9"
                      />
                    </svg>
                    {isInitialState ? 'Describe your Project' : 'What do you want to update in this Project?'}
                  </span>
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
                </label>
                <textarea
                  className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-out resize-none placeholder-gray-500 text-gray-100 leading-relaxed"
                  rows={isInitialState ? "6" : "4"}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`${isInitialState ? "e.g., Create a modern dashboard with animated charts and responsive design" : 'e.g., Change the theme of your Project'}`}
                  disabled={isLoading}
                />
                <div className="text-right mt-2 text-gray-500 text-xs">
                  {prompt.length}/1000
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => generateCode(false)}
                  disabled={isLoading || !prompt.trim()}
                  className="flex-1 py-3 px-6 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className='hidden sm:block'>Generating...</span>
                    </span>
                  ) : (
                    <>
                      <span className="hidden sm:block relative z-10">Generate Code</span>
                      <span className="block sm:hidden relative z-10">Code</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </>
                  )}
                </button>

                {/* Select theme */}
                <select
                  onChange={(e) => handleTheme(e.target.value)}
                  className="w-22 p-2 bg-gray-700 border border-gray-600 rounded-xl cursor-pointer text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-out appearance-none"
                  disabled={isLoading}
                  defaultValue=""
                >
                  <option value="" disabled>Theme 𐙚</option>
                  <option value="Business & Corporate">Business & Corporate</option>
                  <option value="E-commerce & Online Store">E-commerce & Online Store</option>
                  <option value="Creative & Portfolio">Creative & Portfolio</option>
                  <option value="Blog & Content">Blog & Content</option>
                  <option value="Service & Professional">Service & Professional</option>
                  <option value="">none</option>
                </select>

                <button
                  title="Enhance Prompt"
                  onClick={() => generateCode(true)}
                  disabled={isLoading || !prompt.trim()}
                  className="w-12 border-2 border-white cursor-pointer rounded-2xl hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed relative"
                > '✨'
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={isLoading}
                  title="New Project"
                  className="py-1 px-2 md:px-6 md:py-3 flex gap-2 items-center justify-center cursor-pointer bg-gray-700 text-gray-200 font-medium rounded-xl hover:bg-gray-600 transition-all duration-200 ease-out disabled:opacity-50"
                >
                  New
                  <div className='text-amber-400'>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h8m-4-4v8m4 8H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </button>
              </div>



              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl animate-shake">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
            <div className='flex w-[90%] flex-wrap justify-around container mx-auto'>{
              quickStart.map((item) => {
                return (
                  <div onClick={() => {
                    setPrompt(item.text);
                    // generateCode();
                  }} key={item.q} className="flex justify-center  mt-4 py-1 px-4 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-4xl animate-shake hover:bg-gray-700/80 hover:scale-105">
                    <p className="text-gray-300 text-sm flex items-center font-bold"><div className='mr-2 text-2xl font-extrabold text-amber-300'>↑</div> {item.q}</p>
                  </div>
                )
              })
            }</div>

            {aiResponse && (
              <div className="mt-6 p-8 bg-gradient-to-br from-gray-700/60 to-gray-800/60 border border-gray-600 rounded-2xl backdrop-blur-sm shadow-2xl shadow-gray-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                  <span className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    Here's my Plan ⌯⌲
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/50 to-transparent"></div>
                </div>

                <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-600/50 backdrop-blur-sm">
                  <div className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
                    {/* Enhanced AI Response with better formatting */}
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: aiResponse
                          // Convert headings to larger, highlighted text with emojis
                          .replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, title) => {
                            const level = hashes.length;
                            const emoji = level === 1 ? '🎯 ' : level === 2 ? '✨ ' : level === 3 ? '💡 ' : '🔹 ';
                            const sizeClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
                            const colorClass = level === 1 ? 'text-cyan-300' : level === 2 ? 'text-indigo-300' : 'text-purple-300';
                            return `<h${level} class="font-bold ${sizeClass} ${colorClass} mb-4 mt-6 flex items-center gap-2 border-l-4 border-cyan-400 pl-4 bg-gradient-to-r from-cyan-900/20 to-transparent py-2 rounded-r-lg">${emoji}${title}</h${level}>`;
                          })
                          // Enhance bullet points with emojis
                          .replace(/^\* (.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-cyan-400 mt-1">🔸</span><span class="text-gray-300">$1</span></li>')
                          .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-indigo-400 mt-1">▸</span><span class="text-gray-300">$1</span></li>')
                          // Enhance numbered lists
                          .replace(/^\d+\.\s*(.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-purple-400 font-semibold">📌</span><span class="text-gray-300">$1</span></li>')
                          // Highlight important terms
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded font-semibold">⭐ $1</strong>')
                          .replace(/\*(.+?)\*/g, '<em class="text-blue-300 font-medium">$1</em>')
                          // Add emojis to common programming terms
                          .replace(/\b(HTML|html)\b/g, '🌐 HTML')
                          .replace(/\b(CSS|css)\b/g, '🎨 CSS')
                          .replace(/\b(JavaScript|javascript|JS|js)\b/g, '⚡ JavaScript')
                          .replace(/\b(React|react)\b/g, '⚛️ React')
                          .replace(/\b(Vue|vue)\b/g, '💚 Vue')
                          .replace(/\b(Angular|angular)\b/g, '🅰️ Angular')
                          .replace(/\b(Node\.js|nodejs)\b/g, '🟢 Node.js')
                          .replace(/\b(API|api)\b/g, '🔗 API')
                          .replace(/\b(Database|database|DB|db)\b/g, '🗄️ Database')
                          .replace(/\b(Success|success)\b/g, '✅ Success')
                          .replace(/\b(Error|error)\b/g, '❌ Error')
                          .replace(/\b(Warning|warning)\b/g, '⚠️ Warning')
                          .replace(/\b(Info|info)\b/g, 'ℹ️ Info')
                          // Add line breaks for better readability
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons for AI Response */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600/50">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Response generated successfully
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(aiResponse)}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-2"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setAiResponse('')}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Code/Preview Section */}
          {!isInitialState && (
            <div className="flex-1 min-w-0 animate-slide-in-right">
              <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl shadow-gray-900/50 h-full flex flex-col overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700 p-4">
                  <button
                    onClick={() => setCop('code')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out relative overflow-hidden ${cop === 'code'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      }`}
                  >
                    <span className="relative z-10">Code Editor</span>
                    {cop === 'code' && (
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setCop('preview')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ml-3 relative overflow-hidden ${cop === 'preview'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      }`}
                  >
                    <span className="relative z-10">Live Preview</span>
                    {cop === 'preview' && (
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isInitialState}
                    className={`flex-1 flex justify-center items-center py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ml-3 relative overflow-hidden ${isInitialState
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : 'text-gray-200 cursor-pointer hover:text-white hover:bg-green-500'
                      }`}
                  >
                    <div className='mr-2 text-2xl font-extrabold text-amber-300'>🡻</div> Download ZIP
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col min-h-0">
                  {cop === 'code' ? (
                    <div className="flex flex-col h-full min-h-0">
                      {/* Language Tabs */}
                      <div className="flex gap-2 mb-4 flex-shrink-0">
                        {[
                          { key: 'HTML', color: 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/40' },
                          { key: 'CSS', color: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/40' },
                          { key: 'JS', color: 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/40' }
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setLang(tab.key)}
                            className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ease-out ${lang === tab.key
                              ? tab.color.replace('hover:', '') + ' shadow-sm'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                              }`}
                          >
                            {tab.key}
                          </button>
                        ))}
                      </div>

                      {/* Code Display */}
                      <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden flex flex-col min-h-0 border border-gray-700">
                        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center flex-shrink-0 border-b border-gray-700">
                          <span className="font-mono text-sm text-gray-400">
                            {lang === 'HTML' && 'HTML Structure'}
                            {lang === 'CSS' && 'CSS Styling'}
                            {lang === 'JS' && 'JavaScript Logic'}
                          </span>
                          <button
                            data-copy={lang.toLowerCase()}
                            onClick={() => handleCopyCode(lang.toLowerCase())}
                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 ease-out"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <textarea
                            readOnly
                            value={`${lang.toLowerCase() === 'html' ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Component</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${codes.html}
  <script src="script.js"></script>
</body>
</html>` : codes[lang.toLowerCase()]}`}
                            className="w-full h-full bg-gray-900/50 p-4 font-mono text-sm text-gray-300 border-none focus:ring-0 resize-none overflow-auto leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
                            spellCheck={false}
                            style={{ minHeight: '400px' }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-0">
                      <div className="bg-gray-700 px-3 py-2 rounded-t-xl flex flex-shrink-0 border-b border-gray-600">
                        <span className="font-mono text-sm text-gray-300 flex items-center">Live<span className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse"></span></span>
                        <div className='ml-10 flex'>
                          {/* <a href='https://vercel.com/' target='_blank'><div className='bg-black rounded-3xl px-2 py-0.5 text-white font-extralight mr-3'><span className='text-white mx-0.5'>▲</span>Vercel</div></a> */}
                          <button
                            onClick={handleDeploy}
                            disabled={isLoading || isInitialState}
                            className={`bg-black rounded-3xl px-2 py-0.5 text-white font-extralight mr-3 ${isInitialState
                              ? ' cursor-not-allowed'
                              : 'cursor-pointer'
                              }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className='hidden sm:block'>Deploying...</span>
                              </span>
                            ) : (
                              <>
                                <span className='text-white mx-0.5'>▲</span> Deploy
                              </>
                            )}
                          </button>

                          {/* <a href='https://www.netlify.com/' target='_blank'><div className='bg-blue-600 rounded-3xl px-2 py-0.5 font-extralight mr-3'><span className='text-[#8EFBF7] mx-0.5'>🐳</span>Netlify</div></a> */}
                          <a href='https://github.com/' target='_blank'><div className='flex bg-gray-600 rounded-3xl px-2 py-0.5 font-extralight'><span><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24" height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className='mx-0.5 text-black '
                          >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.746.082-.73.082-.73 1.205.086 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.304 3.492.996.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.333-5.467-5.93 0-1.31.47-2.38 1.235-3.22-.124-.303-.535-1.523.116-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.37.823 1.102.823 2.222v3.293c0 .32.217.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                          </svg>
                          </span>GitHub</div></a>
                        </div>
                      </div>
                      {deployedUrl && (
                        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 w-full text-center">
                          <a
                            href={deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                          >
                            {deployedUrl}
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2 items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700 text-gray-300">
                        {[
                          { id: 'full', label: 'Full' },
                          { id: 'desktop', label: 'Desktop' },
                          { id: 'tablet', label: 'Tablet' },
                          { id: 'mobile', label: 'Mobile' }
                        ].map(v => (
                          <button
                            key={v.id}
                            onClick={() => setViewport(v.id)}
                            className={`px-3 py-1 rounded-md text-sm transition-all
        ${viewport === v.id
                                ? 'bg-indigo-600 text-white shadow'
                                : 'hover:bg-gray-700 hover:text-gray-100'}`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                      {/* ——— IFrame wrapper ——— */}
                      <div
                        className="flex-1 bg-gray-900 rounded-b-xl overflow-auto min-h-0 border border-gray-700 flex justify-center"
                      >
                        <iframe
                          srcDoc={previewSrcDoc}
                          title="Live Preview"
                          sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                          className="border-none h-full"
                          style={{
                            width: getViewportWidth(),
                            // keep at least 400 px tall but grow with flexbox
                            minHeight: '400px',
                            flexShrink: 0,
                          }}
                        />
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out 0.3s both;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 10s ease-in-out infinite 2s;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: rgba(31, 41, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
// import { useState, useEffect } from 'react';
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import BackgroundAnimation from './Background';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';
// import { instruction } from './Instruction';
// import { submitCodeTool, enhancePromptTool } from './tools';

// // --- Configuration ---
// const genAI = new GoogleGenerativeAI("");
// // 
// const VERCEL_TOKEN = ""; // Replace with your Vercel API token
// // const VERCEL_PROJECT_ID = "";

// const quickStart = [{ q: "Business", text: "build a Business Landing Page with professional layout and responsive design." },
// { q: "Blog", text: "Create a personal Blog website with a homepage, blog post layout, and categories." },
// { q: "Portfolio", text: "build a Portfolio website my name is " },
// { q: "Fitness", text: "Build a Fitness Tracker app that logs workouts and calories." }];



// export default function App() {
//   const [prompt, setPrompt] = useState("");
//   const [codes, setCodes] = useState({
//     html: '<!-- Your generated HTML will appear here -->',
//     css: '/* Your generated CSS will appear here */',
//     js: '// Your generated JavaScript will appear here',
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [chatHistory, setChatHistory] = useState([]);
//   const [aiResponse, setAiResponse] = useState('');
//   const [lang, setLang] = useState('HTML');
//   const [cop, setCop] = useState('code');
//   const [isVisible, setIsVisible] = useState(false);
//   const [theme, setTheme] = useState('');
//   // JSX version (no generics)
//   const [viewport, setViewport] = useState('full');   // 'full' | 'desktop' | 'tablet' | 'mobile'
//   const [deployedUrl, setDeployedUrl] = useState(''); // State for deployed URL


//   const text = ['✦', '.', ' ', '─', '─', ' ', 'N', 'o', 'w', '✦', 'y', 'o', 'u', '’', 'r', 'e', '✦', 'B', 'u', 'i', 'l', 'd', 'e', 'r', ' ', '─', '─', ' ', '.', '✦'];

//   useEffect(() => {
//     setIsVisible(true);
//   }, []);


//   const generateCode = async (isEnhance = false) => {
//     if (!prompt.trim()) {
//       setError("Please enter a description of what you want to build.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setAiResponse(''); // Clear previous AI response for the new stream

//     try {
//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.5-flash", // Using a modern, fast model
//         systemInstruction: instruction,
//         tools: [{ functionDeclarations: [submitCodeTool, enhancePromptTool] }],
//       });

//       const myTheme = theme ? `${prompt} ${theme}` : prompt;
//       const message = isEnhance ? `Enhance this prompt in 20-30 words: ${myTheme}` : myTheme;


//       // Start a new chat session with the FULL, correct history
//       const chat = model.startChat({ history: chatHistory });

//       // Use sendMessageStream for real-time text responses
//       const result = await chat.sendMessageStream(message);

//       let aggregatedTextResponse = '';
//       const historyForThisTurn = [{ role: "user", parts: [{ text: message }] }];

//       // Stream the text response for a better user experience
//       for await (const chunk of result.stream) {
//         const chunkText = chunk.text();
//         if (chunkText) {
//           aggregatedTextResponse += chunkText;
//           // Update the UI in real-time
//           setAiResponse(prev => prev + chunkText);
//         }
//       }

//       // Get the final, complete response after the stream is done
//       const finalResponse = await result.response;
//       // console.log("Full AI Response :", finalResponse);

//       const functionCalls = finalResponse.functionCalls();
//       // console.log("Function Calls:", functionCalls);

//       // This will hold the model's complete response for history
//       const modelResponseParts = [];

//       // Add the fully aggregated text to the history parts
//       if (aggregatedTextResponse) {
//         modelResponseParts.push({ text: aggregatedTextResponse });
//       }

//       if (functionCalls && functionCalls.length > 0) {
//         // Add the function call request to the history
//         modelResponseParts.push({ functionCall: functionCalls[0] });

//         const enhancePromptCall = functionCalls.find((call) => call.name === "enhancePrompt");
//         if (enhancePromptCall && isEnhance) {
//           const enhancedPrompt = enhancePromptCall.args.prompt;
//           setPrompt(enhancedPrompt);
//           setAiResponse(prev => prev + "\n\nPrompt enhanced successfully! Click 'Generate Code' to proceed.");

//           historyForThisTurn.push({ role: 'model', parts: modelResponseParts });
//           historyForThisTurn.push({
//             role: 'function',
//             parts: [{ functionResponse: { name: 'enhancePrompt', response: { result: enhancedPrompt } } }]
//           });
//           setChatHistory(prev => [...prev, ...historyForThisTurn]);
//           setIsLoading(false);
//           return; // Stop execution after enhancing prompt
//         }

//         const submitCodeCall = functionCalls.find((call) => call.name === "submitCode");
//         if (submitCodeCall && !isEnhance) {
//           const codeArgs = submitCodeCall.args;
//           setCodes({
//             html: codeArgs.html || '<!-- No HTML generated -->',
//             css: codeArgs.css || '/* No CSS generated */',
//             js: codeArgs.js || '// No JavaScript generated',
//           });
//           setPrompt('');

//           // Add model's request and our function's result to history
//           historyForThisTurn.push({ role: 'model', parts: modelResponseParts });
//           historyForThisTurn.push({
//             role: 'function',
//             parts: [{
//               functionResponse: {
//                 name: 'submitCode',
//                 response: { result: "Code received and rendered successfully." }
//               }
//             }]
//           });
//         }
//       } else {
//         // If no function call, just add the model's text response to history
//         historyForThisTurn.push({ role: 'model', parts: modelResponseParts });
//       }

//       // Update the chat history state ONCE with all parts of the turn
//       setChatHistory(prev => [...prev, ...historyForThisTurn]);

//     } catch (error) {
//       console.error("API Call Failed:", error);
//       let errorMessage = "An error occurred while generating code.";
//       if (error.message) {
//         if (error.message.includes("API key")) {
//           errorMessage = "Invalid API key. Please check your Google AI API key.";
//         } else if (error.message.includes("quota")) {
//           errorMessage = "API quota exceeded. Please try again later.";
//         } else if (error.message.includes("network")) {
//           errorMessage = "Network error. Please check your internet connection.";
//         }
//       }
//       setError(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getViewportWidth = () => {
//     switch (viewport) {
//       case 'desktop':
//         return '1280px';        // typical laptop
//       case 'tablet':
//         return '768px';         // iPad portrait
//       case 'mobile':
//         return '375px';         // iPhone 14/15
//       default:                 // 'full'
//         return '100%';
//     }
//   };


//   const handleTheme = (text) => {
//     if (text === "Business & Corporate") setTheme("Color Palette: Blues, grays, whites with professional accents and Layout: Clean, structured, trust-focused");
//     if (text === "E-commerce & Online Store") setTheme("Color Palette: Brand-focused with strong CTAs (often red, orange, green buttons) and ayout: Product-centric with galleries and shopping features")
//     if (text === "Creative & Portfolio") setTheme("Color Palette: Bold, artistic, often black/white with accent colors and Layout: Visual-heavy, gallery-focused, minimal text");
//     if (text === "Blog & Content") setTheme("Color Palette: Readable combinations (often blues, greens, earth tones) and Layout: Content-first with good typography and readability");
//     if (text === "Service & Professional") setTheme("Color Palette: Industry-specific (blue for healthcare, green for education) and Layout: Service-focused with booking and information sections")
//   }

//   const handleDownloadZip = () => {
//     const zip = new JSZip();

//     // Add files to the ZIP
//     zip.file("index.html", `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Generated Component</title>
//   <link rel="stylesheet" href="style.css">
// </head>
// <body>
//   ${codes.html}
//   <script src="script.js"></script>
// </body>
// </html>
//     `);
//     zip.file("style.css", codes.css);
//     zip.file("script.js", codes.js);

//     // Generate ZIP and trigger download
//     zip.generateAsync({ type: "blob" }).then((content) => {
//       saveAs(content, "project.zip");
//     }).catch((err) => {
//       console.error("Failed to generate ZIP:", err);
//       setError("Failed to generate ZIP file. Please try again.");
//     });
//   };


//   const handleDeploy = async () => {
//     if (codes.html === '<!-- Your generated HTML will appear here -->') {
//       setError("No code to deploy. Please generate a website first.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setDeployedUrl('');

//     try {
//       const files = [
//         {
//           file: "index.html",
//           data: `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Generated Site</title>
//   <link rel="stylesheet" href="style.css">
// </head>
// <body>
//   ${codes.html}
//   <script src="script.js"></script>
// </body>
// </html>
//     `,
//         },
//         {
//           file: "style.css",
//           data: codes.css,
//         },
//         {
//           file: "script.js",
//           data: codes.js,
//         }
//       ];


//       const response = await fetch("https://api.vercel.com/v13/deployments", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${VERCEL_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: `website-${Date.now()}`,
//           files: files,
//           projectSettings: {
//             framework: null,
//             devCommand: null,
//             buildCommand: null,
//             outputDirectory: null
//           }
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         console.log("Error Data:", data);
//         throw new Error(`Deployment failed: ${data.error?.message || response.statusText}`);
//       }

//       const deploymentUrl = data.url.startsWith('https://')   // iski vjha se localhost se start nhi hua
//         ? data.url
//         : `https://${data.url}`;
//       setDeployedUrl(deploymentUrl);
//       setAiResponse(prev => prev + `\n\n✅ Deployment successful! View your site at: https://${deploymentUrl}`);
//     } catch (error) {
//       console.error("Deployment Failed:", error);
//       setError(`Failed to deploy the website: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const previewSrcDoc = `
//     <!DOCTYPE html>
//     <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Preview</title>
//         <style>
//           body { 
//             margin: 0; 
//             padding: 20px; 
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             background-color: #0f172a;
//             color: #f8fafc;
//           }
//           ${codes.css}
//         </style>
//       </head>
//       <body>
//         ${codes.html}
//         <script>
//           try {
//             ${codes.js}
//           } catch (error) {
//             console.error('JavaScript execution error:', error);
//             document.body.insertAdjacentHTML('beforeend', 
//               '<div style="color: #fecaca; background: #7f1d1d; padding: 10px; margin: 10px 0; border: 1px solid #ef4444; border-radius: 4px;">JavaScript Error: ' + error.message + '</div>'
//             );
//           }
//         </script>
//       </body>
//     </html>
//   `;

//   const handleClearAll = () => {
//     setCodes({
//       html: '<!-- Your generated HTML will appear here -->',
//       css: '/* Your generated CSS will appear here */',
//       js: '// Your generated JavaScript will appear here',
//     });
//     setChatHistory([]);
//     setAiResponse('');
//     setPrompt('');
//     setDeployedUrl('');
//   };

//   const handleCopyCode = (codeType) => {
//     navigator.clipboard.writeText(codes[codeType]);
//     const button = document.querySelector(`[data-copy="${codeType}"]`);
//     if (button) {
//       button.textContent = 'Copied!';
//       setTimeout(() => {
//         button.textContent = 'Copy';
//       }, 2000);
//     }
//   };

//   const isInitialState = codes.html === '<!-- Your generated HTML will appear here -->';

//   return (
//     <div className="min-h-[150vh] bg-[#2A2825] text-gray-100 font-sans overflow-x-hidden">
//       <BackgroundAnimation></BackgroundAnimation>
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float"></div>
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 animate-float-delay"></div>
//       </div>

//       {/* Main Content */}
//       <div className="relative z-10 p-4 sm:p-6 lg:p-8">

//         <div className={`w-full mx-auto transition-all duration-1000 ease-out ${isInitialState ? 'max-w-4xl' : 'flex flex-col sm:flex-row flex-wrap justify-between gap-8 max-w-8xl'}`}>

//           {/* Input Section */}
//           <div className={`transition-all  duration-1000 ease-out ${isInitialState ? 'w-full' : 'w-2/5 min-w-96'}`}>
//             <header className={`mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
//               <div className={`text-center transition-all duration-1000 ease-out ${isInitialState ? 'mb-12' : 'mb-6'}`}>
//                 <h1 className={`font-bold font-sans bg-clip-text text-white transition-all duration-1000 ease-out ${isInitialState ? 'text-xl  sm:text-5xl' : 'hidden'}`}>
//                   <div className=" text-center tracking-widest font-bold z-70 pt-4 sm:pt-7 md:pt-10">{text.map((char, index) => (
//                     <span
//                       key={index}
//                       className="inline-block  transition-transform text-white duration-200 ease-out hover:scale-125 hover:text-amber-400"
//                     >
//                       {char}
//                     </span>
//                   ))}
//                   </div>
//                 </h1>
//                 <div className="flex justify-center mt-4">
//                   <div className={`w-12 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 ${isInitialState ? 'text-5xl sm:text-5xl' : 'hidden text-3xl'} rounded-full animate-pulse`}></div>
//                 </div>
//                 <p className={`text-gray-400 mt-6 transition-all duration-1000 ease-out ${isInitialState ? 'text-lg' : 'hidden text-sm'}`}>
//                   Transform your ideas into production-ready code with AI assistance
//                 </p>
//               </div>
//             </header>

//             {/* Input Card */}
//             <div className={`bg-gray-800  rounded-2xl p-6 border border-gray-700 shadow-2xl shadow-gray-900/50 transition-all duration-700 ease-out ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}>
//               <div className="mb-6">
//                 <label className="relative block text-lg font-semibold text-gray-300 mb-3 transition-all duration-300 group">
//                   <span className="flex items-center gap-2">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-4 h-4 text-indigo-400 group-hover:text-indigo-500 transition-transform duration-300 group-hover:rotate-6"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M12 20h9M12 4h9M4 12h16M4 20h9M4 4h9"
//                       />
//                     </svg>
//                     {isInitialState ? 'Describe your Project' : 'What do you want to update in this Project?'}
//                   </span>
//                   <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
//                 </label>
//                 <textarea
//                   className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-out resize-none placeholder-gray-500 text-gray-100 leading-relaxed"
//                   rows={isInitialState ? "6" : "4"}
//                   value={prompt}
//                   onChange={(e) => setPrompt(e.target.value)}
//                   placeholder={`${isInitialState ? "e.g., Create a modern dashboard with animated charts and responsive design" : 'e.g., Change the theme of your Project'}`}
//                   disabled={isLoading}
//                 />
//                 <div className="text-right mt-2 text-gray-500 text-xs">
//                   {prompt.length}/1000
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => generateCode(false)}
//                   disabled={isLoading || !prompt.trim()}
//                   className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       <span className='hidden sm:block'>Generating...</span>
//                     </span>
//                   ) : (
//                     <>
//                       <span className="hidden sm:block relative z-10">Generate Code</span>
//                       <span className="block sm:hidden relative z-10">Code</span>
//                       <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//                     </>
//                   )}
//                 </button>

//                 {/* Select theme */}
//                 <select
//                   onChange={(e) => handleTheme(e.target.value)}
//                   className="w-22 p-2 bg-gray-700 border border-gray-600 rounded-xl cursor-pointer text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-out appearance-none"
//                   disabled={isLoading}
//                   defaultValue=""
//                 >
//                   <option value="" disabled>Theme 𐙚</option>
//                   <option value="Business & Corporate">Business & Corporate</option>
//                   <option value="E-commerce & Online Store">E-commerce & Online Store</option>
//                   <option value="Creative & Portfolio">Creative & Portfolio</option>
//                   <option value="Blog & Content">Blog & Content</option>
//                   <option value="Service & Professional">Service & Professional</option>
//                   <option value="">none</option>
//                 </select>

//                 <button
//                   title="Enhance Prompt"
//                   onClick={() => generateCode(true)}
//                   disabled={isLoading || !prompt.trim()}
//                   className="w-12 border-2 border-white cursor-pointer rounded-2xl hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed relative"
//                 > '✨'
//                 </button>

//                 <button
//                   onClick={handleClearAll}
//                   disabled={isLoading}
//                   title="New Project"
//                   className="py-1 px-2 md:px-6 md:py-3 flex gap-2 items-center justify-center cursor-pointer bg-gray-700 text-gray-200 font-medium rounded-xl hover:bg-gray-600 transition-all duration-200 ease-out disabled:opacity-50"
//                 >
//                   New
//                   <div className='text-amber-400'>
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-5 h-5"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                       strokeWidth={2}
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M8 10h8m-4-4v8m4 8H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
//                       />
//                     </svg>
//                   </div>
//                 </button>
//               </div>



//               {error && (
//                 <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl animate-shake">
//                   <p className="text-red-300 text-sm">{error}</p>
//                 </div>
//               )}
//             </div>
//             <div className='flex w-[90%] flex-wrap justify-around container mx-auto'>{
//               quickStart.map((item) => {
//                 return (
//                   <div onClick={() => {
//                     setPrompt(item.text);
//                     // generateCode();
//                   }} key={item.q} className="flex justify-center  mt-4 py-1 px-4 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-4xl animate-shake hover:bg-gray-700/80 hover:scale-105">
//                     <p className="text-gray-300 text-sm flex items-center font-bold"><div className='mr-2 text-2xl font-extrabold text-amber-300'>↑</div> {item.q}</p>
//                   </div>
//                 )
//               })
//             }</div>

//             {aiResponse && (
//               <div className="mt-6 p-8 bg-gradient-to-br from-gray-700/60 to-gray-800/60 border border-gray-600 rounded-2xl backdrop-blur-sm shadow-2xl shadow-gray-900/30">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
//                   <span className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
//                     Here's my Plan ⌯⌲
//                   </span>
//                   <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/50 to-transparent"></div>
//                 </div>

//                 <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-600/50 backdrop-blur-sm">
//                   <div className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
//                     {/* Enhanced AI Response with better formatting */}
//                     <div
//                       className="prose prose-invert max-w-none"
//                       dangerouslySetInnerHTML={{
//                         __html: aiResponse
//                           // Convert headings to larger, highlighted text with emojis
//                           .replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, title) => {
//                             const level = hashes.length;
//                             const emoji = level === 1 ? '🎯 ' : level === 2 ? '✨ ' : level === 3 ? '💡 ' : '🔹 ';
//                             const sizeClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
//                             const colorClass = level === 1 ? 'text-cyan-300' : level === 2 ? 'text-indigo-300' : 'text-purple-300';
//                             return `<h${level} class="font-bold ${sizeClass} ${colorClass} mb-4 mt-6 flex items-center gap-2 border-l-4 border-cyan-400 pl-4 bg-gradient-to-r from-cyan-900/20 to-transparent py-2 rounded-r-lg">${emoji}${title}</h${level}>`;
//                           })
//                           // Enhance bullet points with emojis
//                           .replace(/^\* (.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-cyan-400 mt-1">🔸</span><span class="text-gray-300">$1</span></li>')
//                           .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-indigo-400 mt-1">▸</span><span class="text-gray-300">$1</span></li>')
//                           // Enhance numbered lists
//                           .replace(/^\d+\.\s*(.+)$/gm, '<li class="flex items-start gap-2 mb-2"><span class="text-purple-400 font-semibold">📌</span><span class="text-gray-300">$1</span></li>')
//                           // Highlight important terms
//                           .replace(/\*\*(.+?)\*\*/g, '<strong class="text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded font-semibold">⭐ $1</strong>')
//                           .replace(/\*(.+?)\*/g, '<em class="text-blue-300 font-medium">$1</em>')
//                           // Add emojis to common programming terms
//                           .replace(/\b(HTML|html)\b/g, '🌐 HTML')
//                           .replace(/\b(CSS|css)\b/g, '🎨 CSS')
//                           .replace(/\b(JavaScript|javascript|JS|js)\b/g, '⚡ JavaScript')
//                           .replace(/\b(React|react)\b/g, '⚛️ React')
//                           .replace(/\b(Vue|vue)\b/g, '💚 Vue')
//                           .replace(/\b(Angular|angular)\b/g, '🅰️ Angular')
//                           .replace(/\b(Node\.js|nodejs)\b/g, '🟢 Node.js')
//                           .replace(/\b(API|api)\b/g, '🔗 API')
//                           .replace(/\b(Database|database|DB|db)\b/g, '🗄️ Database')
//                           .replace(/\b(Success|success)\b/g, '✅ Success')
//                           .replace(/\b(Error|error)\b/g, '❌ Error')
//                           .replace(/\b(Warning|warning)\b/g, '⚠️ Warning')
//                           .replace(/\b(Info|info)\b/g, 'ℹ️ Info')
//                           // Add line breaks for better readability
//                           .replace(/\n/g, '<br>')
//                       }}
//                     />
//                   </div>
//                 </div>

//                 {/* Action buttons for AI Response */}
//                 <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600/50">
//                   <div className="flex items-center gap-2 text-sm text-gray-400">
//                     <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
//                     Response generated successfully
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => navigator.clipboard.writeText(aiResponse)}
//                       className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-2"
//                     >
//                       Copy
//                     </button>
//                     <button
//                       onClick={() => setAiResponse('')}
//                       className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-2"
//                     >
//                       Clear
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Code/Preview Section */}
//           {!isInitialState && (
//             <div className="flex-1 min-w-0 animate-slide-in-right">
//               <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl shadow-gray-900/50 h-full flex flex-col overflow-hidden">
//                 {/* Tab Navigation */}
//                 <div className="flex border-b border-gray-700 p-4">
//                   <button
//                     onClick={() => setCop('code')}
//                     className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out relative overflow-hidden ${cop === 'code'
//                       ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
//                       : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
//                       }`}
//                   >
//                     <span className="relative z-10">Code Editor</span>
//                     {cop === 'code' && (
//                       <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
//                     )}
//                   </button>
//                   <button
//                     onClick={() => setCop('preview')}
//                     className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ml-3 relative overflow-hidden ${cop === 'preview'
//                       ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
//                       : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
//                       }`}
//                   >
//                     <span className="relative z-10">Live Preview</span>
//                     {cop === 'preview' && (
//                       <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
//                     )}
//                   </button>
//                   <button
//                     onClick={handleDownloadZip}
//                     disabled={isInitialState}
//                     className={`flex-1 flex justify-center items-center py-3 px-6 rounded-lg font-medium transition-all duration-200 ease-out ml-3 relative overflow-hidden ${isInitialState
//                       ? 'text-gray-400 opacity-50 cursor-not-allowed'
//                       : 'text-gray-200 cursor-pointer hover:text-white hover:bg-green-500'
//                       }`}
//                   >
//                     <div className='mr-2 text-2xl font-extrabold text-amber-300'>🡻</div> Download ZIP
//                   </button>
//                 </div>

//                 <div className="p-4 flex-1 flex flex-col min-h-0">
//                   {cop === 'code' ? (
//                     <div className="flex flex-col h-full min-h-0">
//                       {/* Language Tabs */}
//                       <div className="flex gap-2 mb-4 flex-shrink-0">
//                         {[
//                           { key: 'HTML', color: 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/40' },
//                           { key: 'CSS', color: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/40' },
//                           { key: 'JS', color: 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/40' }
//                         ].map((tab) => (
//                           <button
//                             key={tab.key}
//                             onClick={() => setLang(tab.key)}
//                             className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ease-out ${lang === tab.key
//                               ? tab.color.replace('hover:', '') + ' shadow-sm'
//                               : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
//                               }`}
//                           >
//                             {tab.key}
//                           </button>
//                         ))}
//                       </div>

//                       {/* Code Display */}
//                       <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden flex flex-col min-h-0 border border-gray-700">
//                         <div className="bg-gray-800 px-4 py-3 flex justify-between items-center flex-shrink-0 border-b border-gray-700">
//                           <span className="font-mono text-sm text-gray-400">
//                             {lang === 'HTML' && 'HTML Structure'}
//                             {lang === 'CSS' && 'CSS Styling'}
//                             {lang === 'JS' && 'JavaScript Logic'}
//                           </span>
//                           <button
//                             data-copy={lang.toLowerCase()}
//                             onClick={() => handleCopyCode(lang.toLowerCase())}
//                             className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 ease-out"
//                           >
//                             Copy
//                           </button>
//                         </div>
//                         <div className="flex-1 min-h-0 overflow-hidden">
//                           <textarea
//                             readOnly
//                             value={`${lang.toLowerCase() === 'html' ? `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Generated Component</title>
//   <link rel="stylesheet" href="style.css">
// </head>
// <body>
//   ${codes.html}
//   <script src="script.js"></script>
// </body>
// </html>` : codes[lang.toLowerCase()]}`}
//                             className="w-full h-full bg-gray-900/50 p-4 font-mono text-sm text-gray-300 border-none focus:ring-0 resize-none overflow-auto leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
//                             spellCheck={false}
//                             style={{ minHeight: '400px' }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="flex flex-col h-full min-h-0">
//                       <div className="bg-gray-700 px-3 py-2 rounded-t-xl flex flex-shrink-0 border-b border-gray-600">
//                         <span className="font-mono text-sm text-gray-300 flex items-center">Live<span className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse"></span></span>
//                         <div className='ml-10 flex'>
//                           {/* <a href='https://vercel.com/' target='_blank'><div className='bg-black rounded-3xl px-2 py-0.5 text-white font-extralight mr-3'><span className='text-white mx-0.5'>▲</span>Vercel</div></a> */}
//                           <button
//                             onClick={handleDeploy}
//                             disabled={isLoading || isInitialState}
//                             className={`bg-black rounded-3xl px-2 py-0.5 text-white font-extralight mr-3 ${isInitialState
//                               ? ' cursor-not-allowed'
//                               : 'cursor-pointer'
//                               }`}
//                           >
//                             {isLoading ? (
//                               <span className="flex items-center justify-center gap-2">
//                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                                 <span className='hidden sm:block'>Deploying...</span>
//                               </span>
//                             ) : (
//                               <>
//                                 <span className='text-white mx-0.5'>▲</span> Deploy
//                               </>
//                             )}
//                           </button>

//                           {/* <a href='https://www.netlify.com/' target='_blank'><div className='bg-blue-600 rounded-3xl px-2 py-0.5 font-extralight mr-3'><span className='text-[#8EFBF7] mx-0.5'>🐳</span>Netlify</div></a> */}
//                           <a href='https://github.com/' target='_blank'><div className='flex bg-gray-600 rounded-3xl px-2 py-0.5 font-extralight'><span><svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             width="24" height="24"
//                             viewBox="0 0 24 24"
//                             fill="currentColor"
//                             className='mx-0.5 text-black '
//                           >
//                             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.746.082-.73.082-.73 1.205.086 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.304 3.492.996.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.333-5.467-5.93 0-1.31.47-2.38 1.235-3.22-.124-.303-.535-1.523.116-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.37.823 1.102.823 2.222v3.293c0 .32.217.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
//                           </svg>
//                           </span>GitHub</div></a>
//                         </div>
//                       </div>
//                       {deployedUrl && (
//                         <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 w-full text-center">
//                           <a
//                             href={deployedUrl}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-400 hover:text-blue-300 font-medium text-sm"
//                           >
//                             {deployedUrl}
//                           </a>
//                         </div>
//                       )}
//                       <div className="flex gap-2 items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700 text-gray-300">
//                         {[
//                           { id: 'full', label: 'Full' },
//                           { id: 'desktop', label: 'Desktop' },
//                           { id: 'tablet', label: 'Tablet' },
//                           { id: 'mobile', label: 'Mobile' }
//                         ].map(v => (
//                           <button
//                             key={v.id}
//                             onClick={() => setViewport(v.id)}
//                             className={`px-3 py-1 rounded-md text-sm transition-all
//         ${viewport === v.id
//                                 ? 'bg-indigo-600 text-white shadow'
//                                 : 'hover:bg-gray-700 hover:text-gray-100'}`}
//                           >
//                             {v.label}
//                           </button>
//                         ))}
//                       </div>
//                       {/* ——— IFrame wrapper ——— */}
//                       <div
//                         className="flex-1 bg-gray-900 rounded-b-xl overflow-auto min-h-0 border border-gray-700 flex justify-center"
//                       >
//                         <iframe
//                           srcDoc={previewSrcDoc}
//                           title="Live Preview"
//                           sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
//                           className="border-none h-full"
//                           style={{
//                             width: getViewportWidth(),
//                             // keep at least 400 px tall but grow with flexbox
//                             minHeight: '400px',
//                             flexShrink: 0,
//                           }}
//                         />
//                       </div>

//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Custom Animations */}
//       <style jsx global>{`
//         @keyframes fade-in-up {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes slide-up {
//           from { opacity: 0; transform: translateY(30px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes slide-in-right {
//           from { opacity: 0; transform: translateX(40px); }
//           to { opacity: 1; transform: translateX(0); }
//         }
        
//         @keyframes float {
//           0%, 100% { transform: translateY(0) translateX(0); }
//           50% { transform: translateY(-20px) translateX(10px); }
//         }
        
//         @keyframes float-delay {
//           0%, 100% { transform: translateY(0) translateX(0); }
//           50% { transform: translateY(20px) translateX(-10px); }
//         }
        
//         @keyframes shake {
//           0%, 100% { transform: translateX(0); }
//           10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
//           20%, 40%, 60%, 80% { transform: translateX(5px); }
//         }
        
//         .animate-fade-in-up {
//           animation: fade-in-up 0.8s ease-out;
//         }
        
//         .animate-slide-up {
//           animation: slide-up 0.6s ease-out 0.2s both;
//         }
        
//         .animate-slide-in-right {
//           animation: slide-in-right 0.8s ease-out 0.3s both;
//         }
        
//         .animate-float {
//           animation: float 8s ease-in-out infinite;
//         }
        
//         .animate-float-delay {
//           animation: float-delay 10s ease-in-out infinite 2s;
//         }
        
//         .animate-shake {
//           animation: shake 0.5s ease-in-out;
//         }
        
//         .scrollbar-thin::-webkit-scrollbar {
//           width: 6px;
//           height: 6px;
//         }
        
//         .scrollbar-thin::-webkit-scrollbar-thumb {
//           background-color: rgba(156, 163, 175, 0.5);
//           border-radius: 3px;
//         }
        
//         .scrollbar-thin::-webkit-scrollbar-track {
//           background-color: rgba(31, 41, 55, 0.5);
//         }
//       `}</style>
//     </div>
//   );
// }