const b1 = require('./questions');
const b2 = require('./questionsMore');

// derive a sensible time limit instead of repeating it on every question
const timeFor = (item) => {
  if (item.type === 'code') return 300;
  if (item.difficulty === 'Easy') return 90;
  if (item.difficulty === 'Hard') return 180;
  return 120;
};

const attach = (category, arr) => arr.map((item) => ({ ...item, category, timeLimit: timeFor(item) }));

const questionBank = [
  ...attach('Data Structures', b1.dataStructures),
  ...attach('Algorithms', b1.algorithms),
  ...attach('System Design', b1.systemDesign),
  ...attach('DBMS/SQL', b1.dbms),
  ...attach('Operating Systems', b1.operatingSystems),
  ...attach('Computer Networks', b1.networks),
  ...attach('OOP', b1.oop),
  ...attach('JavaScript', b1.javascript),
  ...attach('React', b1.react),
  ...attach('Node.js', b1.node),
  ...attach('HTML/CSS', b2.htmlcss),
  ...attach('Python', b2.python),
  ...attach('Java', b2.java),
  ...attach('Git', b2.git),
  ...attach('DevOps', b2.devops),
  ...attach('Security', b2.security),
  ...attach('Testing', b2.testing),
  ...attach('Behavioral', b2.behavioral),
  ...attach('HR', b2.hr),
  ...attach('Aptitude', b2.aptitude),
];

module.exports = questionBank;
