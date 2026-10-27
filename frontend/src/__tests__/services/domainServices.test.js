import { beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';

vi.mock('../../services/uploadService', () => ({
  uploadToSupabase: vi.fn(async (file, bucket, folder) => `https://cdn.example/${folder}/${file.name}`),
}));

import announcementService from '../../services/announcementService';
import eventService from '../../services/eventService';
import courseService from '../../services/courseService';
import discussionForumService from '../../services/discussionForumService';
import notificationService from '../../services/notificationService';
import assignmentService from '../../services/assignmentService';
import lectureService from '../../services/lectureService';
import * as attendanceService from '../../services/attendanceService';
import * as chatService from '../../services/chatService';
import { uploadToSupabase } from '../../services/uploadService';
import { mockApi, bodyOf } from '../../test/mockApi';

const call = (config) => {
  const query = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
  return `${config.method.toUpperCase()} ${config.url}${query}`;
};

let api;
beforeEach(() => {
  api = mockApi();
});

describe('announcementService', () => {
  test('TC-FE-SVC-01 builds administrative and public announcement queries [FR-016]', async () => {
    await announcementService.getAllAnnouncements(2, 10, {
      type: 'academic', priority: 'high', targetAudience: 'students', isActive: true, isPinned: false, search: 'exam', dateFrom: '2026-10-01', dateTo: '2026-10-31',
    });
    await announcementService.getAllAnnouncements(1, 20, { type: 'ALL', priority: 'all', targetAudience: 'all', isActive: '', isPinned: '' });
    await announcementService.getActiveAnnouncements({ page: 1, limit: 5, type: 'general', audience: 'students', search: 'x', currentOnly: true });
    await announcementService.getActiveAnnouncements();

    expect(api.requests.map(call)).toEqual([
      'GET /announcements/admin/all?page=2&limit=10&type=academic&priority=high&targetAudience=students&isActive=true&isPinned=false&search=exam&dateFrom=2026-10-01&dateTo=2026-10-31',
      'GET /announcements/admin/all?page=1&limit=20',
      'GET /announcements?page=1&limit=5&type=general&audience=students&search=x&currentOnly=true',
      'GET /announcements',
    ]);
  });

  test('TC-FE-SVC-02 manages announcements and uploads photos to Supabase [FR-016]', async () => {
    await announcementService.getAnnouncementStats();
    await announcementService.getAnnouncementById('a1');
    await announcementService.createAnnouncement({ title: 'T' });
    await announcementService.updateAnnouncement('a1', { title: 'U' });
    await announcementService.deleteAnnouncement('a1');
    await announcementService.togglePinAnnouncement('a1');
    await announcementService.toggleActiveAnnouncement('a1');
    await announcementService.markAsRead('a1');
    const photo = await announcementService.uploadPhoto({ name: 'p.png' });
    const thumb = await announcementService.uploadThumbnail({ name: 't.png' });

    expect(api.requests.map(call)).toEqual([
      'GET /announcements/stats', 'GET /announcements/a1', 'POST /announcements', 'PUT /announcements/a1',
      'DELETE /announcements/a1', 'PUT /announcements/a1/pin', 'PUT /announcements/a1/active', 'POST /announcements/a1/read',
    ]);
    expect(photo).toEqual({ success: true, url: 'https://cdn.example/announcements/p.png', storage: 'supabase' });
    expect(thumb.url).toBe('https://cdn.example/announcements/t.png');
  });
});

describe('eventService', () => {
  test('TC-FE-SVC-03 builds administrative and public event queries [FR-018]', async () => {
    await eventService.getAllEvents(1, 20, { category: 'workshop', status: 'upcoming', isActive: true, isPinned: true, search: 'hangul', dateFrom: 'a', dateTo: 'b' });
    await eventService.getAllEvents(1, 20, { category: 'all', status: 'ALL', isActive: 'all', isPinned: 'all' });
    await eventService.getActiveEvents({ page: 2, limit: 3, category: 'exam', status: 'ongoing', search: 's', upcomingOnly: true });
    await eventService.getActiveEvents();

    expect(api.requests.map(call)).toEqual([
      'GET /events/admin/all?page=1&limit=20&category=workshop&status=upcoming&isActive=true&isPinned=true&search=hangul&dateFrom=a&dateTo=b',
      'GET /events/admin/all?page=1&limit=20',
      'GET /events?page=2&limit=3&category=exam&status=ongoing&search=s&upcomingOnly=true',
      'GET /events',
    ]);
  });

  test('TC-FE-SVC-04 manages events and uploads several photos in order [FR-018]', async () => {
    const progress = vi.fn();
    await eventService.getEventStats();
    await eventService.getEventById('e1');
    await eventService.createEvent({});
    await eventService.updateEvent('e1', {});
    await eventService.deleteEvent('e1');
    await eventService.togglePinEvent('e1');
    await eventService.toggleActiveEvent('e1');
    const single = await eventService.uploadPhoto({ name: 'cover.png' });
    const urls = await eventService.uploadMultiplePhotos([{ name: 'a.png' }, { name: 'b.png' }], progress);

    expect(api.requests.map(call)).toEqual([
      'GET /events/stats', 'GET /events/e1', 'POST /events', 'PUT /events/e1', 'DELETE /events/e1', 'PUT /events/e1/pin', 'PUT /events/e1/active',
    ]);
    expect(single.url).toBe('https://cdn.example/events/cover.png');
    expect(urls).toEqual(['https://cdn.example/events/a.png', 'https://cdn.example/events/b.png']);
    expect(progress).toHaveBeenLastCalledWith({ completed: 2, total: 2, currentUrl: 'https://cdn.example/events/b.png' });
  });

  test('TC-FE-SVC-05 stops a multi-photo upload at the first failure [FR-018]', async () => {
    uploadToSupabase.mockRejectedValueOnce(new Error('bucket missing'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(eventService.uploadMultiplePhotos([{ name: 'a.png' }, { name: 'b.png' }])).rejects.toThrow('bucket missing');
  });
});

describe('courseService', () => {
  test('TC-FE-SVC-06 builds catalogue and administrative course requests [FR-003][FR-006]', async () => {
    await courseService.getAdminCourses({ page: 1, limit: 10, category: 'Business', level: 'advanced', status: 'PUBLISHED', search: 'topik' });
    await courseService.getAdminCourses({ category: 'All Categories', level: 'All Levels', status: 'Status' });
    await courseService.getAllCourses({ page: 2, limit: 5, category: 'Language', level: 'beginner', search: 'a' });
    await courseService.getAllCourses();
    await courseService.getCourse('c1');
    await courseService.enrollInCourse('c1');
    await courseService.addReview('c1', { rating: 5 });
    await courseService.completeCourse('c1');
    await courseService.createCourse({});
    await courseService.updateCourse('c1', {});
    await courseService.deleteCourse('c1');
    await courseService.togglePublish('c1');

    expect(api.requests.map(call)).toEqual([
      'GET /courses/admin/all?page=1&limit=10&category=Business&level=advanced&status=PUBLISHED&search=topik',
      'GET /courses/admin/all?',
      'GET /courses?page=2&limit=5&category=Language&level=beginner&search=a',
      'GET /courses?',
      'GET /courses/c1', 'POST /courses/c1/enroll', 'POST /courses/c1/reviews', 'POST /courses/c1/complete',
      'POST /courses/admin', 'PUT /courses/admin/c1', 'DELETE /courses/admin/c1', 'PATCH /courses/admin/c1/toggle-publish',
    ]);
  });
});

describe('discussionForumService', () => {
  test('TC-FE-SVC-07 builds forum, post, reply and like requests [FR-019]', async () => {
    await discussionForumService.getAllForums(1, 20, { category: 'grammar', level: 'beginner', includeAllLevels: true, isActive: true, isPinned: false, isLocked: false, search: 'q' });
    await discussionForumService.getAllForums();
    await discussionForumService.getForumStats();
    await discussionForumService.getForumById('f1');
    await discussionForumService.createForum({});
    await discussionForumService.updateForum('f1', {});
    await discussionForumService.deleteForum('f1');
    await discussionForumService.togglePinForum('f1');
    await discussionForumService.toggleActiveForum('f1');
    await discussionForumService.toggleLockForum('f1');
    await discussionForumService.getPostsByForum('f1');
    await discussionForumService.createPost('f1', { content: 'hi' });
    await discussionForumService.replyToPost('p1', { content: 'yo' });
    await discussionForumService.toggleLikePost('p1');

    expect(api.requests.map(call)).toEqual([
      'GET /forums?page=1&limit=20&category=grammar&level=beginner&includeAllLevels=true&isActive=true&isPinned=false&isLocked=false&search=q',
      'GET /forums?page=1&limit=20',
      'GET /forums/stats', 'GET /forums/f1', 'POST /forums', 'PUT /forums/f1', 'DELETE /forums/f1',
      'PATCH /forums/f1/pin', 'PATCH /forums/f1/active', 'PATCH /forums/f1/lock', 'GET /forums/f1/posts',
      'POST /forums/f1/posts', 'POST /forums/posts/p1/reply', 'POST /forums/posts/p1/like',
    ]);
  });
});

describe('notificationService', () => {
  test('TC-FE-SVC-08 calls the user and administrative notification endpoints [FR-017]', async () => {
    await notificationService.getActiveNotifications();
    await notificationService.getUnreadCount();
    await notificationService.markAsRead('n1');
    await notificationService.markAsClicked('n1');
    await notificationService.markAllAsRead();
    await notificationService.getAllNotifications({ page: 2 });
    await notificationService.createNotification({ title: 't' });
    await notificationService.deleteNotification('n1');
    await notificationService.getNotificationStats();

    expect(api.requests.map(call)).toEqual([
      'GET /notifications', 'GET /notifications/unread-count', 'POST /notifications/n1/read', 'POST /notifications/n1/click',
      'POST /notifications/mark-all-read', 'GET /notifications/all?page=2', 'POST /notifications', 'DELETE /notifications/n1', 'GET /notifications/stats',
    ]);
  });
});

describe('attendanceService', () => {
  test('TC-FE-SVC-09 sends student attendance requests [FR-015]', async () => {
    await attendanceService.fetchMyAttendance();
    await attendanceService.fetchMonthlyAttendance(2026, 10);
    await attendanceService.fetchMonthlyAttendance(2026, 10, 'c1');
    await attendanceService.fetchEnrolledCourses();
    await attendanceService.saveAttendance({ courseId: 'c1', date: '2026-10-20', status: 'present' });
    await attendanceService.updateAttendance('r1', { status: 'late' });
    await attendanceService.deleteAttendance('r1');

    expect(api.requests.map(call)).toEqual([
      'GET /attendance/my-attendance', 'GET /attendance/monthly?year=2026&month=10', 'GET /attendance/monthly?year=2026&month=10&courseId=c1',
      'GET /attendance/enrolled-courses', 'POST /attendance', 'PUT /attendance/r1', 'DELETE /attendance/r1',
    ]);
    expect(bodyOf(api.requests[4])).toEqual({ courseId: 'c1', date: '2026-10-20', status: 'present', notes: '' });
  });

  test('TC-FE-SVC-10 drops empty administrative filters and downloads CSV as a blob [FR-015]', async () => {
    const filters = { from: '2026-10-01', to: '', courseId: 'all', search: null, status: 'absent', page: 1 };

    await attendanceService.fetchAdminAttendanceOverview(filters);
    await attendanceService.fetchAdminAttendanceRecords(filters);
    await attendanceService.fetchAdminAttendanceStudents(filters);
    await attendanceService.exportAdminAttendanceCsv({});
    await attendanceService.fetchAdminAttendanceOverview();

    expect(api.requests.map(call)).toEqual([
      'GET /attendance/admin/overview?from=2026-10-01&status=absent&page=1',
      'GET /attendance/admin/records?from=2026-10-01&status=absent&page=1',
      'GET /attendance/admin/students?from=2026-10-01&status=absent&page=1',
      'GET /attendance/admin/export?',
      'GET /attendance/admin/overview?',
    ]);
    expect(api.requests[3]).toMatchObject({ responseType: 'blob', timeout: 60000 });
  });
});

describe('chatService', () => {
  test('TC-FE-SVC-11 sends questions with context and manages the conversation [FR-021]', async () => {
    mockApi((config) => (config.method === 'post' ? { reply: { text: 'Annyeonghaseyo!' } } : { messages: [], url: config.url }));

    const reply = await chatService.sendChatMessage('hello', { courseId: 'c1' });
    const history = await chatService.fetchChatHistory();
    const cleared = await chatService.clearChatHistory();

    expect(reply).toEqual({ text: 'Annyeonghaseyo!' });
    expect(history.url).toBe('/chat/history');
    expect(cleared.url).toBe('/chat/history');
    expect(chatService.GUEST_SUGGESTIONS).toHaveLength(4);
    expect(chatService.STUDENT_SUGGESTIONS[0]).toBe('My attendance');
  });
});

describe('Upload-heavy services', () => {
  test('TC-FE-SVC-12 sends assignment and lecture uploads with the token, a long timeout and progress [FR-007][FR-020]', async () => {
    localStorage.setItem('token', 'tok');
    const post = vi.spyOn(axios, 'post').mockImplementation(async (url, data, config) => {
      config.onUploadProgress({ loaded: 50, total: 200 });
      config.onUploadProgress({ loaded: 10 });
      return { data: { url } };
    });
    const progress = vi.fn();

    const submitted = await assignmentService.submitAssignment('a1', new FormData(), progress);
    const uploaded = await lectureService.uploadMaterial(new FormData(), progress);
    const thumb = await lectureService.uploadThumbnail(new Blob(['x']), progress);
    localStorage.clear();
    await lectureService.uploadThumbnail(new Blob(['x']));

    expect(submitted.url).toBe('http://localhost:5000/api/assignments/a1/submit');
    expect(uploaded.url).toBe('http://localhost:5000/api/lectures/upload');
    expect(thumb.url).toBe('http://localhost:5000/api/lectures/upload-thumbnail');
    expect(post.mock.calls[0][2]).toMatchObject({ timeout: 300000, headers: { Authorization: 'Bearer tok' } });
    expect(post.mock.calls[3][2].headers.Authorization).toBeUndefined();
    expect(progress).toHaveBeenCalledWith(25);
    expect(progress).toHaveBeenCalledTimes(3);
  });

  test('TC-FE-SVC-13 calls the remaining assignment and lecture endpoints [FR-007][FR-020]', async () => {
    await assignmentService.createAssignment({});
    await assignmentService.getCourseAssignments('c1');
    await assignmentService.getAssignmentById('a1');
    await assignmentService.getMySubmission('a1');
    await assignmentService.getAllSubmissions('a1');
    await assignmentService.gradeSubmission('s1', { grade: 90 });
    await assignmentService.deleteAssignment('a1');
    await lectureService.getCourseMaterials('c1');
    await lectureService.getMaterialById('m1');
    await lectureService.addExternalLink({});
    await lectureService.deleteMaterial('m1');

    expect(api.requests.map(call)).toEqual([
      'POST /assignments', 'GET /assignments/course/c1', 'GET /assignments/a1', 'GET /assignments/a1/my-submission',
      'GET /assignments/a1/submissions', 'PATCH /assignments/submissions/s1/grade', 'DELETE /assignments/a1',
      'GET /lectures/course/c1', 'GET /lectures/m1', 'POST /lectures/link', 'DELETE /lectures/m1',
    ]);
  });
});
