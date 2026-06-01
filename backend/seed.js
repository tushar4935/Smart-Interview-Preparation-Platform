const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Question = require('./models/Question');

const questions = [
  { text: 'What is closure in JavaScript? Explain with an example.', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: 'A closure is a function that has access to variables from its outer (enclosing) scope even after the outer function has returned. It captures the surrounding state.', keywords: ['closure', 'scope', 'outer function', 'lexical scope', 'inner function'], timeLimit: 120 },
  { text: 'Explain the difference between var, let, and const in JavaScript.', category: 'JavaScript', difficulty: 'Easy', expectedAnswer: 'var is function-scoped and hoisted. let is block-scoped and not initialized before declaration. const is block-scoped and cannot be reassigned.', keywords: ['var', 'let', 'const', 'scope', 'hoisting', 'block', 'function scope'], timeLimit: 90 },
  { text: 'What is the event loop in JavaScript and how does it work?', category: 'JavaScript', difficulty: 'Hard', expectedAnswer: 'The event loop is a mechanism that allows JavaScript to perform non-blocking operations. It monitors the call stack and callback queue, moving callbacks to the stack when it is empty.', keywords: ['event loop', 'call stack', 'callback queue', 'non-blocking', 'asynchronous', 'microtask'], timeLimit: 150 },
  { text: 'Explain Promises and async/await in JavaScript.', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: 'Promises represent eventual completion of async operations with .then() and .catch() chains. Async/await is syntactic sugar over promises making async code look synchronous.', keywords: ['promise', 'async', 'await', 'resolve', 'reject', 'then', 'catch', 'asynchronous'], timeLimit: 120 },
  { text: 'What is prototypal inheritance in JavaScript?', category: 'JavaScript', difficulty: 'Medium', expectedAnswer: 'JavaScript uses prototypal inheritance where objects inherit directly from other objects via the prototype chain. Every object has a __proto__ property pointing to its prototype.', keywords: ['prototype', 'inheritance', '__proto__', 'Object.create', 'prototype chain'], timeLimit: 120 },

  { text: 'What is the Virtual DOM in React and why is it used?', category: 'React', difficulty: 'Easy', expectedAnswer: 'Virtual DOM is a lightweight JavaScript representation of the real DOM. React uses it to efficiently update the UI by diffing the new virtual DOM with the previous one and applying minimal changes.', keywords: ['virtual DOM', 'diffing', 'reconciliation', 'real DOM', 'performance', 'rendering'], timeLimit: 90 },
  { text: 'Explain React Hooks. What problem do they solve?', category: 'React', difficulty: 'Medium', expectedAnswer: 'React Hooks (useState, useEffect, useContext etc.) let you use state and lifecycle features in functional components, eliminating the need for class components and making code more reusable.', keywords: ['hooks', 'useState', 'useEffect', 'functional component', 'state', 'lifecycle'], timeLimit: 120 },
  { text: 'What is the difference between controlled and uncontrolled components in React?', category: 'React', difficulty: 'Medium', expectedAnswer: 'Controlled components have their form data controlled by React state. Uncontrolled components store their form data in the DOM itself, accessed via refs.', keywords: ['controlled', 'uncontrolled', 'state', 'ref', 'form', 'input', 'DOM'], timeLimit: 90 },
  { text: 'Explain Context API and when you would use it over Redux.', category: 'React', difficulty: 'Hard', expectedAnswer: 'Context API provides a way to pass data through the component tree without prop drilling. Use it for simple global state. Redux is better for complex state with many actions, middleware, and dev tools.', keywords: ['context', 'provider', 'consumer', 'prop drilling', 'global state', 'redux'], timeLimit: 150 },
  { text: 'What is React.memo and useMemo? How do they differ?', category: 'React', difficulty: 'Hard', expectedAnswer: 'React.memo is a HOC that memoizes a component to prevent re-renders if props haven\'t changed. useMemo is a hook that memoizes a computed value. memo prevents renders, useMemo prevents recomputation.', keywords: ['memo', 'useMemo', 'memoization', 'performance', 'HOC', 're-render', 'optimization'], timeLimit: 120 },

  { text: 'What is Node.js and what makes it suitable for building APIs?', category: 'Node.js', difficulty: 'Easy', expectedAnswer: 'Node.js is a JavaScript runtime built on Chrome V8. It uses an event-driven, non-blocking I/O model making it lightweight and efficient, ideal for data-intensive real-time applications and REST APIs.', keywords: ['Node.js', 'V8', 'event-driven', 'non-blocking', 'I/O', 'runtime', 'asynchronous'], timeLimit: 90 },
  { text: 'Explain middleware in Express.js.', category: 'Node.js', difficulty: 'Medium', expectedAnswer: 'Middleware are functions that have access to request, response objects and the next function. They execute in order and can modify req/res, end the request cycle, or call next() to pass control.', keywords: ['middleware', 'Express', 'request', 'response', 'next', 'pipeline'], timeLimit: 90 },
  { text: 'What is the difference between REST and GraphQL APIs?', category: 'Node.js', difficulty: 'Medium', expectedAnswer: 'REST uses multiple endpoints with fixed data structures and HTTP methods. GraphQL uses a single endpoint where clients specify exact data needs, avoiding over-fetching and under-fetching.', keywords: ['REST', 'GraphQL', 'endpoint', 'over-fetching', 'query', 'mutation', 'schema'], timeLimit: 120 },

  { text: 'What is the difference between SQL and NoSQL databases?', category: 'MongoDB', difficulty: 'Easy', expectedAnswer: 'SQL databases are relational with structured schemas and use SQL. NoSQL databases are non-relational, schema-flexible, and scale horizontally. MongoDB stores documents in BSON format.', keywords: ['SQL', 'NoSQL', 'relational', 'schema', 'BSON', 'document', 'horizontal scaling'], timeLimit: 90 },
  { text: 'Explain MongoDB aggregation pipeline.', category: 'MongoDB', difficulty: 'Hard', expectedAnswer: 'The aggregation pipeline processes documents through stages like $match, $group, $sort, $project, $lookup. Each stage transforms documents and passes results to the next stage.', keywords: ['aggregation', 'pipeline', '$match', '$group', '$sort', '$project', '$lookup'], timeLimit: 150 },

  { text: 'Explain the concept of Big O notation and why it matters.', category: 'DSA', difficulty: 'Easy', expectedAnswer: 'Big O notation describes the worst-case time or space complexity of an algorithm as input size grows. It helps compare algorithms independently of hardware. O(1) is constant, O(n) is linear, O(n²) is quadratic.', keywords: ['Big O', 'time complexity', 'space complexity', 'O(n)', 'O(1)', 'algorithm', 'worst case'], timeLimit: 120 },
  { text: 'What is the difference between a stack and a queue? Give real-world examples.', category: 'DSA', difficulty: 'Easy', expectedAnswer: 'Stack is LIFO (Last In First Out) - like a stack of plates or browser back button. Queue is FIFO (First In First Out) - like a print queue or task scheduling.', keywords: ['stack', 'queue', 'LIFO', 'FIFO', 'push', 'pop', 'enqueue', 'dequeue'], timeLimit: 90 },
  { text: 'Explain the difference between BFS and DFS graph traversal.', category: 'DSA', difficulty: 'Medium', expectedAnswer: 'BFS explores nodes level by level using a queue, finding shortest paths. DFS explores as far as possible along branches using a stack/recursion, used for cycle detection and topological sorting.', keywords: ['BFS', 'DFS', 'breadth-first', 'depth-first', 'queue', 'stack', 'graph', 'traversal'], timeLimit: 120 },

  { text: 'Design a URL shortener system like bit.ly.', category: 'System Design', difficulty: 'Hard', expectedAnswer: 'Components: API gateway, URL mapping service, database (Redis cache + SQL/NoSQL), load balancer. Use base62 encoding for short codes, cache popular URLs, handle redirects at CDN level for scale.', keywords: ['URL shortener', 'base62', 'cache', 'Redis', 'load balancer', 'hash', 'database', 'CDN'], timeLimit: 300 },
  { text: 'How would you design a real-time chat application?', category: 'System Design', difficulty: 'Hard', expectedAnswer: 'Use WebSockets for real-time bidirectional communication. Components: connection manager, message broker (Kafka/Redis pub-sub), message storage (Cassandra), presence service, notification system.', keywords: ['WebSocket', 'real-time', 'message broker', 'pub-sub', 'Kafka', 'Redis', 'horizontal scaling'], timeLimit: 300 },

  { text: 'Tell me about yourself and your background in software development.', category: 'Behavioral', difficulty: 'Easy', expectedAnswer: 'Use the "Present-Past-Future" formula. Discuss current role, relevant past experience, and career goals aligned with the position. Keep it professional and under 2 minutes.', keywords: ['experience', 'background', 'skills', 'career', 'professional', 'goals', 'role'], timeLimit: 120 },
  { text: 'Describe a challenging technical problem you solved and how you approached it.', category: 'Behavioral', difficulty: 'Medium', expectedAnswer: 'Use STAR method: Situation (context), Task (your responsibility), Action (specific steps taken), Result (measurable outcome). Show problem-solving skills, collaboration, and impact.', keywords: ['STAR', 'problem solving', 'situation', 'task', 'action', 'result', 'challenge', 'technical'], timeLimit: 150 },
  { text: 'How do you handle disagreements with team members on technical decisions?', category: 'Behavioral', difficulty: 'Medium', expectedAnswer: 'Discuss data-driven decision making, active listening, understanding the other perspective, presenting trade-offs objectively, seeking consensus, and escalating when necessary while maintaining respect.', keywords: ['disagreement', 'conflict', 'collaboration', 'communication', 'consensus', 'team', 'technical decision'], timeLimit: 120 },

  { text: 'Where do you see yourself in 5 years?', category: 'HR', difficulty: 'Easy', expectedAnswer: 'Align your answer with the company\'s growth. Show ambition balanced with realistic goals. Mention skill development, leadership aspirations if appropriate, and contributing to the organization\'s success.', keywords: ['career growth', 'goals', 'leadership', '5 years', 'skills', 'development', 'contribution'], timeLimit: 90 },
  { text: 'Why do you want to work at this company?', category: 'HR', difficulty: 'Easy', expectedAnswer: 'Research the company first. Mention specific aspects: culture, technology stack, products, mission, growth opportunities. Show genuine interest beyond salary. Align your values with theirs.', keywords: ['company culture', 'mission', 'values', 'growth', 'technology', 'opportunity', 'research'], timeLimit: 90 },
];

const seedDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Question.deleteMany({});
  console.log('Cleared questions');

  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} questions`);

  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' });
    console.log('Created admin user: admin@example.com / admin123');
  }

  const demoExists = await User.findOne({ email: 'demo@example.com' });
  if (!demoExists) {
    await User.create({ name: 'Demo User', email: 'demo@example.com', password: 'demo123', role: 'user' });
    console.log('Created demo user: demo@example.com / demo123');
  }

  console.log('\n✅ Database seeded successfully!');
  process.exit(0);
};

seedDB().catch(err => { console.error(err); process.exit(1); });
