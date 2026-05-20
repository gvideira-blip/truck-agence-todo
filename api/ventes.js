const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO = 'gvideira-blip/truck-agence-todo';
const FILE_PATH = 'ventes.json';

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'truck-agence-todo',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const data = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}`);
      if (data.content) {
        const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
        return res.status(200).json({ ...content, sha: data.sha });
      }
      return res.status(200).json({ ventes: [], sha: null });
    } catch(e) {
      return res.status(200).json({ ventes: [], sha: null });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        req.on('error', reject);
      });

      // Get current SHA
      let sha = null;
      try {
        const existing = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}`);
        sha = existing.sha;
      } catch(e) {}

      const content = Buffer.from(JSON.stringify({ ventes: body.ventes || [] }, null, 2)).toString('base64');
      const payload = {
        message: `update ventes.json`,
        content,
        ...(sha ? { sha } : {})
      };

      await githubRequest('PUT', `/repos/${REPO}/contents/${FILE_PATH}`, payload);
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
