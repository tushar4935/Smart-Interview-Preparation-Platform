const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

const MODEL = 'gemini-2.0-flash';
const CALL_TIMEOUT = 15000;

let model = null;

// lazy init so a missing key doesn't crash the app at boot - we just fall back
const getModel = () => {
  if (model) return model;
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  });
  return model;
};

const isEnabled = () => Boolean(process.env.GEMINI_API_KEY);

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('gemini timeout')), ms)),
  ]);

// gemini is told to return json, but it still occasionally wraps it in ```json
// fences or adds a stray sentence. pull out the first real object/array.
const parseJson = (raw) => {
  if (!raw) throw new Error('empty response');
  let text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = text.search(/[[{]/);
  if (start === -1) throw new Error('no json found in response');
  const openChar = text[start];
  const closeChar = openChar === '{' ? '}' : ']';
  const end = text.lastIndexOf(closeChar);
  if (end === -1) throw new Error('unterminated json in response');
  return JSON.parse(text.slice(start, end + 1));
};

const clampScore = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(10, Math.round(num)));
};

// ---- fallback: the original keyword matcher, kept intentionally ----
// if gemini is down/over quota we still want to hand the user *something*.
const keywordScore = (userAnswer, expectedAnswer, keywords = []) => {
  if (!userAnswer || userAnswer.trim().length < 10) {
    return {
      score: 0,
      verdict: 'No answer',
      feedback: 'No meaningful answer was provided. Give it a proper attempt so it can be evaluated.',
      strengths: [],
      improvements: ['Write at least a couple of sentences explaining your reasoning.'],
      source: 'keyword',
    };
  }

  const ans = userAnswer.toLowerCase();
  let score = 2;
  const hit = [];
  const missed = [];

  if (expectedAnswer) {
    const expWords = expectedAnswer.toLowerCase().split(' ').filter((w) => w.length > 4);
    const matches = expWords.filter((w) => ans.includes(w));
    if (expWords.length) score += Math.min(4, Math.floor((matches.length / expWords.length) * 5));
  }

  (keywords || []).forEach((kw) => (ans.includes(kw.toLowerCase()) ? hit.push(kw) : missed.push(kw)));
  if (keywords && keywords.length) {
    score += Math.min(4, Math.floor((hit.length / keywords.length) * 4));
  }
  score = Math.min(10, score);

  const verdict = score >= 7 ? 'Strong' : score >= 4 ? 'Partial' : 'Weak';
  const feedback =
    score >= 7
      ? 'Solid answer that touches the key concepts for this question.'
      : score >= 4
      ? 'Reasonable attempt, but a few important points are missing.'
      : 'This misses most of the core ideas the question is looking for.';

  return {
    score,
    verdict,
    feedback,
    strengths: hit.slice(0, 4).map((k) => `Mentioned ${k}`),
    improvements: missed.slice(0, 4).map((k) => `Explain the role of ${k}`),
    source: 'keyword',
  };
};

const scorePrompt = (question, expectedAnswer, candidateAnswer) => `
You are a strict but fair senior technical interviewer. Evaluate the candidate's answer
by MEANING, not by keyword overlap. Reward correct answers that use different wording, and
penalise answers that just stuff in buzzwords without demonstrating real understanding.

Question: ${question}
Reference answer (for your judgement only, not shown to the candidate): ${expectedAnswer || 'N/A'}
Candidate's answer: ${candidateAnswer}

Return ONLY JSON in this exact shape:
{
  "score": <integer 0-10>,
  "verdict": "<3-6 word summary>",
  "feedback": "<2-3 sentences of specific, actionable feedback>",
  "strengths": ["<what they got right>"],
  "improvements": ["<what to add or fix>"]
}`;

