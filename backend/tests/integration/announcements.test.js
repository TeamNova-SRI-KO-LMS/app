const Announcement = require('../../models/Announcement');
const Notification = require('../../models/Notification');
const { api, createStudent, createAdmin, createAnnouncement, authHeader } = require('../helpers/factories');

describe('Public announcements', () => {
  test('TC-ANN-01 lists active announcements, pinned first [FR-016]', async () => {
    await createAnnouncement({ title: 'Older' });
    await createAnnouncement({ title: 'Pinned', isPinned: true });
    await createAnnouncement({ title: 'Hidden', isActive: false });

    const res = await api().get('/api/announcements');

    expect(res.status).toBe(200);
    expect(res.body.announcements.map((a) => a.title)).toEqual(['Pinned', 'Older']);
    expect(res.body.pagination).toMatchObject({ total: 2, pages: 1 });
  });

  test('TC-ANN-02 filters by type, audience, search text and current dates [FR-016]', async () => {
    await createAnnouncement({ title: 'Exam timetable', type: 'academic', targetAudience: 'students' });
    await createAnnouncement({ title: 'Server upgrade', type: 'maintenance' });
    await createAnnouncement({ title: 'Expired notice', endDate: new Date('2020-01-01') });
    await createAnnouncement({ title: 'Future notice', startDate: new Date(Date.now() + 86400000) });

    const academic = await api().get('/api/announcements?type=Academic');
    const audience = await api().get('/api/announcements?audience=students');
    const search = await api().get('/api/announcements?search=(upgrade');
    const current = await api().get('/api/announcements?currentOnly=true');

    expect(academic.body.announcements.map((a) => a.title)).toEqual(['Exam timetable']);
    expect(audience.body.announcements.length).toBe(4);
    expect(search.body.announcements).toHaveLength(0);
    expect(current.body.announcements.map((a) => a.title).sort()).toEqual(['Exam timetable', 'Server upgrade']);
  });

  test('TC-ANN-03 returns one announcement and records that a user read it once [FR-016]', async () => {
    const student = await createStudent();
    const announcement = await createAnnouncement({ title: 'Holiday' });

    const detail = await api().get(`/api/announcements/${announcement._id}`);
    await api().post(`/api/announcements/${announcement._id}/read`).set(authHeader(student));
    await api().post(`/api/announcements/${announcement._id}/read`).set(authHeader(student));
    const missing = await api().get('/api/announcements/64b7f0a0a0a0a0a0a0a0a0a0');
    const missingRead = await api().post('/api/announcements/64b7f0a0a0a0a0a0a0a0a0a0/read').set(authHeader(student));

    expect(detail.body.announcement.title).toBe('Holiday');
    expect((await Announcement.findById(announcement._id)).readBy).toHaveLength(1);
    expect(missing.status).toBe(404);
    expect(missingRead.status).toBe(404);
  });
});

