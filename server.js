require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/check", async (req, res) => {

    try {

        const { nickname } = req.body;

        const prompt = `
Ти адміністратор Ukraine GTA.

Перевір нікнейм "${nickname}".

Правила:
- Формат лише "Ім'я Прізвище".
- Реалістичне ім'я.
- Реалістичне прізвище.
- Без образ.
- Без предметів.
- Без назв організацій.
- Без мемів.
- Без випадкового набору букв.

Відповідай ТІЛЬКИ JSON.

Приклад:

{
  "status":"RP",
  "chance":96,
  "reason":"Нік відповідає правилам RP."
}

або

{
  "status":"NON RP",
  "chance":99,
  "reason":"Ім'я містить випадковий набір букв."
}
`;

  let response;

for (let i = 0; i < 3; i++) {
    try {
        response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
});

        break;
    } catch (e) {
        if (e.code !== "ECONNRESET" && e.message !== "fetch failed") {
            throw e;
        }

        console.log(`Повторна спроба ${i + 1}/3...`);
        await new Promise(r => setTimeout(r, 1000));
    }
}

console.log(response);

const text = typeof response.text === "function"
    ? await response.text()
    : response.text;

console.log("TEXT:", text);

res.send(JSON.parse(text));

} catch (e) {
    console.error("=== ERROR ===");
    console.error(e);

    if (e.code === "ECONNRESET" || e.message === "fetch failed") {
        return res.status(503).json({
            status: "ERROR",
            chance: 0,
            reason: "Тимчасова помилка з'єднання з Gemini. Спробуйте ще раз."
        });
    }

    res.status(500).json({
        status: "ERROR",
        chance: 0,
        reason: e.message
    });
}

});

app.listen(3000, () => {

    console.log("Server started: http://localhost:3000");

});