const scoreAnswer = async (question, expectedAnswer, candidateAnswer, keywords = []) => {
  if (!candidateAnswer || candidateAnswer.trim().length < 10) {
    return keywordScore(candidateAnswer, expectedAnswer, keywords);
  }

  const m = getModel();
  if (!m) return keywordScore(candidateAnswer, expectedAnswer, keywords);

  try {
    const result = await withTimeout(
      m.generateContent(scorePrompt(question, expectedAnswer, candidateAnswer)),
      CALL_TIMEOUT
    );
    const data = parseJson(result.response.text());
    return {
      score: clampScore(data.score),
      verdict: String(data.verdict || 'Evaluated').slice(0, 60),
      feedback: String(data.feedback || '').slice(0, 800),
      strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 5).map(String) : [],
      improvements: Array.isArray(data.improvements) ? data.improvements.slice(0, 5).map(String) : [],
      source: 'ai',
    };
  } catch (err) {
    logger.warn(`AI scoring failed, falling back to keywords: ${err.message}`);
    return keywordScore(candidateAnswer, expectedAnswer, keywords);
  }
};

const followUpPrompt = (question, candidateAnswer) => `
A candidate just answered an interview question. As the interviewer, ask ONE natural
follow-up question that digs into their answer or probes a gap. Keep it to a single sentence.

Original question: ${question}
Their answer: ${candidateAnswer}

Return ONLY JSON: { "followUp": "<your question>" }`;

const generateFollowUp = async (question, candidateAnswer) => {
  const m = getModel();
  if (!m || !candidateAnswer || candidateAnswer.trim().length < 10) return null;
  try {
    const result = await withTimeout(
      m.generateContent(followUpPrompt(question, candidateAnswer)),
      CALL_TIMEOUT
    );
    const data = parseJson(result.response.text());
    const q = String(data.followUp || '').trim();
    return q.length > 5 ? q : null;
  } catch (err) {
    logger.warn(`AI follow-up failed: ${err.message}`);
    return null;
  }
};

const skillsPrompt = (resumeText) => `
Extract the technical skills and technologies from this resume text. Include languages,
frameworks, databases, and tools. Ignore soft skills and generic words.

Resume:
${resumeText.slice(0, 6000)}

Return ONLY JSON: { "skills": ["skill1", "skill2", ...] } with at most 20 skills.`;

const extractSkills = async (resumeText) => {
  const m = getModel();
  if (!m || !resumeText || resumeText.trim().length < 30) return [];
  try {
    const result = await withTimeout(m.generateContent(skillsPrompt(resumeText)), CALL_TIMEOUT);
    const data = parseJson(result.response.text());
    if (!Array.isArray(data.skills)) return [];
    // de-dupe case-insensitively while keeping the nicer-cased first occurrence
    const seen = new Set();
    const out = [];
    for (const s of data.skills.map(String).map((s) => s.trim()).filter(Boolean)) {
      const key = s.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out.slice(0, 20);
  } catch (err) {
    logger.warn(`AI skill extraction failed: ${err.message}`);
    return [];
  }
};

const questionsPrompt = (skills, count) => `
Generate ${count} interview questions tailored to a candidate with these skills: ${skills.join(', ')}.
Mix difficulty levels. Each question must be answerable in an interview setting.

Return ONLY JSON: {
  "questions": [
    {
      "text": "<question>",
      "category": "<one skill/topic this maps to>",
      "difficulty": "<Easy|Medium|Hard>",
      "expectedAnswer": "<a concise model answer>",
      "keywords": ["<key term>", "..."]
    }
  ]
}`;

const generateQuestionsFromSkills = async (skills, count = 5) => {
  const m = getModel();
  if (!m || !skills || skills.length === 0) return [];
  try {
    const result = await withTimeout(
      m.generateContent(questionsPrompt(skills, count)),
      CALL_TIMEOUT
    );
    const data = parseJson(result.response.text());
    if (!Array.isArray(data.questions)) return [];
    return data.questions
      .filter((q) => q && q.text)
      .slice(0, count)
      .map((q) => ({
        text: String(q.text).trim(),
        category: String(q.category || 'General').slice(0, 40),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
        expectedAnswer: String(q.expectedAnswer || '').trim(),
        keywords: Array.isArray(q.keywords) ? q.keywords.map(String) : [],
      }));
  } catch (err) {
    logger.warn(`AI question generation failed: ${err.message}`);
    return [];
  }
};

module.exports = {
  isEnabled,
  scoreAnswer,
  keywordScore,
  generateFollowUp,
  extractSkills,
  generateQuestionsFromSkills,
};
