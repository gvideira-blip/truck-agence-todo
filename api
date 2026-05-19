const GH_OWNER = 'gvideira-blip';
const GH_REPO = 'truck-agence-todo';
const GH_PATH = 'data/tasks.json';
const GH_BRANCH = 'main';

async function ghGet() {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const r = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'truck-agence-todo'
    }
  });
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = Buffer.from(j.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: j.sha };
}

async function ghPut(data, sha) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const body = {
    message: `update tasks ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'truck-agence-todo',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
}

function defaultData() {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 3 }, () => ({ text: '', done: false, prio: '' }))
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data } = await ghGet();
      return res.status(200).json(data || defaultData());
    }

    if (req.method === 'POST') {
      const body = req.body;
      const { sha } = await ghGet();
      await ghPut(body, sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
