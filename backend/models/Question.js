const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'DSA', 'System Design', 'Behavioral', 'HR', 'CSS', 'SQL', 'MongoDB'],
  },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  expectedAnswer: { type: String, default: '' },
  keywords: [{ type: String }],
  timeLimit: { type: Number, default: 120 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
