const DiscussionForum = require('../../models/DiscussionForum');
const DiscussionPost = require('../../models/DiscussionPost');
const {
  api, createStudent, createAdmin, createForum, authHeader,
} = require('../helpers/factories');

describe('Browsing forums', () => {
  test('TC-FOR-01 lists forums with filters and treats search symbols literally [FR-019]', async () => {
    await createForum({ title: 'Grammar Q&A (beginners)', category: 'grammar', level: 'beginner', isPinned: true });
    await createForum({ title: 'Culture corner', category: 'culture', level: 'all' });
    await createForum({ title: 'Closed', isActive: false, isLocked: true });

    const grammar = await api().get('/api/forums?category=Grammar');
    const beginnerView = await api().get('/api/forums?level=Beginner&includeAllLevels=true&isActive=true');
    const search = await api().get('/api/forums?search=(beginners)');
    const flags = await api().get('/api/forums?isActive=false&isLocked=true&isPinned=false');

    expect(grammar.body.forums.map((f) => f.title)).toEqual(['Grammar Q&A (beginners)']);
    expect(beginnerView.body.forums.map((f) => f.title).sort()).toEqual(['Culture corner', 'Grammar Q&A (beginners)']);
    expect(search.body.forums).toHaveLength(1);
    expect(flags.body.forums.map((f) => f.title)).toEqual(['Closed']);
  });

  test('TC-FOR-02 reports forum statistics [FR-019]', async () => {
    await createForum({ isPinned: true });
    await createForum({ isActive: false, isLocked: true });

    const res = await api().get('/api/forums/stats');

    expect(res.body.stats).toEqual({ total: 2, active: 1, inactive: 1, pinned: 1, locked: 1 });
  });

  test('TC-FOR-03 opening a forum counts a view [FR-019]', async () => {
    const forum = await createForum();

    await api().get(`/api/forums/${forum._id}`);
    const res = await api().get(`/api/forums/${forum._id}`);
    const missing = await api().get('/api/forums/64b7f0a0a0a0a0a0a0a0a0a0');

    expect(res.body.forum.viewCount).toBe(2);
    expect(missing.status).toBe(404);
  });

  // An empty forum collection is filled with five demonstration forums whose post
  // and view counts are invented, the first time anyone lists the forums.
  test.failing('TC-FOR-04 [KNOWN DEFECT DEF-17] listing forums does not insert demonstration data [OWASP-A08]', async () => {
    await api().get('/api/forums');

    expect(await DiscussionForum.countDocuments()).toBe(0);
  });
});

describe('Creating and moderating forums', () => {
  test('TC-FOR-05 a student creates a forum but cannot pin, lock or hide it [FR-019]', async () => {
    const student = await createStudent();

    const res = await api().post('/api/forums').set(authHeader(student)).send({
      title: 'Study buddies', description: 'Find a partner', category: 'Study Tips', level: 'Beginner', isPinned: true, isLocked: true, isActive: false,
    });

    expect(res.status).toBe(201);
    expect(res.body.forum).toMatchObject({ category: 'study-tips', level: 'beginner', isPinned: false, isLocked: false, isActive: true });
  });

  test('TC-FOR-06 an administrator can create a pinned forum and requires a title and description [FR-019]', async () => {
    const admin = await createAdmin();

    const pinned = await api().post('/api/forums').set(authHeader(admin)).send({ title: 'Rules', description: 'Read first', isPinned: true, tags: ['rules'], rules: ['Be kind'] });
    const invalid = await api().post('/api/forums').set(authHeader(admin)).send({ title: 'No description' });

    expect(pinned.body.forum).toMatchObject({ isPinned: true, category: 'general', level: 'all' });
    expect(invalid.status).toBe(400);
  });

  test('TC-FOR-07 only the creator or an administrator may edit or delete a forum [FR-019][OWASP-A01]', async () => {
    const creator = await createStudent();
    const forum = await createForum({ createdBy: creator._id });
    await DiscussionPost.create({ forum: forum._id, author: creator._id, title: 'p', content: 'c' });

    const stranger = await api().put(`/api/forums/${forum._id}`).set(authHeader(await createStudent())).send({ title: 'Hijacked' });
    const ownEdit = await api().put(`/api/forums/${forum._id}`).set(authHeader(creator)).send({ title: 'Renamed', description: 'd', category: 'Culture', level: 'All', tags: ['t'], rules: ['r'] });
    const ownModeration = await api().put(`/api/forums/${forum._id}`).set(authHeader(creator)).send({ isPinned: true });
    const strangerDelete = await api().delete(`/api/forums/${forum._id}`).set(authHeader(await createStudent()));
    const ownDelete = await api().delete(`/api/forums/${forum._id}`).set(authHeader(creator));

    expect(stranger.status).toBe(403);
    expect(ownEdit.body.forum).toMatchObject({ title: 'Renamed', category: 'culture' });
    expect(ownModeration.status).toBe(403);
    expect(strangerDelete.status).toBe(403);
    expect(ownDelete.status).toBe(200);
    expect(await DiscussionPost.countDocuments()).toBe(0);
  });

  test('TC-FOR-08 administrators and moderators can pin, hide and lock a forum [FR-019]', async () => {
    const admin = await createAdmin();
    const moderator = await createStudent();
    const forum = await createForum({ moderators: [moderator._id] });

    const pin = await api().patch(`/api/forums/${forum._id}/pin`).set(authHeader(moderator));
    const hide = await api().patch(`/api/forums/${forum._id}/active`).set(authHeader(admin));
    const lock = await api().patch(`/api/forums/${forum._id}/lock`).set(authHeader(moderator));
    const adminEdit = await api().put(`/api/forums/${forum._id}`).set(authHeader(admin)).send({ isActive: true, isLocked: false, isPinned: false });

    expect(pin.body.forum.isPinned).toBe(true);
    expect(hide.body.forum.isActive).toBe(false);
    expect(lock.body.forum.isLocked).toBe(true);
    expect(adminEdit.body.forum).toMatchObject({ isActive: true, isLocked: false, isPinned: false });
  });

  test('TC-FOR-09 refuses moderation by ordinary users and reports unknown forums [FR-019]', async () => {
    const student = await createStudent();
    const forum = await createForum();
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    for (const action of ['pin', 'active', 'lock']) {
      expect((await api().patch(`/api/forums/${forum._id}/${action}`).set(authHeader(student))).status).toBe(403);
      expect((await api().patch(`/api/forums/${missing}/${action}`).set(authHeader(student))).status).toBe(404);
    }
    expect((await api().put(`/api/forums/${missing}`).set(authHeader(student)).send({})).status).toBe(404);
    expect((await api().delete(`/api/forums/${missing}`).set(authHeader(student))).status).toBe(404);
  });
});

