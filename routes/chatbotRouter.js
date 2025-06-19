const express = require("express");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const router = express.Router();
router.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // نموذج مجاني أو اقتصادي
        messages: [
        { role: 'system', content: 'You are a tourism expert specializing in historical and cultural information. Answer questions accurately and in a friendly tone.' },
        { role: 'user', content: question },
        ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
    } 
    catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
    }
});
module.exports = router;
