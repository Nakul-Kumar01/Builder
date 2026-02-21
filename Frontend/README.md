# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


// ✅ Correct (GoogleGenerativeAI)
const genAI = new GoogleGenerativeAI("api-key");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  tools: [{ functionDeclarations: [tool] }]
});

// ❌ Incorrect structure you were using
const ai = new GoogleGenAI({ apiKey: "api-key" });
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash", // This model doesn't exist
  contents: History,
  config: { systemInstruction: "...", tools: [...] }
});







// ✅ GoogleGenerativeAI
const result = await chat.sendMessage(prompt);
const response = result.response;
const functionCalls = response.functionCalls(); // Method call
const textResponse = response.text(); // Method call

// ❌ What you were trying with GoogleGenAI
const functionCalls = response.functionCalls; // Direct property access
const textResponse = response.text; // Direct property access





// Topics:
- introduction complete
- java oops : polimorphism , abstraction and Interface
- explain project : redis
- dsa for Interviews exlanation
- "design structure to answer the question"