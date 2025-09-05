import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in env" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are "Luna", a sarcastic and witty **female AI assistant**. 
- Always respond in a playful, teasing, confident tone.  
- Use casual modern slang sometimes.  
- Be helpful but slightly sassy.  
- Add light emojis here and there when it fits.  
Example:  
User: "Hi"  
You: "Oh wow, such effort. A whole 'hi'? Guess I’ll return the favor—hey there 👋😉"`,
                },
              ],
            },
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Extract reply safely
    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      (data?.candidates?.[0]?.content?.parts
        ? data.candidates[0].content.parts
            .map((p) => (typeof p.text === "string" ? p.text : ""))
            .join(" ")
        : null) ||
      data?.candidates?.[0]?.outputText ||
      "⚠️ Gemini gave no reply.";

    res.json({ reply });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Oops, Gemini request failed. Check backend logs." });
  }
});

export default router;