describe('Posts, replies and likes', () => {
  test('TC-FOR-10 publishes a post, updates the forum and lists posts [FR-019]', async () => {
    const student = await createStudent();
    const forum = await createForum();
    const longContent = 'How do I use the -아/어요 ending with verbs that end in a vowel?';

    const res = await api().post(`/api/forums/${forum._id}/posts`).set(authHeader(student)).send({ content: longContent, isPinned: true });
    const list = await api().get(`/api/forums/${forum._id}/posts`);
    const stored = await DiscussionForum.findById(forum._id);

    expect(res.status).toBe(201);
    expect(res.body.post).toMatchObject({ title: `${longContent.substring(0, 47)}...`, isPinned: false });
    expect(list.body.posts).toHaveLength(1);
    expect(stored.postCount).toBe(1);
    expect(stored.lastPost.author.equals(student._id)).toBe(true);
  });

  test('TC-FOR-11 blocks posts in locked forums except for administrators and requires content [FR-019]', async () => {
    const forum = await createForum({ isLocked: true });

    const student = await api().post(`/api/forums/${forum._id}/posts`).set(authHeader(await createStudent())).send({ content: 'hi' });
    const admin = await api().post(`/api/forums/${forum._id}/posts`).set(authHeader(await createAdmin())).send({ title: 'Notice', content: 'Read the rules', isPinned: true });
    const empty = await api().post(`/api/forums/${(await createForum())._id}/posts`).set(authHeader(await createStudent())).send({});
    const missing = await api().post('/api/forums/64b7f0a0a0a0a0a0a0a0a0a0/posts').set(authHeader(await createStudent())).send({ content: 'x' });

    expect(student.status).toBe(403);
    expect(admin.body.post).toMatchObject({ title: 'Notice', isPinned: true });
    expect(empty.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  test('TC-FOR-12 replies to a post and toggles likes [FR-019]', async () => {
    const author = await createStudent();
    const reader = await createStudent();
    const forum = await createForum();
    const post = await DiscussionPost.create({ forum: forum._id, author: author._id, title: 'Q', content: 'Question' });

    const reply = await api().post(`/api/forums/posts/${post._id}/reply`).set(authHeader(reader)).send({ content: 'Answer' });
    const like = await api().post(`/api/forums/posts/${post._id}/like`).set(authHeader(reader));
    const unlike = await api().post(`/api/forums/posts/${post._id}/like`).set(authHeader(reader));

    expect(reply.body.post).toMatchObject({ replyCount: 1, replies: [{ content: 'Answer' }] });
    expect(like.body).toEqual({ success: true, likes: 1, isLiked: true });
    expect(unlike.body).toEqual({ success: true, likes: 0, isLiked: false });
  });

  test('TC-FOR-13 validates replies and reports unknown posts [FR-019]', async () => {
    const student = await createStudent();
    const forum = await createForum();
    const post = await DiscussionPost.create({ forum: forum._id, author: student._id, title: 'Q', content: 'c' });
    const missing = '64b7f0a0a0a0a0a0a0a0a0a0';

    expect((await api().post(`/api/forums/posts/${post._id}/reply`).set(authHeader(student)).send({})).status).toBe(400);
    expect((await api().post(`/api/forums/posts/${missing}/reply`).set(authHeader(student)).send({ content: 'x' })).status).toBe(404);
    expect((await api().post(`/api/forums/posts/${missing}/like`).set(authHeader(student))).status).toBe(404);
  });

  // Locking a forum stops new posts, but replies to existing posts are still accepted.
  test.failing('TC-FOR-14 [KNOWN DEFECT DEF-14] rejects replies in a locked forum [FR-019]', async () => {
    const student = await createStudent();
    const forum = await createForum({ isLocked: true });
    const post = await DiscussionPost.create({ forum: forum._id, author: student._id, title: 'Q', content: 'c' });

    const res = await api().post(`/api/forums/posts/${post._id}/reply`).set(authHeader(student)).send({ content: 'Still talking' });

    expect(res.status).toBe(403);
  });

  test('TC-FOR-15 answers 500 when forums cannot be loaded [NFR-002]', async () => {
    jest.spyOn(DiscussionForum, 'countDocuments').mockRejectedValue(new Error('boom'));

    expect((await api().get('/api/forums/stats')).status).toBe(500);
  });
});
