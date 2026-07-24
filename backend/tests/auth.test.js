const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const validUser = { name: 'Test User', email: 'test@example.com', password: 'secret123' };

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects a short password with a validation error', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects a duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user with a valid token', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('rejects a request with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('password reset flow', () => {
    it('always responds success to forgot-password (no email enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('resets the password with a valid token and lets the user log in', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      // generate a reset token directly (dev transport would otherwise only log it)
      const user = await User.findOne({ email: validUser.email });
      const rawToken = user.createResetToken();
      await user.save();

      const reset = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'newpass123' });
      expect(reset.status).toBe(200);

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'newpass123' });
      expect(login.status).toBe(200);
    });

    it('rejects an invalid reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'not-a-real-token', password: 'newpass123' });
      expect(res.status).toBe(400);
    });
  });
});
