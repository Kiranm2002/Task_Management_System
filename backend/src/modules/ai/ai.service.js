const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const {Activity} = require("../../shared/models/collaboration.model");
const User = require("../../shared/models/user.model")
const Team = require("../../shared/models/team.model")

const STAGES = ["backlog", "todo", "in-progress", "in-review", "blocked", "completed", "archived"];

const safeParse = (content) => {
    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("AI JSON Parse Error:", e);
        return { error: "Failed to parse AI response", raw: content };
    }
};


exports.generateAIDescription = async (title) => {
    const prompt = `Analyze the task title: "${title}". 
    Generate a professional, concise description and a list of 4-5 technical subtasks.
    Return ONLY a JSON object with this exact structure: 
    { 
      "description": "string", 
      "subtasks": ["string", "string"], 
      "priority": "low|medium|high|urgent" 
    }`; 
    
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
    });

    const aiResponse = safeParse(chatCompletion.choices[0].message.content);
    
    return {
        description: aiResponse.description || "",
        subtasks: Array.isArray(aiResponse.subtasks) ? aiResponse.subtasks : [],
        priority: aiResponse.priority || "medium"
    };
};


exports.predictDelay = async (taskData, userHistory) => {
    const prompt = `Act as a Project Manager. Predict the delay risk for this task.
    
    TASK DATA:
    - Title: ${taskData.title}
    - Estimated Hours: ${taskData.estimatedHours}
    - Actual Hours Spent so far: ${taskData.actualHours}
    - Due Date: ${taskData.dueDate}
    
    USER HISTORY (Last 5 tasks):
    ${JSON.stringify(userHistory)}

    Analyze if the user is trending toward a delay.
    Return ONLY JSON: { "risk": "low|medium|high", "reason": "concise explanation", "predictedHours": number }`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
    });

    return safeParse(chatCompletion.choices[0].message.content);
};


exports.parseNaturalLanguage = async (text, context) => {
    const today = new Date().toISOString();

    const systemPrompt = `
    You are an expert MongoDB Query Generator for an Enterprise Task Management System.
    
    SCHEMA CONTEXT:
    - Stages: backlog, todo, in-Progress, in-review, blocked, completed, archived.
    - Priorities: low, medium, high, urgent.
    - Fields: title, status, priority, dueDate, assignedTo (ID), projectId (ID), teamId (ID).
    - Metadata: Today's Date is ${today}. Current Team context: ${context.teamId}.
    - ADMIN CONTEXT: You are generating a query for an ADMIN. They can see ALL tasks in team ${context.teamId}.
    - IMPORTANT: If the user mentions a person's name, use the field "assignedTo". 

    TASK:
    Convert the User Request into a JSON object with two keys:
    1. "type": Either "FIND" (for simple filtering) or "AGGREGATE" (for counts, least/most, or grouping).
    2. "payload": The actual MongoDB query object or pipeline array.

    RULES:
    - If "FIND": Return a standard filter object. Use regex for titles: { "title": { "$regex": "...", "$options": "i" } }.
    - If "AGGREGATE": Return an array of pipeline stages (e.g., $group, $sort, $limit).
    - DELETION POLICY: Always include { "isDeleted": false } in the match criteria.
    - Always enforce the teamId: ${context.teamId} in the query for security.
    - Return ONLY valid JSON. No prose.
    - "When performing a $group by assignedTo, always use $lookup to join the 'users' collection so the final output contains the user's name and email, not just the ID."
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(chatCompletion.choices[0].message.content);
        return result;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return { type: "FIND", payload: { teamId: context.teamId } };
    }
};

exports.getAssignmentAdvice = async (title, userWorkload) => {
    const prompt = `Task to Assign: "${title}".
    Current Team Workload and Roles:
    ${JSON.stringify(userWorkload)}

    Recommend the best user for this task. Prioritize those with the lowest 'activeTasks' and roles that match the task title.
    Return ONLY JSON: { "recommendedUserId": "string", "reason": "string", "alternativeId": "string" }`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
    });

    return safeParse(chatCompletion.choices[0].message.content);
};

exports.processAssistantChat = async (message, context) => {
    const recentActivity = await Activity.find({ 
        ...(context.taskId ? { taskId: context.taskId } : {}) 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'name');

    const activityContext = recentActivity.length > 0 
        ? recentActivity.map(log => 
            `- ${log.userId?.name || 'System'} performed ${log.action}: ${log.description} (${log.createdAt.toLocaleString()})`
          ).join("\n")
        : "No recent activity recorded.";

    const systemPrompt = `
        You are the "Enterprise Assistant" for a MERN-stack platform.
        User: ${context.userName}
        Team Context: ${context.teamId}

        RECENT ACTIVITY LOGS:
        ${activityContext}

        CAPABILITIES:
        1. Summarize progress: Use the logs to answer "what happened".
        2. Task Search: Respond with "suggestedAction": "SEARCH" for queries like "What's overdue?".
        3. Task Creation: Provide JSON suggestions for tasks if requested.

        OUTPUT FORMAT (Strict JSON):
        {
        "text": "Your verbal response here",
        "suggestedAction": "SEARCH" | "CREATE" | null,
        "actionData": {} | null
        }

        INSTRUCTIONS:
        - Always include a "text" field.
        - If the user says something simple like "Hello", respond warmly in the "text" field.
        - Keep responses professional and concise.
        `;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" } 
    });
    const content = chatCompletion.choices[0].message.content;
    const aiResponse = JSON.parse(content);

    return {
        text: aiResponse.text || "How can I help you today?", 
    suggestedAction: aiResponse.suggestedAction || null,
    actionData: aiResponse.actionData || null,
    timestamp: new Date()
    };
};