const aiService = require('../services/aiService');
const contextService = require('../services/contextService');
const db = require('../config/db');

exports.chat = async (req, res) => {
    const { message } = req.body;
    try {
        // 1. Fetch Context
        const context = await contextService.getSystemContext();

        // 2. Build System Prompt
        const systemPrompt = `
        Tu es un Assistant CEO Agentique. Tu as accès aux données de l'entreprise.
        
        DONNÉES ACTUELLES:
        - Employés: ${JSON.stringify(context.employees)}
        - Relations Externes: ${JSON.stringify(context.relations)}
        
        INSTRUCTIONS:
        - Utilise ces données pour répondre aux questions (exemple: "Qui est en ligne ?", "Quels sont les prospects ?").
        - Si on te demande d'effectuer une action (simulée), confirme-la.
        - Sois concis et professionnel.
        
        MESSAGE UTILISATEUR:
        ${message}
        `;

        const reply = await aiService.generate(systemPrompt);
        res.json({ reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur IA" });
    }
};

exports.analyzeRecruitment = (req, res) => {
    db.all("SELECT role FROM employees", [], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const currentRoles = rows.map(r => r.role);
        const prompt = `Voici les rôles actuels dans mon entreprise : ${currentRoles.join(", ")}. 
        Quel est le prochain rôle clé que je devrais recruter pour une startup tech en croissance ? 
        Réponds succinctement avec le rôle et une courte justification.`;

        try {
            const suggestion = await aiService.generate(prompt);
            res.json({
                analysis: `Effectif actuel: ${rows.length}. Postes clés: ${currentRoles.join(', ')}.`,
                suggestion: suggestion
            });
        } catch (error) {
            res.status(500).json({ error: "Erreur Analyse IA" });
        }
    });
};
