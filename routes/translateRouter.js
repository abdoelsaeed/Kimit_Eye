const express = require("express");
const router = express.Router();
const translate = require("google-translate-api-x");

router.post("/", async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    if (!targetLanguage) {
      return res.status(400).json({ error: "targetLanguage is required" });
    }
    // sourceLanguage is optional for this library

    const translationResult = await translate(text, {
      from: sourceLanguage || "auto",
      to: targetLanguage,
    });

    res.status(200).json({
      message: "success",
      result: translationResult.text,
      sourceLanguage: translationResult.from.language.iso,
    });
  } catch (err) {
    console.error("Error during translation:", err);
    return res.status(500).json({
      error: "An error occurred while processing the translation",
      details: err.message,
    });
  }
});

module.exports = router;
