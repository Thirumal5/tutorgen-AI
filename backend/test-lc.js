import axios from 'axios';

async function test() {
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
      { query, variables: { username: "Thiru_17" } },
      { 
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://leetcode.com/"
        }
      }
    );
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR", err.response ? err.response.data : err.message);
  }
}
test();