describe('Administrative announcement management', () => {
  test('TC-ANN-04 creates an announcement and dispatches an in-app notification [FR-016][FR-017]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/announcements').set(authHeader(admin)).send({
      title: '  Chuseok holiday  ', content: 'No classes on Monday.', type: 'Event', priority: 'High', targetAudience: 'students',
      tags: 'holiday, schedule', photo: 'https://cdn.example.com/chuseok.png',
    });

    expect(res.status).toBe(201);
    expect(res.body.announcement).toMatchObject({ title: 'Chuseok holiday', type: 'event', priority: 'high', tags: ['holiday', 'schedule'], photo: 'https://cdn.example.com/chuseok.png' });
    expect(await Notification.countDocuments({ title: '📢 Chuseok holiday', targetAudience: 'students' })).toBe(1);
  });

  test('TC-ANN-05 requires a title and content [FR-016]', async () => {
    const admin = await createAdmin();

    expect((await api().post('/api/announcements').set(authHeader(admin)).send({ content: 'x' })).status).toBe(400);
    expect((await api().post('/api/announcements').set(authHeader(admin)).send({ title: 'x' })).status).toBe(400);
  });

  test('TC-ANN-06 lists all announcements with administrative filters and statistics [FR-016]', async () => {
    const admin = await createAdmin();
    await createAnnouncement({ title: 'Urgent', priority: 'urgent', isPinned: true });
    await createAnnouncement({ title: 'Inactive', isActive: false, targetAudience: 'instructors' });

    const filtered = await api().get('/api/announcements/admin/all?priority=urgent&isPinned=true&type=general&search=urg&dateFrom=2000-01-01&dateTo=2100-01-01').set(authHeader(admin));
    const inactive = await api().get('/api/announcements/all?isActive=false&targetAudience=instructors').set(authHeader(admin));
    const stats = await api().get('/api/announcements/stats').set(authHeader(admin));

    expect(filtered.body.announcements.map((a) => a.title)).toEqual(['Urgent']);
    expect(inactive.body.announcements.map((a) => a.title)).toEqual(['Inactive']);
    expect(stats.body.stats).toEqual({ total: 2, active: 1, inactive: 1, pinned: 1 });
  });

  test('TC-ANN-07 updates every editable field [FR-016]', async () => {
    const admin = await createAdmin();
    const announcement = await createAnnouncement();

    const res = await api().put(`/api/announcements/${announcement._id}`).set(authHeader(admin)).send({
      title: 'Edited', content: 'New content', type: 'Academic', priority: 'Low', targetAudience: 'all', isActive: true, isPinned: true,
      startDate: '2026-10-01', endDate: '', tags: ['a', ' b '], attachments: [{ filename: 'f.pdf', url: 'https://x/f.pdf' }], thumbnail: 'https://x/t.png',
    });
    const tagString = await api().put(`/api/announcements/${announcement._id}`).set(authHeader(admin)).send({ tags: 'x,y' });

    expect(res.body.announcement).toMatchObject({ title: 'Edited', type: 'academic', priority: 'low', isPinned: true, endDate: null, tags: ['a', 'b'], photo: 'https://x/t.png' });
    expect(tagString.body.announcement.tags).toEqual(['x', 'y']);
  });

  test('TC-ANN-08 toggles pin and active state with PUT or PATCH and deletes [FR-016]', async () => {
    const admin = await createAdmin();
    const announcement = await createAnnouncement();
    const id = announcement._id;

    const pinned = await api().patch(`/api/announcements/${id}/pin`).set(authHeader(admin));
    const unpinned = await api().put(`/api/announcements/${id}/pin`).set(authHeader(admin));
    const deactivated = await api().patch(`/api/announcements/${id}/active`).set(authHeader(admin));
    const reactivated = await api().put(`/api/announcements/${id}/active`).set(authHeader(admin));
    const deleted = await api().delete(`/api/announcements/${id}`).set(authHeader(admin));

    expect(pinned.body.isPinned).toBe(true);
    expect(unpinned.body.isPinned).toBe(false);
    expect(deactivated.body.message).toBe('Announcement status changed to Inactive');
    expect(reactivated.body.isActive).toBe(true);
    expect(deleted.status).toBe(200);
  });

  test('TC-ANN-09 answers 404 when managing an unknown announcement [FR-016]', async () => {
    const admin = await createAdmin();
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    expect((await api().put(`/api/announcements/${missing}`).set(authHeader(admin)).send({ title: 'x' })).status).toBe(404);
    expect((await api().delete(`/api/announcements/${missing}`).set(authHeader(admin))).status).toBe(404);
    expect((await api().patch(`/api/announcements/${missing}/pin`).set(authHeader(admin))).status).toBe(404);
    expect((await api().patch(`/api/announcements/${missing}/active`).set(authHeader(admin))).status).toBe(404);
  });

  test('TC-ANN-10 answers 500 when announcements cannot be loaded [NFR-002]', async () => {
    jest.spyOn(Announcement, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/announcements')).status).toBe(500);
  });
});
