const swaggerJsdoc = require('swagger-jsdoc');

const bearerAuth = [{ bearerAuth: [] }];

const ok = (description) => ({
  description,
  content: { 'application/json': { schema: { type: 'object' } } },
});

const jsonBody = (props, required = []) => ({
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object', required, properties: props },
    },
  },
});

// hand-written spec - swagger-jsdoc still builds/validates it and it's easy to
// extend with @openapi JSDoc blocks on routes later if we want
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Smart Interview Prep API',
    version: '1.0.0',
    description: 'REST API for the Smart Interview Preparation Platform. AI scoring is powered by Gemini with a keyword-based fallback.',
  },
  servers: [
    { url: '/api', description: 'Current host' },
    { url: 'http://localhost:5000/api', description: 'Local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  tags: [
    { name: 'Auth' }, { name: 'Interviews' }, { name: 'Questions' },
    { name: 'Resumes' }, { name: 'Dashboard' }, { name: 'Admin' },
  ],
  paths: {
    '/health': {
      get: { tags: ['Dashboard'], summary: 'Health check', responses: { 200: ok('Server is up') } },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new account',
        requestBody: jsonBody({
          name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 6 },
        }, ['name', 'email', 'password']),
        responses: { 201: ok('Created, returns JWT'), 400: ok('Validation error') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Log in',
        requestBody: jsonBody({ email: { type: 'string' }, password: { type: 'string' } }, ['email', 'password']),
        responses: { 200: ok('Returns JWT + user'), 401: ok('Bad credentials') },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'], summary: 'Verify email with token',
        requestBody: jsonBody({ token: { type: 'string' } }, ['token']),
        responses: { 200: ok('Verified'), 400: ok('Invalid/expired token') },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Request a password reset link',
        requestBody: jsonBody({ email: { type: 'string' } }, ['email']),
        responses: { 200: ok('Reset link sent if email exists') },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Reset password with token',
        requestBody: jsonBody({ token: { type: 'string' }, password: { type: 'string' } }, ['token', 'password']),
        responses: { 200: ok('Password updated'), 400: ok('Invalid/expired token') },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user', security: bearerAuth, responses: { 200: ok('User') } },
    },
    '/interviews': {
      get: {
        tags: ['Interviews'], summary: 'List completed interviews (paginated)', security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: ok('Interview list') },
      },
    },
    '/interviews/start': {
      post: {
        tags: ['Interviews'], summary: 'Start a standard interview', security: bearerAuth,
        requestBody: jsonBody({
          category: { type: 'string' }, difficulty: { type: 'string' },
          questionCount: { type: 'integer' }, type: { type: 'string', enum: ['text', 'code'] },
        }),
        responses: { 201: ok('Interview + questions'), 404: ok('No questions match') },
      },
    },
    '/interviews/from-resume': {
      post: {
        tags: ['Interviews'], summary: 'Generate an interview from a resume (AI)', security: bearerAuth,
        requestBody: jsonBody({ resumeId: { type: 'string' }, questionCount: { type: 'integer' } }),
        responses: { 201: ok('Interview + detected skills'), 422: ok('Unreadable resume'), 503: ok('AI disabled') },
      },
    },
    '/interviews/{id}/answer': {
      put: {
        tags: ['Interviews'], summary: 'Submit + score an answer (AI with fallback)', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({
          questionIndex: { type: 'integer' }, userAnswer: { type: 'string' },
          timeTaken: { type: 'integer' }, language: { type: 'string' }, followUp: { type: 'boolean' },
        }, ['questionIndex']),
        responses: { 200: ok('Score, verdict, feedback, strengths, improvements') },
      },
    },
    '/interviews/{id}/complete': {
      put: {
        tags: ['Interviews'], summary: 'Complete an interview', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok('Final interview with totals') },
      },
    },
    '/interviews/{id}': {
      get: {
        tags: ['Interviews'], summary: 'Get one interview', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok('Interview'), 404: ok('Not found') },
      },
      delete: {
        tags: ['Interviews'], summary: 'Delete an interview', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok('Deleted') },
      },
    },
    '/questions': {
      get: {
        tags: ['Questions'], summary: 'List questions (filterable)', security: bearerAuth,
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'difficulty', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: ok('Questions') },
      },
    },
    '/questions/categories': {
      get: { tags: ['Questions'], summary: 'Category list + counts', security: bearerAuth, responses: { 200: ok('Categories') } },
    },
    '/resumes': {
      get: { tags: ['Resumes'], summary: 'List my resumes', security: bearerAuth, responses: { 200: ok('Resumes') } },
    },
    '/resumes/upload': {
      post: { tags: ['Resumes'], summary: 'Upload a resume (multipart)', security: bearerAuth, responses: { 201: ok('Resume') } },
    },
    '/resumes/{id}/analyze': {
      get: {
        tags: ['Resumes'], summary: 'Extract skills from a resume (AI)', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok('Detected skills'), 422: ok('Unreadable resume') },
      },
    },
    '/dashboard': {
      get: { tags: ['Dashboard'], summary: 'Summary stats + chart data', security: bearerAuth, responses: { 200: ok('Stats') } },
    },
    '/dashboard/analytics': {
      get: { tags: ['Dashboard'], summary: 'Category breakdown + weak areas', security: bearerAuth, responses: { 200: ok('Analytics') } },
    },
  },
};

const swaggerSpec = swaggerJsdoc({ definition, apis: [] });

module.exports = swaggerSpec;
