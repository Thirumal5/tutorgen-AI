import axios from "axios";
import User from "../Model/User.js";

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const updateCPProfiles = async (req, res) => {
  try {
    const { leetcode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cpProfiles = { leetcode: leetcode?.trim() || "" };
    await user.save();
    cache.delete(`lc_${user._id}`);

    res.json({ message: "LeetCode profile updated successfully", cpProfiles: user.cpProfiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCPStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profiles = user.cpProfiles || {};
    const result = { leetcode: null, profiles };

    if (profiles.leetcode) {
      result.leetcode = await fetchLeetCodeStats(user._id, profiles.leetcode);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCPStatsForUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profiles = user.cpProfiles || {};
    const result = { leetcode: null, profiles };

    if (profiles.leetcode) {
      result.leetcode = await fetchLeetCodeStats(user._id, profiles.leetcode);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function fetchLeetCodeStats(userId, username) {
  const cacheKey = `lc_${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const query = `
      query getUserProfile($username: String!) {
        allQuestionsCount { difficulty count }
        matchedUser(username: $username) {
          contributions { points }
          profile { reputation ranking }
          submitStats {
            acSubmissionNum { difficulty count submissions }
            totalSubmissionNum { difficulty count submissions }
          }
        }
      }
    `;

    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username } },
      { 
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://leetcode.com/"
        }, 
        timeout: 10000 
      }
    );

    if (data.errors || !data.data.matchedUser) {
      throw new Error("User not found or GraphQL error");
    }

    const matchedUser = data.data.matchedUser;
    const allQuestions = data.data.allQuestionsCount || [];
    const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];
    const totalSubmissions = matchedUser.submitStats?.totalSubmissionNum || [];

    const getCount = (arr, diff) => arr.find(a => a.difficulty === diff)?.count || 0;
    const getSubs = (arr, diff) => arr.find(a => a.difficulty === diff)?.submissions || 0;

    const totalEasy = getCount(allQuestions, "Easy");
    const totalMedium = getCount(allQuestions, "Medium");
    const totalHard = getCount(allQuestions, "Hard");
    const totalQuestions = getCount(allQuestions, "All");

    const easySolved = getCount(acSubmissions, "Easy");
    const mediumSolved = getCount(acSubmissions, "Medium");
    const hardSolved = getCount(acSubmissions, "Hard");
    const totalSolved = getCount(acSubmissions, "All");

    const totalAcceptedSubmissions = getSubs(acSubmissions, "All");
    const totalAllSubmissions = getSubs(totalSubmissions, "All");
    const acceptanceRate = totalAllSubmissions > 0 ? parseFloat(((totalAcceptedSubmissions / totalAllSubmissions) * 100).toFixed(2)) : 0;

    const result = {
      platform: "LeetCode",
      username,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalQuestions,
      totalEasy,
      totalMedium,
      totalHard,
      ranking: matchedUser.profile?.ranking || "N/A",
      acceptanceRate,
      contributionPoints: matchedUser.contributions?.points || 0,
      reputation: matchedUser.profile?.reputation || 0,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error("LeetCode Fetch Error:", errorMsg);
    return { platform: "LeetCode", username, error: `Failed to fetch: ${errorMsg}` };
  }
}
