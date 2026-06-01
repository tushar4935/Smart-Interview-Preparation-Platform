const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');

const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  try {
    const resume = await Resume.create({
      user: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, resumes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (fs.existsSync(resume.filePath)) fs.unlinkSync(resume.filePath);
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setDefaultResume = async (req, res) => {
  try {
    await Resume.updateMany({ user: req.user._id }, { isDefault: false });
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadResume, getResumes, deleteResume, setDefaultResume };
