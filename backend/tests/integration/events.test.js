const Event = require('../../models/Event');
const { api, createStudent, createAdmin, createEvent, authHeader } = require('../helpers/factories');

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe('Public events', () => {
  test('TC-EVT-01 lists active events, pinned first then by date [FR-018]', async () => {
    await createEvent({ title: 'Later', eventDate: inDays(10) });
    await createEvent({ title: 'Sooner', eventDate: inDays(2) });
    await createEvent({ title: 'Pinned', eventDate: inDays(20), isPinned: true });
    await createEvent({ title: 'Inactive', isActive: false });

    const res = await api().get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.events.map((e) => e.title)).toEqual(['Pinned', 'Sooner', 'Later']);
  });

  test('TC-EVT-02 filters by category, status, search text and upcoming dates [FR-018]', async () => {
    await createEvent({ title: 'Hanbok workshop', category: 'workshop', location: 'Kadawata' });
    await createEvent({ title: 'Past seminar', eventDate: inDays(-5), status: 'completed' });

    const workshops = await api().get('/api/events?category=Workshop');
    const completed = await api().get('/api/events?status=Completed');
    const search = await api().get('/api/events?search=kadawata');
    const upcoming = await api().get('/api/events?upcomingOnly=true');

    expect(workshops.body.events.map((e) => e.title)).toEqual(['Hanbok workshop']);
    expect(completed.body.events.map((e) => e.title)).toEqual(['Past seminar']);
    expect(search.body.events.map((e) => e.title)).toEqual(['Hanbok workshop']);
    expect(upcoming.body.events.map((e) => e.title)).toEqual(['Hanbok workshop']);
  });

  test('TC-EVT-03 returns one event or 404 [FR-018]', async () => {
    const event = await createEvent({ title: 'Chuseok' });

    expect((await api().get(`/api/events/${event._id}`)).body.event.title).toBe('Chuseok');
    expect((await api().get('/api/events/64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
  });
});

describe('Event registration', () => {
  test('TC-EVT-04 registers a user once and cancels the registration [FR-018]', async () => {
    const student = await createStudent();
    const event = await createEvent();

    const first = await api().post(`/api/events/${event._id}/attend`).set(authHeader(student));
    const second = await api().post(`/api/events/${event._id}/attend`).set(authHeader(student));
    const cancelled = await api().delete(`/api/events/${event._id}/attend`).set(authHeader(student));

    expect(first.body).toMatchObject({ success: true, attendeesCount: 1 });
    expect(second.status).toBe(400);
    expect(cancelled.body.attendeesCount).toBe(0);
  });

  test('TC-EVT-05 refuses registration when the event is full, inactive, cancelled or unknown [FR-018]', async () => {
    const student = await createStudent();
    const full = await createEvent({ capacity: 1, attendees: [(await createStudent())._id] });
    const inactive = await createEvent({ isActive: false });
    const cancelled = await createEvent({ status: 'cancelled' });
    const attend = (id) => api().post(`/api/events/${id}/attend`).set(authHeader(student));

    expect((await attend(full._id)).body.message).toBe('Event capacity is full');
    expect((await attend(inactive._id)).status).toBe(400);
    expect((await attend(cancelled._id)).status).toBe(400);
    expect((await attend('64b7f0a0a0a0a0a0a0a0a0a0')).status).toBe(404);
    expect((await api().delete('/api/events/64b7f0a0a0a0a0a0a0a0a0a0/attend').set(authHeader(student))).status).toBe(404);
  });
});

describe('Administrative event management', () => {
  test('TC-EVT-06 creates an event, parsing tags and photos and choosing a cover [FR-018]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/events').set(authHeader(admin)).send({
      title: ' Hangul Day ', description: ' Celebration ', eventDate: inDays(5).toISOString(), endDate: inDays(5).toISOString(), duration: '90',
      location: ' Kadawata ', meetingLink: ' https://meet.example.com/x ', category: 'Cultural', status: 'Upcoming', capacity: '50',
      photos: ['https://img/1.png', ' https://img/2.png '], tags: 'hangul, culture',
    });

    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({
      title: 'Hangul Day', duration: 90, location: 'Kadawata', category: 'cultural', capacity: 50,
      tags: ['hangul', 'culture'], coverImage: 'https://img/1.png', organizer: { name: admin.name },
    });
  });

  test('TC-EVT-07 applies sensible defaults and accepts a single photo string [FR-018]', async () => {
    const admin = await createAdmin();

    const res = await api().post('/api/events').set(authHeader(admin)).send({
      title: 'Webinar', description: 'Online', eventDate: inDays(3), photos: 'https://img/only.png', tags: ['a', ''],
    });

    expect(res.body.event).toMatchObject({ location: 'Online', duration: 60, category: 'seminar', status: 'upcoming', capacity: 0, coverImage: 'https://img/only.png', tags: ['a'] });
  });

  test('TC-EVT-08 requires a title, description and date [FR-018]', async () => {
    const admin = await createAdmin();
    const post = (body) => api().post('/api/events').set(authHeader(admin)).send(body);

    expect((await post({ description: 'd', eventDate: inDays(1) })).status).toBe(400);
    expect((await post({ title: 't', eventDate: inDays(1) })).status).toBe(400);
    expect((await post({ title: 't', description: 'd' })).status).toBe(400);
  });

  test('TC-EVT-09 updates fields and keeps a cover image [FR-018]', async () => {
    const admin = await createAdmin();
    const event = await createEvent({ photos: ['https://img/a.png'] });

    const res = await api().put(`/api/events/${event._id}`).set(authHeader(admin)).send({
      title: 'Renamed', description: 'New', eventDate: inDays(9), endDate: '', duration: 'abc', location: 'Gampaha', meetingLink: '',
      category: 'Exam', status: 'Ongoing', capacity: 'x', isActive: true, isPinned: true, relatedCourse: '', tags: 'x, y',
    });
    const photos = await api().put(`/api/events/${event._id}`).set(authHeader(admin)).send({ photos: ' https://img/b.png ', coverImage: '' });
    const arrayPhotos = await api().put(`/api/events/${event._id}`).set(authHeader(admin)).send({ photos: ['https://img/c.png'], tags: ['z'] });

    expect(res.body.event).toMatchObject({ title: 'Renamed', duration: 60, capacity: 0, category: 'exam', status: 'ongoing', endDate: null, tags: ['x', 'y'], coverImage: 'https://img/a.png' });
    expect(photos.body.event.coverImage).toBe('https://img/b.png');
    expect(arrayPhotos.body.event).toMatchObject({ photos: ['https://img/c.png'], tags: ['z'] });
  });

  test('TC-EVT-10 lists all events with admin filters and reports statistics [FR-018]', async () => {
    const admin = await createAdmin();
    await createEvent({ title: 'Pinned upcoming', isPinned: true, eventDate: inDays(3) });
    await createEvent({ title: 'Inactive completed', isActive: false, status: 'completed', category: 'exam', eventDate: inDays(-3) });

    const filtered = await api().get(`/api/events/admin/all?isActive=false&status=completed&category=exam&search=complete&dateFrom=${inDays(-10).toISOString()}&dateTo=${inDays(10).toISOString()}`).set(authHeader(admin));
    const pinned = await api().get('/api/events/all?isPinned=true').set(authHeader(admin));
    const stats = await api().get('/api/events/stats').set(authHeader(admin));

    expect(filtered.body.events.map((e) => e.title)).toEqual(['Inactive completed']);
    expect(pinned.body.events.map((e) => e.title)).toEqual(['Pinned upcoming']);
    expect(stats.body.stats).toEqual({ total: 2, upcoming: 1, ongoing: 0, completed: 1, cancelled: 0, active: 1, pinned: 1 });
  });

  test('TC-EVT-11 toggles pin and active state and deletes an event [FR-018]', async () => {
    const admin = await createAdmin();
    const event = await createEvent();

    const pinned = await api().patch(`/api/events/${event._id}/pin`).set(authHeader(admin));
    const unpinned = await api().put(`/api/events/${event._id}/pin`).set(authHeader(admin));
    const inactive = await api().patch(`/api/events/${event._id}/active`).set(authHeader(admin));
    const active = await api().put(`/api/events/${event._id}/active`).set(authHeader(admin));
    const deleted = await api().delete(`/api/events/${event._id}`).set(authHeader(admin));

    expect(pinned.body.isPinned).toBe(true);
    expect(unpinned.body.isPinned).toBe(false);
    expect(inactive.body.message).toBe('Event marked as inactive');
    expect(active.body.isActive).toBe(true);
    expect(deleted.status).toBe(200);
    expect(await Event.countDocuments()).toBe(0);
  });

  test('TC-EVT-12 answers 404 when managing an unknown event [FR-018]', async () => {
    const admin = await createAdmin();
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    expect((await api().put(`/api/events/${missing}`).set(authHeader(admin)).send({ title: 'x' })).status).toBe(404);
    expect((await api().delete(`/api/events/${missing}`).set(authHeader(admin))).status).toBe(404);
    expect((await api().patch(`/api/events/${missing}/pin`).set(authHeader(admin))).status).toBe(404);
    expect((await api().patch(`/api/events/${missing}/active`).set(authHeader(admin))).status).toBe(404);
  });

  test('TC-EVT-13 answers 500 when events cannot be loaded [NFR-002]', async () => {
    jest.spyOn(Event, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/events')).status).toBe(500);
  });
});
