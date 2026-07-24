import { jsPDF } from 'jspdf';

// client-side PDF so we don't need a server round-trip or a headless browser
export const downloadInterviewReport = (interview, userName = 'Candidate') => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const line = (text, size = 11, style = 'normal', color = [30, 30, 30]) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text, maxW);
    ensureSpace(wrapped.length * (size * 0.5));
    doc.text(wrapped, margin, y);
    y += wrapped.length * (size * 0.5) + 2;
  };

  // header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Interview Report', margin, 18);
  y = 38;

  line(interview.title || 'Interview', 14, 'bold');
  line(`Candidate: ${userName}`, 10, 'normal', [90, 90, 90]);
  line(`Category: ${interview.category}  |  Difficulty: ${interview.difficulty}`, 10, 'normal', [90, 90, 90]);
  if (interview.completedAt) {
    line(`Completed: ${new Date(interview.completedAt).toLocaleString()}`, 10, 'normal', [90, 90, 90]);
  }
  y += 2;

  // score summary box
  ensureSpace(24);
  doc.setDrawColor(37, 99, 235);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, maxW, 20, 3, 3, 'FD');
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${interview.percentage}%`, margin + 6, y + 14);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Score: ${interview.totalScore} / ${interview.maxScore}`, margin + 45, y + 9);
  doc.text(`Answered: ${interview.answeredQuestions} / ${interview.totalQuestions}`, margin + 45, y + 15);
  y += 28;

  line('Question Breakdown', 13, 'bold');
  y += 1;

  (interview.answers || []).forEach((a, i) => {
    ensureSpace(20);
    line(`Q${i + 1}. ${a.questionText}`, 11, 'bold');
    line(`Score: ${a.score}/10${a.verdict ? `  -  ${a.verdict}` : ''}`, 10, 'normal', [37, 99, 235]);
    if (a.userAnswer) line(`Your answer: ${a.userAnswer}`, 9, 'italic', [90, 90, 90]);
    if (a.feedback) line(`Feedback: ${a.feedback}`, 9, 'normal', [50, 50, 50]);
    if (a.improvements && a.improvements.length) {
      line(`To improve: ${a.improvements.join('; ')}`, 9, 'normal', [180, 80, 0]);
    }
    y += 3;
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`interview-report-${stamp}.pdf`);
};
