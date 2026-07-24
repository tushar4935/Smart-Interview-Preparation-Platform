// no Gemini key in tests -> scoring goes through the deterministic keyword path
delete process.env.GEMINI_API_KEY;

const request = require('supertest');
const app = require('../app');
const Question = require('../models/Question');

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const registerUser = async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Flow User', email: 'flow@example.com', password: 'secret123' });
  return res.body.token;
};

const seedQuestions = () =>
  Question.insertMany([
    { text: 'What is a closure?', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: 'A closure captures variables from its outer scope', keywords: ['closure', 'scope', 'outer'], type: 'text', source: 'seed' },
    { text: 'Explain hoisting', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: 'Declarations move to the top of scope', keywords: ['hoisting', 'declaration', 'scope'], type: 'text', source: 'seed' },
    { text: 'What is the event loop?', category: 'JavaScript', difficulty: 'Hard', expectedAnswer: 'It schedules async callbacks', keywords: ['event loop', 'callback', 'async'], type: 'text', source: 'seed' },
    { text: 'let vs const', category: 'JavaScript', difficulty: 'Easy', expectedAnswer: 'const cannot be reassigned', keywords: ['let', 'const', 'block'], type: 'text', source: 'seed' },
  ]);

describe('Interview flow', () => {
  let token;

  beforeEach(async () => {
    token = await registerUser();
    await seedQuestions();
  });

  it('runs a full interview: start -> answer -> complete -> list', async () => {
    const start = await request(app)
      .post('/api/interviews/start')
      .set(authHeader(token))
      .send({ category: 'JavaScript', questionCount: 3 });
    expect(start.status).toBe(201);
    expect(start.body.interview.questions.length).toBe(3);
    // the answer key must never be sent to the client
    expect(start.body.interview.questions[0].expectedAnswer).toBeUndefined();

    const id = start.body.interview._id;

    const submit = await request(app)
      .put(`/api/interviews/${id}/answer`)
      .set(authHeader(token))
      .send({ questionIndex: 0, userAnswer: 'A closure is a function that remembers variables from its outer scope', timeTaken: 30 });
    expect(submit.status).toBe(200);
    expect(submit.body.source).toBe('keyword');
    expect(submit.body.score).toBeGreaterThan(0);

    const complete = await request(app)
      .put(`/api/interviews/${id}/complete`)
      .set(authHeader(token))
      .send({ duration: 120 });
    expect(complete.status).toBe(200);
    expect(complete.body.interview.status).toBe('completed');
    expect(complete.body.interview.percentage).toBeGreaterThanOrEqual(0);

    const list = await request(app).get('/api/interviews').set(authHeader(token));
    expect(list.status).toBe(200);
    expect(list.body.interviews.length).toBe(1);
  });

  it('returns 404 when no questions match the filters', async () => {
    const res = await request(app)
      .post('/api/interviews/start')
      .set(authHeader(token))
      .send({ category: 'Aptitude', questionCount: 3 });
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/interviews/start').send({ category: 'JavaScript' });
    expect(res.status).toBe(401);
  });

  it('validates a missing questionIndex on answer submit', async () => {
    const start = await request(app)
      .post('/api/interviews/start')
      .set(authHeader(token))
      .send({ category: 'JavaScript', questionCount: 2 });
    const res = await request(app)
      .put(`/api/interviews/${start.body.interview._id}/answer`)
      .set(authHeader(token))
      .send({ userAnswer: 'no index provided' });
    expect(res.status).toBe(400);
  });

  it('updates dashboard stats after completing an interview', async () => {
    const start = await request(app)
      .post('/api/interviews/start')
      .set(authHeader(token))
      .send({ category: 'JavaScript', questionCount: 2 });
    const id = start.body.interview._id;
    await request(app).put(`/api/interviews/${id}/answer`).set(authHeader(token))
      .send({ questionIndex: 0, userAnswer: 'const cannot be reassigned and is block scoped', timeTaken: 20 });
    await request(app).put(`/api/interviews/${id}/complete`).set(authHeader(token)).send({ duration: 60 });

    const dash = await request(app).get('/api/dashboard').set(authHeader(token));
    expect(dash.status).toBe(200);
    expect(dash.body.stats.totalInterviews).toBe(1);
  });
});
