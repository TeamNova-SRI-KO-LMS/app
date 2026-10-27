const Progress = require('../models/Progress');

/**
 * Whether a user may see the full content of a course (all lecture materials and the
 * assignment details): administrators, the course's instructor and enrolled students.
 * Everyone else, including visitors without a token, only gets the preview content.
 * Enrolment is recorded in Course.enrolledStudents and as a Progress document, so either
 * one is accepted.
 */
const canAccessCourseContent = async (user, course) => {
  if (!user || !course) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const userId = String(user._id);
  if (course.instructor && String(course.instructor) === userId) {
    return true;
  }

  if ((course.enrolledStudents || []).some((studentId) => String(studentId) === userId)) {
    return true;
  }

  return Boolean(await Progress.exists({ student: user._id, course: course._id }));
};

module.exports = { canAccessCourseContent };
