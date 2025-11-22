import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure your API key here or use environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

export const analyzeImage = async (video, canvas, ctx, mode = 'analysis') => {
    const apiKey = GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error("Please configure your Gemini API key in src/processors/geminiVision.js");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];

    let promptText = "";
    if (mode === 'detection') {
        promptText = `
      Detect objects in this image. 
      Return a JSON array where each object has:
      - "label": The name of the object.
      - "box_2d": A bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000.
      Example: [{"label": "cat", "box_2d": [100, 200, 300, 400]}]
    `;
    } else {
        promptText = "Analyze this image. Describe what you see in detail. Return a JSON object with a 'text' field containing the description.";
    }

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
        },
    };

    try {
        const result = await model.generateContent([promptText, imagePart]);
        const response = await result.response;
        const text = response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API Error: ${error.message}`);
    }
};
