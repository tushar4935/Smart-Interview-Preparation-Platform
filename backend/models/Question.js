const mongoose = require('mongoose');

// canonical category list - keep this in sync with the frontend filter dropdown
const CATEGORIES = [
  'Data Structures', 'Algorithms', 'System Design', 'DBMS/SQL', 'Operating Systems',
  'Computer Networks', 'OOP', 'JavaScript', 'React', 'Node.js', 'HTML/CSS', 'Python',
  'Java', 'Git', 'DevOps', 'Security', 'Testing', 'Behavioral', 'HR', 'Aptitude',
];

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: CATEGORIES },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  type: { type: String, enum: ['text', 'code'], default: 'text' },
  expectedAnswer: { type: String, default: '' },
  keywords: [{ type: String }],
  tags: [{ type: String }],
  timeLimit: { type: Number, default: 120 },
  // resume-generated questions are stashed here but kept out of the normal pool
  source: { type: String, enum: ['seed', 'admin', 'resume'], default: 'seed' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
module.exports.CATEGORIES = CATEGORIES;
