require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Gemini Models:");
            data.models
                .filter(m => m.name.includes('gemini'))
                .forEach(m => console.log(m.name));
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
