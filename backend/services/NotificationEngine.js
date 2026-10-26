const Notification = require('../models/Notification');
const User = require('../models/User');
const socketManager = require('../socket/socketManager');

/**
 * NotificationEngine
 * Central event-driven engine for dispatching in-app notifications.
 * Delivery is strictly handled through MongoDB persistence and Socket.IO real-time emission.
 * (No external email/SMS providers used).
 */
class NotificationEngine {
  /**
   * Core dispatch method
   * Saves notification in MongoDB and broadcasts/emits 'notification:new' to targeted socket rooms.
   *
   * @param {Object} notificationData - Attributes for notification
   * @param {string|null} createdById - User ID creating notification (or null if system)
   * @returns {Promise<Object>} The saved notification document
   */
  static async dispatch(notificationData, createdById = null) {
    try {
      const {
        title,
        message,
        type = 'system',
        priority = 'medium',
        targetAudience = 'all',
        targetUsers = [],
        targetRoles = [],
        targetCourses = [],
        isActive = true,
        isPinned = false,
        scheduledFor = new Date(),
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        actionUrl,
        actionText,
        tags = [],
        koreanTitle,
        koreanMessage,
        parentNotification,
      } = notificationData;

      // Ensure delivery methods are strictly inApp
      const deliveryMethods = {
        inApp: true,
        email: false,
        sms: false
      };

      // 1. Persist notification to MongoDB
      const notification = new Notification({
        title,
        message,
        type,
        priority,
        targetAudience,
        targetUsers: targetUsers || [],
        targetRoles: targetRoles || [],
        targetCourses: targetCourses || [],
        isActive,
        isPinned,
        scheduledFor,
        expiresAt,
        createdBy: createdById,
        actionUrl,
        actionText,
        tags,
        koreanTitle,
        koreanMessage,
        parentNotification,
        deliveryMethods,
        readBy: [],
        deliveryStats: {
          totalSent: 0,
          totalRead: 0,
          totalClicked: 0
        }
      });

      await notification.save();

      // Populate creator if available
      if (createdById) {
        await notification.populate('createdBy', 'name email role');
      }

      // 2. Resolve audience count for delivery metrics
      const resolvedUsers = await this.resolveTargetUsers(notification);
      notification.deliveryStats.totalSent = resolvedUsers.length;
      await notification.save();

      // 3. Construct lightweight client payload
      const payload = {
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        targetAudience: notification.targetAudience,
        targetUsers: notification.targetUsers,
        targetRoles: notification.targetRoles,
        targetCourses: notification.targetCourses,
        koreanTitle: notification.koreanTitle,
        koreanMessage: notification.koreanMessage,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        isPinned: notification.isPinned,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
        createdBy: notification.createdBy,
        isRead: false
      };

      // 4. Emit to targeted Socket.IO rooms
      switch (targetAudience) {
        case 'all':
          socketManager.broadcast('notification:new', payload);
          break;

        case 'students':
          socketManager.sendToRole('student', 'notification:new', payload);
          break;

        case 'instructors':
          socketManager.sendToRole('instructor', 'notification:new', payload);
          break;

        case 'admins':
          socketManager.sendToRole('admin', 'notification:new', payload);
          break;

        case 'specific_users':
          if (Array.isArray(notification.targetUsers)) {
            for (const userId of notification.targetUsers) {
              const uId = userId?._id ? userId._id.toString() : userId.toString();
              socketManager.sendToUser(uId, 'notification:new', payload);
            }
          }
          break;

        case 'specific_courses':
          if (Array.isArray(notification.targetCourses)) {
            for (const courseId of notification.targetCourses) {
              const cId = courseId?._id ? courseId._id.toString() : courseId.toString();
              socketManager.sendToCourse(cId, 'notification:new', payload);
            }
          }
          break;

        default:
          // Check if specific targetRoles were provided
          if (Array.isArray(targetRoles) && targetRoles.length > 0) {
            for (const role of targetRoles) {
              socketManager.sendToRole(role, 'notification:new', payload);
            }
          } else {
            socketManager.broadcast('notification:new', payload);
          }
      }

      console.log(`📨 Notification dispatched: "${notification.title}" -> ${targetAudience} (${resolvedUsers.length} targets)`);
      return notification;
    } catch (error) {
      console.error('NotificationEngine dispatch error:', error);
      throw error;
    }
  }

