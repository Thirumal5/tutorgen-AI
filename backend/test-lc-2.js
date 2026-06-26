import axios from 'axios';

async function test(username) {
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
      throw new Error("User not found or GraphQL error: " + JSON.stringify(data.errors));
    }

    const matchedUser = data.data.matchedUser;
    const allQuestions = data.data.allQuestionsCount || [];
    const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];
    const totalSubmissions = matchedUser.submitStats?.totalSubmissionNum || [];

    const getCount = (arr, diff) => arr.find(a => a.difficulty === diff)?.count || 0;
    const getSubs = (arr, diff) => arr.find(a => a.difficulty === diff)?.submissions || 0;

    const totalEasy = getCount(allQuestions, "Easy");
    console.log("totalEasy", totalEasy);

    console.log("Success!");
  } catch (err) {
    console.error("LeetCode Fetch Error:", err.response ? err.response.data : err.message);
  }
}

test("Thiru_17");
