// mock the Gemini SDK so no real network calls happen
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
  })),
}));

const aiReply = (obj) => ({ response: { text: () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) } });

describe('aiService', () => {
  let aiService;

  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    aiService = require('../services/aiService');
  });

  afterAll(() => {
    delete process.env.GEMINI_API_KEY;
  });

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  describe('scoreAnswer (AI path)', () => {
    it('parses a valid AI response', async () => {
      mockGenerateContent.mockResolvedValue(aiReply({
        score: 8, verdict: 'Solid', feedback: 'Good answer',
        strengths: ['clear'], improvements: ['add detail'],
      }));
      const res = await aiService.scoreAnswer('What is a closure?', 'A closure captures scope', 'A closure is a function that remembers its outer scope variables.');
      expect(res.source).toBe('ai');
      expect(res.score).toBe(8);
      expect(res.strengths).toContain('clear');
    });

    it('clamps an out-of-range score', async () => {
      mockGenerateContent.mockResolvedValue(aiReply({ score: 15, verdict: 'x', feedback: 'y' }));
      const res = await aiService.scoreAnswer('q', 'expected', 'a reasonably long candidate answer here');
      expect(res.score).toBe(10);
    });

    it('handles JSON wrapped in markdown fences', async () => {
      mockGenerateContent.mockResolvedValue(aiReply('```json\n{"score":6,"verdict":"ok","feedback":"fine"}\n```'));
      const res = await aiService.scoreAnswer('q', 'expected', 'another candidate answer that is long enough');
      expect(res.source).toBe('ai');
      expect(res.score).toBe(6);
    });

    it('falls back to keyword scoring when the AI call throws', async () => {
      mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));
      const res = await aiService.scoreAnswer('q', 'expected answer text', 'candidate answer mentioning expected things', ['expected']);
      expect(res.source).toBe('keyword');
      expect(typeof res.score).toBe('number');
    });

    it('does not call the AI for an empty answer', async () => {
      const res = await aiService.scoreAnswer('q', 'expected', '');
      expect(res.source).toBe('keyword');
      expect(res.score).toBe(0);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  describe('keywordScore (fallback)', () => {
    it('scores an empty answer as zero', () => {
      const res = aiService.keywordScore('', 'expected', ['a', 'b']);
      expect(res.score).toBe(0);
      expect(res.source).toBe('keyword');
    });

    it('rewards answers that hit keywords', () => {
      const strong = aiService.keywordScore(
        'The event loop uses the call stack and callback queue to run asynchronous callbacks',
        'The event loop handles asynchronous operations',
        ['event loop', 'call stack', 'callback queue', 'asynchronous']
      );
      const weak = aiService.keywordScore('I am not sure about this one at all', 'The event loop handles asynchronous operations', ['event loop', 'call stack', 'callback queue', 'asynchronous']);
      expect(strong.score).toBeGreaterThan(weak.score);
    });
  });

  describe('generateFollowUp', () => {
    it('returns a follow-up question', async () => {
      mockGenerateContent.mockResolvedValue(aiReply({ followUp: 'Can you give a concrete example?' }));
      const q = await aiService.generateFollowUp('What is a closure?', 'It remembers outer variables.');
      expect(q).toMatch(/example/i);
    });

    it('returns null when the AI call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('down'));
      const q = await aiService.generateFollowUp('What is a closure?', 'It remembers outer variables.');
      expect(q).toBeNull();
    });
  });

  describe('extractSkills', () => {
    it('returns a de-duplicated skill list', async () => {
      mockGenerateContent.mockResolvedValue(aiReply({ skills: ['React', 'react', 'Node.js', 'MongoDB'] }));
      const skills = await aiService.extractSkills('a resume with plenty of text about react and node and mongo work experience');
      expect(skills).toContain('React');
      expect(skills.length).toBe(3);
    });
  });

  describe('generateQuestionsFromSkills', () => {
    it('normalizes generated questions', async () => {
      mockGenerateContent.mockResolvedValue(aiReply({
        questions: [
          { text: 'Explain hooks', category: 'React', difficulty: 'Medium', expectedAnswer: 'x', keywords: ['hooks'] },
          { text: 'What is a bad difficulty?', category: 'React', difficulty: 'Impossible', expectedAnswer: 'y', keywords: [] },
        ],
      }));
      const qs = await aiService.generateQuestionsFromSkills(['React'], 2);
      expect(qs.length).toBe(2);
      expect(qs[0].text).toBe('Explain hooks');
      expect(qs[1].difficulty).toBe('Medium'); // invalid difficulty defaulted
    });
  });
});
