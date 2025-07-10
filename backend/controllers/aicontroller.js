require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// We are using a recommended model that is more likely to be available.
const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

// A helper function to safely extract JSON from the AI's text response
function extractJson(text) {
    const jsonMatch = text.match(/\{[\s\S]*?\}/); // Non-greedy match for the first JSON object
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]); // Parse the matched JSON object
        } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            return null;
        }
    }
    console.error("No JSON object found in the text.");
    return null;
}

// Generate Title and Description
exports.generateContent = async (req, res) => {
    const { productName, keywords, tone } = req.body;

    // A more reliable prompt for generating JSON
    const prompt = `
    Task: Generate SEO-optimized content for an e-commerce product.
    Product Name: "${productName}"
    Keywords: "${keywords}"
    Tone: "${tone}"
    Instructions: Your output MUST be a single, valid JSON object with two keys: "title" (a short, catchy title) and "description" (a compelling 2-3 line description). Do not include any text before or after the JSON object.
    
    `;

    // Example output:
    // {
    //     "title": "Example Title",
    //     "description": "This is an example description spanning two or three lines."
    // }
    try {
        console.log("Sending request to Hugging Face for content generation...");
        const response = await fetch(API_URL, {
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json", // Explicitly set Content-Type
            },
            method: "POST",
            body: JSON.stringify({ 
                inputs: prompt,
                parameters: { wait_for_model: true } // Important for cold-started models
            }),
        });

        const result = await response.json();
        
        // --- CRITICAL LOGGING ---
        // This will show you the exact response from the AI in your backend terminal
        console.log("Hugging Face Raw Response:", JSON.stringify(result, null, 2));

        if (result.error) {
            throw new Error(result.error);
        }

        const generatedText = result[0]?.generated_text || "";
        const parsedContent = extractJson(generatedText);

        if (!parsedContent) {
            // Fallback if JSON extraction fails
            return res.status(500).json({ message: "AI model returned an invalid format. Please try again." });
        }
        
        res.status(200).json(parsedContent);

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate AI content.", details: error.message });
    }
};

// AI Chatbot for Marketing Strategies
exports.chatWithAI = async (req, res) => {
    const { productName, message } = req.body;

    const prompt = `You are a helpful marketing expert chatbot. A user needs a marketing strategy for their product: "${productName}".
    User's question: "${message}"
    Provide a concise, actionable marketing tip.`;

    try {
        console.log("Sending request to Hugging Face for chat...");
        const response = await fetch(API_URL, {
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json", // Explicitly set Content-Type
            },
            method: "POST",
            body: JSON.stringify({ 
                inputs: prompt,
                parameters: { wait_for_model: true }
             }),
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorText = await response.text(); // Read raw text response
            console.error("API Error Response:", errorText);
            return res.status(response.status).json({ message: "Failed to communicate with AI.", error: errorText });
        }

        let result;
        try {
            result = await response.json(); // Attempt to parse JSON
        } catch (jsonError) {
            const rawText = await response.text(); // Fallback to raw text
            console.error("Failed to parse JSON response. Raw response:", rawText);
            return res.status(500).json({ message: "Invalid response from AI.", details: rawText });
        }

        // --- CRITICAL LOGGING ---
        console.log("Hugging Face Chat Raw Response:", JSON.stringify(result, null, 2));

        if (result.error) {
            throw new Error(result.error);
        }

        // Extract the reply more reliably
        const fullText = result[0]?.generated_text || "";
        const reply = fullText.split('actionable marketing tip.').pop().trim();

        if (!reply) {
             return res.status(500).json({ message: "AI model returned an empty reply." });
        }

        res.status(200).json({ reply });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ message: "Chatbot is currently unavailable.", details: error.message });
    }
};