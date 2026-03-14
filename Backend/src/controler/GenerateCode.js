const { instruction } = require("../utils/Instruction");
const { submitCodeTool, enhancePromptTool } = require("../utils/tools");
const { GoogleGenerativeAI } = require("@google/generative-ai");



const generateCode = async (req, res) => {
    const { prompt, theme, isEnhance, chatHistory } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
        // console.log("here1")
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: instruction,
            tools: [{ functionDeclarations: [submitCodeTool, enhancePromptTool] }],
        });

        // console.log("here2");

        const myTheme = theme ? `${prompt} ${theme}` : prompt;
        const message = isEnhance ? `Enhance this prompt in 20-30 words: ${myTheme}` : myTheme;

        const chat = model.startChat({ history: chatHistory || [] });
        // console.log("here3")
        const result = await chat.sendMessageStream(message);
        // console.log("here4")

        // SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // If available, flush the headers immediately
        if (res.flushHeaders) res.flushHeaders();

        // Stream tokens as SSE 'data' messages containing JSON
        for await (const chunk of result.stream) {
            try {
                const chunkText = chunk.text();
                if (chunkText) {
                    const payload = { type: "token", text: chunkText };
                    res.write(`data: ${JSON.stringify(payload)}\n\n`);
                }
            } catch (chunkErr) {
                // avoid breaking the whole stream if one chunk fails to serialize
                console.error("Chunk processing error:", chunkErr);
            }
        }

        // console.log("here5")
        // After stream completion, fetch final response and functionCalls
        try {
            const finalResponse = await result.response;
            const fullText = typeof finalResponse.text === "function" ? finalResponse.text() : (finalResponse?.text || "");

            // functionCalls() may be a method — call it if present.
            let functionCalls = [];
            try {
                const rawFC = typeof finalResponse.functionCalls === "function" ? finalResponse.functionCalls() : (finalResponse?.functionCalls || []);
                functionCalls = Array.isArray(rawFC)
                    ? rawFC.map((fc) => {
                        // Normalize to plain JSON (avoid circular/complex objects)
                        return {
                            name: fc?.name,
                            args: fc?.args ?? fc?.arguments ?? null,
                        };
                    })
                    : [];
            } catch (fcErr) {
                console.warn("Unable to extract functionCalls:", fcErr);
            }

            // Send final 'done' SSE event with complete text + functionCalls
            const donePayload = { type: "done", text: fullText, functionCalls };
            res.write(`data: ${JSON.stringify(donePayload)}\n\n`);
        } catch (finalErr) {
            console.error("Error getting final response:", finalErr);
            const errPayload = { type: "error", message: finalErr?.message || "Failed to get final response" };
            res.write(`data: ${JSON.stringify(errPayload)}\n\n`);
        }

        // Close the stream
        res.end();
    } catch (err) {
        console.error("generateCode error:", err);
        // try to communicate the error to client via SSE (if headers not yet ended)
        try {
            const errPayload = { type: "error", message: err?.message || "Server error" };
            if (!res.headersSent) {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
            }
            res.write(`data: ${JSON.stringify(errPayload)}\n\n`);
            res.end();
        } catch (_) {
            // fallback
            res.status(500).json({ success: false, message: err?.message || "Server error" });
        }
    }
};


module.exports = { generateCode };