import axios from "axios";
import Assessment from "../Model/Assements.js";
import Feedback from "../Model/Feedback.js";
import Performance from "../Model/Performance.js";
import User from "../Model/User.js";
import {
  questionGeneratorAgent,
  assessmentReviewerAgent,
  feedbackAgent,
} from "../Ai/aiAgents.js";

export const generateAssessment = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const question = await questionGeneratorAgent(topic || null, difficulty || "medium");

    const assessment = await Assessment.create({
      userId: req.user._id,
      topic: question.topic,
      title: question.title,
      question: question.problemStatement,
      problemData: question,
      difficulty: question.difficulty || difficulty || "medium",
      status: "pending",
    });

    res.status(201).json({ assessmentId: assessment._id, question });
  } catch (error) {
    console.error("Assessment generation error:", error);
    res.status(500).json({ message: "Failed to generate assessment. Please try again." });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { solution, language } = req.body;

    if (!solution || !solution.trim()) {
      return res.status(400).json({ message: "Solution cannot be empty" });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    if (assessment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (assessment.status === "reviewed") {
      return res.status(400).json({ message: "Assessment already submitted and reviewed" });
    }

    assessment.userAnswer = solution;
    assessment.status = "submitted";
    assessment.submittedAt = new Date();
    await assessment.save();

    const problemData = assessment.problemData || {
      title: assessment.title || assessment.topic,
      problemStatement: assessment.question,
      expectedTimeComplexity: "O(n)",
      expectedSpaceComplexity: "O(n)",
    };

    const reviewResult = await assessmentReviewerAgent(problemData, solution, language);

    const pastPerformance = await Performance.find({ userId: req.user._id }).lean();
    const feedbackResult = await feedbackAgent(problemData, reviewResult, pastPerformance);

    const savedFeedback = await Feedback.create({
      userId: req.user._id,
      assessmentId: assessment._id,
      isCorrect: reviewResult.isCorrect || false,
      score: reviewResult.score || 0,
      explanation: reviewResult.overallFeedback || "",
      improvementTip: feedbackResult.summary || "",
      weakConcept: feedbackResult.weaknesses?.join(", ") || "",
      correctnessAnalysis: reviewResult.correctnessAnalysis || "",
      timeComplexity: reviewResult.timeComplexity || "",
      timeComplexityAnalysis: reviewResult.timeComplexityAnalysis || "",
      spaceComplexity: reviewResult.spaceComplexity || "",
      spaceComplexityAnalysis: reviewResult.spaceComplexityAnalysis || "",
      codeQualityNotes: reviewResult.codeQualityNotes || "",
      suggestedApproach: reviewResult.suggestedApproach || "",
      rating: reviewResult.rating || "average",
      strengths: feedbackResult.strengths || [],
      weaknesses: feedbackResult.weaknesses || [],
      improvementPlan: feedbackResult.improvementPlan || [],
      motivationalNote: feedbackResult.motivationalNote || "",
      nextTopicSuggestion: feedbackResult.nextTopicSuggestion || "",
      roadmap: feedbackResult.roadmap || "",
    });

    assessment.aiScore = reviewResult.score || 0;
    assessment.aiReview = reviewResult.overallFeedback || "";
    assessment.status = "reviewed";
    assessment.isCorrect = reviewResult.isCorrect || false;
    assessment.feedback = reviewResult.overallFeedback || "";
    await assessment.save();

    await updatePerformance(req.user._id, assessment.topic, reviewResult);
    await updateUserStats(req.user._id);

    res.json({
      message: "Assessment reviewed successfully",
      review: reviewResult,
      feedback: feedbackResult,
      feedbackId: savedFeedback._id,
      score: reviewResult.score,
    });
  } catch (error) {
    console.error("Assessment submission error:", error);
    res.status(500).json({ message: "Failed to review assessment. Please try again." });
  }
};

export const getAssessmentFeedback = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const feedback = await Feedback.findOne({ assessmentId }).lean();
    if (!feedback) return res.status(404).json({ message: "Feedback not yet available" });

    res.json({ assessment: assessment.toObject(), feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssessmentHistory = async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const withFeedback = await Promise.all(
      assessments.map(async (a) => {
        const fb = await Feedback.findOne({ assessmentId: a._id }).lean();
        return { ...a, feedbackData: fb };
      })
    );

    res.json({ assessments: withFeedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function updatePerformance(userId, topic, reviewResult) {
  try {
    let perf = await Performance.findOne({ userId, topic });
    if (!perf) perf = new Performance({ userId, topic });

    perf.totalQuestions = (perf.totalQuestions || 0) + 1;
    if (reviewResult.isCorrect) perf.correctAnswers = (perf.correctAnswers || 0) + 1;
    perf.accuracy = Math.round((perf.correctAnswers / perf.totalQuestions) * 100);
    perf.lastLevel = reviewResult.score >= 80 ? "hard" : reviewResult.score >= 50 ? "medium" : "easy";

    if (reviewResult.score < 60) {
      if (!perf.weakAreas.includes(topic)) perf.weakAreas.push(topic);
    } else {
      perf.weakAreas = perf.weakAreas.filter((a) => a !== topic);
    }

    await perf.save();
  } catch (err) {
    console.error("Performance update error:", err);
  }
}

async function updateUserStats(userId) {
  try {
    const assessments = await Assessment.find({ userId, status: "reviewed" });
    if (assessments.length === 0) return;

    const totalScore = assessments.reduce((sum, a) => sum + (a.aiScore || 0), 0);
    const avgScore = Math.round(totalScore / assessments.length);

    let performance = "Pending Validation";
    if (avgScore >= 90) performance = "Outstanding";
    else if (avgScore >= 75) performance = "Excellent";
    else if (avgScore >= 60) performance = "Good";
    else if (avgScore >= 40) performance = "Average";
    else performance = "Needs Improvement";

    const latestFeedback = await Feedback.findOne({ userId }).sort({ createdAt: -1 });

    const user = await User.findById(userId);
    user.score = avgScore;
    user.performance = performance;
    if (latestFeedback) {
      user.strengths = latestFeedback.strengths || [];
      user.weaknesses = latestFeedback.weaknesses || [];
      user.feedback = latestFeedback.explanation || "";
      if (latestFeedback.roadmap) user.roadmap = latestFeedback.roadmap;
    }
    await user.save();
  } catch (err) {
    console.error("User stats update error:", err);
  }
}

export const runCode = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { code, language } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const problemData = assessment.problemData;
    if (!problemData || !problemData.examples || problemData.examples.length === 0) {
      return res.status(400).json({ message: "No test cases found for this problem" });
    }

    let wrapperCode = "";
    if (language === 'javascript' || language === 'js') {
      wrapperCode = `\n\n// --- Test Execution ---\n`;
      problemData.examples.forEach((ex, i) => {
        wrapperCode += `try { console.log("Test ${i+1} Output:", solve(${ex.input})); } catch(e) { console.log("Test ${i+1} Error:", e.message); }\n`;
      });
    } else if (language === 'python') {
      wrapperCode = `\n\n# --- Test Execution ---\n`;
      problemData.examples.forEach((ex, i) => {
        wrapperCode += `try:\n    print(f"Test ${i+1} Output:", solve(${ex.input}))\nexcept Exception as e:\n    print(f"Test ${i+1} Error:", str(e))\n`;
      });
    }

    const finalCode = (language === 'javascript' || language === 'python') ? code + wrapperCode : code;

    const langMap = {
      javascript: { language: 'javascript', version: '18.15.0' },
      python: { language: 'python', version: '3.10.0' },
      java: { language: 'java', version: '15.0.2' },
      cpp: { language: 'c++', version: '10.2.0' },
      c: { language: 'c', version: '10.2.0' },
    };

    const runLang = langMap[language] || langMap['javascript'];

    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: runLang.language,
      version: runLang.version,
      files: [{ content: finalCode }]
    });

    res.json({
      output: response.data.run.output,
      stderr: response.data.run.stderr,
      stdout: response.data.run.stdout,
      code: response.data.run.code
    });
  } catch (error) {
    console.error("Run code error:", error);
    res.status(500).json({ message: "Code execution failed" });
  }
};