  /**
   * Determine target user IDs based on audience selection
   * @param {Object} notification
   * @returns {Promise<Array<string>>}
   */
  static async resolveTargetUsers(notification) {
    try {
      let query = { isActive: true };

      switch (notification.targetAudience) {
        case 'all':
          query = { isActive: true };
          break;
        case 'students':
          query = { role: 'student', isActive: true };
          break;
        case 'instructors':
          query = { role: 'instructor', isActive: true };
          break;
        case 'admins':
          query = { role: 'admin', isActive: true };
          break;
        case 'specific_users':
          return (notification.targetUsers || []).map(id => id.toString());
        case 'specific_courses':
          // Optional course enrollment lookup if needed
          return [];
        default:
          if (notification.targetRoles && notification.targetRoles.length > 0) {
            query = { role: { $in: notification.targetRoles }, isActive: true };
          }
      }

      const users = await User.find(query).select('_id');
      return users.map(u => u._id.toString());
    } catch (err) {
      console.warn('Error resolving target users:', err.message);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Automated System Event Hooks
  // ─────────────────────────────────────────────────────────────

  /**
   * Triggered when a student successfully enrolls in a course
   */
  static async onCourseEnrolled(userId, courseName) {
    return this.dispatch({
      title: `Enrolled in ${courseName}`,
      message: `You have successfully enrolled in "${courseName}". Access your lessons and start learning today!`,
      koreanTitle: `${courseName} 등록 완료`,
      koreanMessage: `"${courseName}" 강좌 등록이 완료되었습니다. 지금 강의를 시작하세요!`,
      type: 'course_update',
      priority: 'medium',
      targetAudience: 'specific_users',
      targetUsers: [userId],
      actionUrl: '/my-courses',
      actionText: 'Go to My Courses',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Triggered when a course payment is processed successfully
   */
  static async onPaymentReceived(userId, amount, courseName) {
    return this.dispatch({
      title: 'Payment Confirmed',
      message: `Your payment of LKR ${amount} for "${courseName}" has been successfully processed.`,
      koreanTitle: '결제 완료',
      koreanMessage: `"${courseName}"에 대한 LKR ${amount} 결제가 성공적으로 처리되었습니다.`,
      type: 'payment_due',
      priority: 'medium',
      targetAudience: 'specific_users',
      targetUsers: [userId],
      actionUrl: '/payment-info',
      actionText: 'View Payment Details',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Triggered when a fee or subscription renewal is upcoming/overdue
   */
  static async onPaymentDue(userId, amount, dueDate) {
    const formattedDate = new Date(dueDate).toLocaleDateString();
    return this.dispatch({
      title: '⚠️ Payment Reminder',
      message: `You have a payment of LKR ${amount} due on ${formattedDate}. Please complete it to maintain continuous access.`,
      koreanTitle: '⚠️ 결제 알림',
      koreanMessage: `${formattedDate}까지 LKR ${amount} 결제가 예정되어 있습니다. 원활한 수강을 위해 기한 내 납부 바랍니다.`,
      type: 'payment_due',
      priority: 'high',
      targetAudience: 'specific_users',
      targetUsers: [userId],
      actionUrl: '/payment-info',
      actionText: 'Pay Now',
      expiresAt: new Date(dueDate)
    });
  }

  /**
   * Triggered when a course completion certificate is generated
   */
  static async onCertificateReady(userId, courseName) {
    return this.dispatch({
      title: '🎓 Certificate Ready!',
      message: `Congratulations! Your certificate for "${courseName}" is now available.`,
      koreanTitle: '🎓 수료증 발급 완료!',
      koreanMessage: `축하합니다! "${courseName}" 수료증이 발급되었습니다.`,
      type: 'other',
      priority: 'medium',
      targetAudience: 'specific_users',
      targetUsers: [userId],
      actionUrl: '/dashboard',
      actionText: 'View Certificate',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Triggered when an announcement is published
   */
  static async onAnnouncementCreated(announcement, createdById) {
    const rawAudience = (announcement.targetAudience || announcement.audience || 'all').toLowerCase();
    let targetAudience = 'all';
    if (rawAudience.includes('student') || rawAudience.includes('scholar') || rawAudience.includes('intermediate')) {
      targetAudience = 'students';
    } else if (rawAudience.includes('instructor') || rawAudience.includes('staff') || rawAudience.includes('teacher')) {
      targetAudience = 'instructors';
    } else if (rawAudience.includes('admin')) {
      targetAudience = 'admins';
    }

    return this.dispatch({
      title: `📢 ${announcement.title}`,
      message: announcement.content ? (announcement.content.substring(0, 200) + '...') : announcement.title,
      type: 'system',
      priority: announcement.priority || 'medium',
      targetAudience,
      actionUrl: '/announcements',
      actionText: 'View Announcement',
      expiresAt: announcement.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }, createdById);
  }

  /**
   * Triggered when a reply is posted in a forum thread
   */
  static async onForumReply(postAuthorId, replierName, forumTitle) {
    return this.dispatch({
      title: `💬 New reply from ${replierName}`,
      message: `${replierName} replied to your question in "${forumTitle}"`,
      koreanTitle: `💬 ${replierName}님의 새 답변`,
      koreanMessage: `${replierName}님이 "${forumTitle}" 게시글에 답변을 남겼습니다`,
      type: 'message',
      priority: 'low',
      targetAudience: 'specific_users',
      targetUsers: [postAuthorId],
      actionUrl: '/my-courses',
      actionText: 'View Forum',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * System maintenance or emergency alert broadcast
   */
  static async onSystemMaintenance(message, maintenanceDate, createdById = null) {
    return this.dispatch({
      title: '🔧 Scheduled System Maintenance',
      message: message,
      koreanTitle: '🔧 시스템 정기 점검 안내',
      koreanMessage: message,
      type: 'system',
      priority: 'urgent',
      targetAudience: 'all',
      isPinned: true,
      expiresAt: new Date(maintenanceDate)
    }, createdById);
  }

  /**
   * Triggered when a student submits an assignment
   * Notifies administrators so they can review and grade the submission
   */
  static async onAssignmentSubmitted({ submission, assignment, student, course }) {
    try {
      const Course = require('../models/Course');
      const Assignment = require('../models/Assignment');

      // Resolve student name
      let studentName = student?.name || 'A student';
      if (!student?.name && student?._id) {
        const u = await User.findById(student._id).select('name');
        if (u) studentName = u.name;
      }

      // Resolve assignment title
      let assignmentTitle = assignment?.title;
      if (!assignmentTitle && submission?.assignment) {
        const a = await Assignment.findById(submission.assignment).select('title');
        if (a) assignmentTitle = a.title;
      }
      assignmentTitle = assignmentTitle || 'Assignment';

      // Resolve course title and id
      let courseTitle = course?.title;
      let courseId = course?._id || course;
      if (!courseTitle && (courseId || submission?.course)) {
        const c = await Course.findById(courseId || submission.course).select('title');
        if (c) {
          courseTitle = c.title;
          courseId = c._id;
        }
      }
      courseTitle = courseTitle || 'Course';

      return this.dispatch({
        title: `📥 New Assignment Submission: ${studentName}`,
        message: `${studentName} submitted an assignment for "${courseTitle}": ${assignmentTitle}.`,
        koreanTitle: `📥 새 과제 제출: ${studentName}`,
        koreanMessage: `${studentName}님이 "${courseTitle}" 강좌의 "${assignmentTitle}" 과제를 제출했습니다.`,
        type: 'assignment',
        priority: 'medium',
        targetAudience: 'admins',
        targetRoles: ['admin'],
        targetCourses: courseId ? [courseId] : [],
        actionUrl: '/admin/courses',
        actionText: 'Review Submissions',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, student?._id || student || null);
    } catch (err) {
      console.error('[NotificationEngine] onAssignmentSubmitted error:', err);
    }
  }

  /**
   * Triggered when an admin creates/publishes a new assignment
   * Notifies enrolled students of the course
   */
  static async onAssignmentPublished({ assignment, course, createdById = null }) {
    try {
      const Course = require('../models/Course');
      const Progress = require('../models/Progress');

      const courseId = course?._id || course || assignment.course;
      let courseTitle = course?.title;
      let enrolledFromCourse = [];

      if (!courseTitle || !course?.enrolledStudents) {
        const c = await Course.findById(courseId).select('title enrolledStudents');
        if (c) {
          courseTitle = courseTitle || c.title;
          enrolledFromCourse = (c.enrolledStudents || []).map(s => (s?._id || s).toString());
        }
      } else if (Array.isArray(course.enrolledStudents)) {
        enrolledFromCourse = course.enrolledStudents.map(s => (s?._id || s).toString());
      }
      courseTitle = courseTitle || 'Course';

      // Find all students enrolled in this course (via User.enrolledCourses, Course.enrolledStudents, or Progress)
      const [enrolledUsers, progressStudents] = await Promise.all([
        User.find({
          $or: [
            { _id: { $in: enrolledFromCourse } },
            { enrolledCourses: courseId }
          ],
          role: 'student',
          isActive: true
        }).select('_id'),
        Progress.find({ course: courseId }).distinct('student')
      ]);

      const studentIdSet = new Set([
        ...enrolledFromCourse,
        ...enrolledUsers.map(u => u._id.toString()),
        ...progressStudents.map(id => id.toString())
      ]);

      const targetUsers = Array.from(studentIdSet);

      const dueDateStr = assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

      const dueNoticeEn = dueDateStr ? ` (Due: ${dueDateStr})` : '';
      const dueNoticeKo = dueDateStr ? ` (마감일: ${dueDateStr})` : '';

      return this.dispatch({
        title: `📝 New Assignment: ${assignment.title}`,
        message: `A new assignment "${assignment.title}" has been published in "${courseTitle}"${dueNoticeEn}. Please check your curriculum and submit your files.`,
        koreanTitle: `📝 새 과제 등록: ${assignment.title}`,
        koreanMessage: `"${courseTitle}" 강좌에 새로운 과제 "${assignment.title}"이(가) 등록되었습니다${dueNoticeKo}. 커리큘럼에서 확인하고 기한 내에 제출하세요.`,
        type: 'assignment',
        priority: 'high',
        targetAudience: targetUsers.length > 0 ? 'specific_users' : 'students',
        targetUsers: targetUsers.length > 0 ? targetUsers : [],
        targetRoles: ['student'],
        targetCourses: courseId ? [courseId] : [],
        actionUrl: `/courses/${courseId}/learn`,
        actionText: 'View Assignment',
        expiresAt: assignment.dueDate
          ? new Date(new Date(assignment.dueDate).getTime() + 14 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, createdById);
    } catch (err) {
      console.error('[NotificationEngine] onAssignmentPublished error:', err);
    }
  }

  /**
   * Triggered when an admin grades an assignment submission
   * Notifies the student with their grade and feedback
   */
  static async onAssignmentGraded({ submission, assignment, course, studentId, grade, feedback, gradedById = null }) {
    try {
      const Course = require('../models/Course');
      const Assignment = require('../models/Assignment');

      // Resolve student ID
      const targetUserId = studentId || submission?.student?._id || submission?.student;
      if (!targetUserId) {
        console.warn('[NotificationEngine] onAssignmentGraded: student ID missing');
        return;
      }

      // Resolve assignment title & maxScore
      let assignmentTitle = assignment?.title;
      let maxScore = assignment?.maxScore || 100;
      if (!assignmentTitle && submission?.assignment) {
        const a = await Assignment.findById(submission.assignment).select('title maxScore');
        if (a) {
          assignmentTitle = a.title;
          maxScore = a.maxScore || 100;
        }
      }
      assignmentTitle = assignmentTitle || 'Assignment';

      // Resolve course title and id
      let courseTitle = course?.title;
      let courseId = course?._id || course || submission?.course;
      if (!courseTitle && courseId) {
        const c = await Course.findById(courseId).select('title');
        if (c) {
          courseTitle = c.title;
          courseId = c._id;
        }
      }
      courseTitle = courseTitle || 'Course';

      const finalGrade = grade !== undefined ? grade : submission?.grade;
      const finalFeedback = feedback !== undefined ? feedback : submission?.feedback;
      const feedbackEn = finalFeedback ? ` Feedback: "${finalFeedback}".` : '';
      const feedbackKo = finalFeedback ? ` 피드백: "${finalFeedback}".` : '';

      return this.dispatch({
        title: `📊 Assignment Result: ${assignmentTitle}`,
        message: `Your assignment "${assignmentTitle}" in "${courseTitle}" has been graded: ${finalGrade}/${maxScore} points.${feedbackEn}`,
        koreanTitle: `📊 과제 채점 결과: ${assignmentTitle}`,
        koreanMessage: `"${courseTitle}" 강좌의 "${assignmentTitle}" 과제가 채점되었습니다: ${finalGrade}/${maxScore}점.${feedbackKo}`,
        type: 'assignment',
        priority: 'high',
        targetAudience: 'specific_users',
        targetUsers: [targetUserId],
        targetCourses: courseId ? [courseId] : [],
        actionUrl: `/courses/${courseId}/learn`,
        actionText: 'View Result',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }, gradedById);
    } catch (err) {
      console.error('[NotificationEngine] onAssignmentGraded error:', err);
    }
  }
}

module.exports = NotificationEngine;
