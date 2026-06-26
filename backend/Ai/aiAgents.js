import { Groq } from "groq-sdk";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

export const questionGeneratorAgent = async (topic = null, difficulty = "medium") => {
  const topicList = [
    "Arrays", "Strings", "Linked Lists", "Stacks", "Queues",
    "Trees", "Binary Search Trees", "Heaps", "Graphs",
    "Hash Tables", "Dynamic Programming", "Recursion",
    "Sorting Algorithms", "Searching Algorithms", "Greedy Algorithms",
    "Bit Manipulation", "Two Pointers", "Sliding Window",
    "Backtracking", "Matrix"
  ];

  const selectedTopic = topic || topicList[Math.floor(Math.random() * topicList.length)];

  const systemPrompt = `You are a DSA Question Generator for competitive programming practice.
Generate a unique, creative Data Structures & Algorithms coding problem.

RULES:
- Create something original, NOT well-known problems like Two Sum or Reverse Linked List
- Include a clear problem statement, 2-3 examples with input/output, and constraints
- The problem should be solvable in 30-45 minutes
- IMPORTANT: For 'input', provide ONLY the comma-separated raw values ready to be passed to a function (e.g., \`[2, 7, 11], 9\`). DO NOT include variable names like \`nums = ...\`.

Respond with ONLY valid JSON, no markdown, no backticks:
{
  "title": "Problem Title",
  "topic": "${selectedTopic}",
  "difficulty": "${difficulty}",
  "problemStatement": "Full problem description...",
  "examples": [
    { "input": "[2, 7, 11, 15], 9", "output": "[0, 1]", "explanation": "why" }
  ],
  "constraints": ["1 <= n <= 10^5"],
  "expectedTimeComplexity": "O(n)",
  "expectedSpaceComplexity": "O(1)",
  "hints": ["hint 1", "hint 2"]
}`;

  const response = await getGroq().chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a ${difficulty} level DSA problem on: ${selectedTopic}` }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.9,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      title: `${selectedTopic} Challenge`,
      topic: selectedTopic,
      difficulty,
      problemStatement: content,
      examples: [{ input: "See above", output: "See above", explanation: "" }],
      constraints: ["1 <= n <= 10^5"],
      expectedTimeComplexity: "O(n)",
      expectedSpaceComplexity: "O(n)",
      hints: ["Think carefully about the data structure."],
    };
  }
};

export const assessmentReviewerAgent = async (problem, studentSolution, language = "javascript") => {
  const systemPrompt = `You are an expert Code Reviewer evaluating a DSA solution.

Evaluate on: Correctness (40%), Time Complexity (20%), Space Complexity (15%), Code Quality (15%), Edge Cases (10%).

Respond with ONLY valid JSON, no markdown, no backticks:
{
  "score": 75,
  "isCorrect": true,
  "correctnessAnalysis": "...",
  "timeComplexity": "O(n)",
  "timeComplexityAnalysis": "...",
  "spaceComplexity": "O(1)",
  "spaceComplexityAnalysis": "...",
  "codeQualityNotes": "...",
  "edgeCaseHandling": "...",
  "suggestedApproach": "...",
  "rating": "good",
  "overallFeedback": "..."
}

rating must be one of: "excellent", "good", "average", "needs_improvement", "poor"`;

  const response = await getGroq().chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `PROBLEM: ${problem.title}\n${problem.problemStatement}\nExpected Time: ${problem.expectedTimeComplexity}\nExpected Space: ${problem.expectedSpaceComplexity}\n\nSTUDENT SOLUTION (${language}):\n${studentSolution}`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      score: 50,
      isCorrect: false,
      correctnessAnalysis: "Could not fully analyze.",
      timeComplexity: "Unknown",
      timeComplexityAnalysis: content,
      spaceComplexity: "Unknown",
      spaceComplexityAnalysis: "",
      codeQualityNotes: "Manual review recommended.",
      edgeCaseHandling: "Could not determine.",
      suggestedApproach: "",
      rating: "average",
      overallFeedback: content || "AI reviewer encountered an issue.",
    };
  }
};

export const feedbackAgent = async (problem, reviewResult, studentHistory = []) => {
  const historyContext = studentHistory.length > 0
    ? `Past performance: ${studentHistory.map(h => `${h.topic}: ${h.score}/100`).join(", ")}`
    : "This is the student's first assessment.";

  const systemPrompt = `You are a Learning Coach generating constructive feedback.
Give specific actionable improvements based on the student's code submission and score.
The roadmap should list week-by-week topics to study based on weak areas.

You MUST respond with ONLY a valid JSON object. No markdown formatting, no backticks, no extra text.
The JSON must strictly follow this exact schema:
{
  "summary": "2-3 sentence summary",
  "strengths": ["strength 1"],
  "weaknesses": ["area 1"],
  "improvementPlan": [{ "area": "topic", "suggestion": "what to do", "resources": "where to learn" }],
  "motivationalNote": "encouraging message",
  "nextTopicSuggestion": "next topic",
  "performanceLevel": "good",
  "roadmap": [
    { "week": 1, "topic": "topic name", "focus": "what to study specifically" },
    { "week": 2, "topic": "next topic", "focus": "what to study specifically" }
  ]
}`;

  const response = await getGroq().chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Topic: ${problem.topic} (${problem.difficulty})\nScore: ${reviewResult.score}/100\nRating: ${reviewResult.rating}\nCorrectness: ${reviewResult.correctnessAnalysis}\n${historyContext}`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: "Assessment completed.",
      strengths: ["Attempted the problem"],
      weaknesses: ["Review the suggested approach"],
      improvementPlan: [{ area: problem.topic, suggestion: "Practice more", resources: "LeetCode" }],
      motivationalNote: "Keep going! Every problem makes you stronger. 💪",
      nextTopicSuggestion: problem.topic,
      performanceLevel: reviewResult.rating || "average",
      roadmap: [
        { week: 1, topic: problem.topic, focus: "Review basic concepts and time complexities." },
        { week: 2, topic: "Arrays & Strings", focus: "Practice two-pointer and sliding window techniques." }
      ],
    };
  }
};
