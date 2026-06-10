const fs = require('fs');
const https = require('https');

async function callGroq(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error('Groq parse error: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function postGitHubComment(comment) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ body: comment });
    const [owner, repo] = process.env.REPO.split('/');

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${process.env.PR_NUMBER}/comments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'AI-PR-Review-Action'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    const diff = fs.readFileSync('pr_diff.txt', 'utf8').slice(0, 5000);

    if (!diff.trim()) {
      console.log('No changes found in this PR');
      return;
    }

    console.log('Calling Gemini API for code review...');

    const prompt = `You are a senior software engineer reviewing a Node.js/Express backend pull request.

Review this code diff and give feedback on:
1. 🐛 Bugs or potential issues
2. 🔒 Security concerns
3. ✨ Code quality improvements
4. ⚡ Performance tips

Keep it concise and actionable. Format your response in markdown.

Code diff:
\`\`\`
${diff}
\`\`\``;

    const review = await callGroq(prompt);

    const comment = `## 🤖 AI Code Review (Powered by Gemini)

${review}

---
*Auto-generated review. Use your own judgment before acting on suggestions.*`;

    console.log('Posting comment on PR...');
    await postGitHubComment(comment);
    console.log('Done! AI review posted successfully ✅');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();