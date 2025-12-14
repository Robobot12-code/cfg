const Groq = require("groq-sdk");

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

class AIService {
    static async generate(prompt) {
        try {
            const response = await client.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "user", content: prompt }
                ]
            });

            return response.choices[0].message.content;

        } catch (error) {
            console.error("AIService Error:", error);
            throw new Error("Erreur IA (GROQ).");
        }
    }
}

module.exports = AIService;
