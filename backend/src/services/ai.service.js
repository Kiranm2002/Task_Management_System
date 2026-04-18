const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.generateAIDescription = async (title) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Write a one-sentence professional task description." },
        { role: "user", content: `Title: ${title}` }
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq Description Error:", error.message);
    throw error;
  }
};

exports.getAssignmentAdvice = async (taskTitle, users) => {
  try {
    const prompt = `Task: "${taskTitle}". Available Users: ${JSON.stringify(users)}. 
    Recommend the best user based on lowest 'activeTasks'. Max 15 words.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq Recommendation Error:", error.message);
    return "AI advice unavailable.";
  }
};

exports.parseNaturalLanguage = async (text) => {
  try {
    const prompt = `Convert to JSON MongoDB query: "${text}". 
    Fields: status (pending, in-progress, completed), priority (low, medium, high). 
    Return ONLY JSON. Example: {"priority": "high"}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("Groq Search Error:", error.message);
    return {};
  }
};