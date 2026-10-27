const http = require('http');
const { io: connectClient } = require('socket.io-client');
const socketManager = require('../../../socket/socketManager');
const Notification = require('../../../models/Notification');
const { createStudent, tokenFor } = require('../../helpers/factories');

let server;
let url;
const clients = [];

const connect = (auth) => new Promise((resolve, reject) => {
  const client = connectClient(url, { auth, transports: ['websocket'], reconnection: false, forceNew: true });
  clients.push(client);
  client.on('connect', () => resolve(client));
  client.on('connect_error', reject);
});

const nextEvent = (client, event) => new Promise((resolve) => client.once(event, resolve));

beforeAll(async () => {
  server = http.createServer();
  socketManager.initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.close());
});

afterAll(async () => {
  socketManager.getIO().close();
  await new Promise((resolve) => server.close(resolve));
});

describe('Socket.IO authentication', () => {
  test('TC-UNIT-SOCK-01 refuses a connection without a token [OWASP-A07]', async () => {
    await expect(connect({})).rejects.toThrow('Authentication token required');
  });

  test('TC-UNIT-SOCK-02 refuses an invalid token [OWASP-A07]', async () => {
    await expect(connect({ token: 'forged' })).rejects.toThrow(/Authentication failed/);
  });

  test('TC-UNIT-SOCK-03 refuses a deactivated account [FR-009]', async () => {
    const user = await createStudent({ isActive: false });

    await expect(connect({ token: tokenFor(user) })).rejects.toThrow('Account is deactivated');
  });

  test('TC-UNIT-SOCK-04 accepts a valid token and tracks the user as online [FR-017]', async () => {
    const user = await createStudent();

    await connect({ token: tokenFor(user) });

    expect(socketManager.isUserOnline(user._id)).toBe(true);
    expect(socketManager.getUserSocketCount(user._id)).toBe(1);
    expect(socketManager.getOnlineCount()).toBeGreaterThanOrEqual(1);
  });
});

describe('Real-time delivery', () => {
  test('TC-UNIT-SOCK-05 delivers events to one user, a role and everyone [FR-017]', async () => {
    const user = await createStudent();
    const client = await connect({ token: tokenFor(user) });

    const direct = nextEvent(client, 'direct');
    socketManager.sendToUser(user._id.toString(), 'direct', { n: 1 });
    const role = nextEvent(client, 'role');
    socketManager.sendToRole('student', 'role', { n: 2 });
    const all = nextEvent(client, 'all');
    socketManager.broadcast('all', { n: 3 });

    await expect(direct).resolves.toEqual({ n: 1 });
    await expect(role).resolves.toEqual({ n: 2 });
    await expect(all).resolves.toEqual({ n: 3 });
  });

  test('TC-UNIT-SOCK-06 delivers course events only after joining the course room [FR-017]', async () => {
    const user = await createStudent();
    const client = await connect({ token: tokenFor(user) });
    client.emit('join-course', 'course-1');
    await new Promise((resolve) => setTimeout(resolve, 50));

    const received = nextEvent(client, 'course-news');
    socketManager.sendToCourse('course-1', 'course-news', { title: 'Week 2' });

    await expect(received).resolves.toEqual({ title: 'Week 2' });
    client.emit('leave-course', 'course-1');
  });

  test('TC-UNIT-SOCK-07 marks a notification read over the socket and confirms it to the user [FR-017]', async () => {
    const user = await createStudent();
    const notification = await Notification.create({ title: 'Live class', message: 'Starts at 7pm' });
    const client = await connect({ token: tokenFor(user) });

    const confirmed = nextEvent(client, 'notification:read-confirmed');
    client.emit('notification:read', notification._id.toString());
    await expect(confirmed).resolves.toEqual({ notificationId: notification._id.toString() });
    const reloaded = await Notification.findById(notification._id);

    expect(reloaded.readBy).toHaveLength(1);
    expect(reloaded.readBy[0].user.equals(user._id)).toBe(true);
  });

  test('TC-UNIT-SOCK-11 records a click on an unread notification over the socket [FR-017]', async () => {
    const user = await createStudent();
    const notification = await Notification.create({ title: 'Live class', message: 'Starts at 7pm' });
    const client = await connect({ token: tokenFor(user) });

    client.emit('notification:click', notification._id.toString());
    await new Promise((resolve) => setTimeout(resolve, 200));
    const reloaded = await Notification.findById(notification._id);

    expect(reloaded.deliveryStats.totalClicked).toBe(1);
    expect(reloaded.readBy).toHaveLength(1);
  });

  test('TC-UNIT-SOCK-08 marks every visible notification read for the user [FR-017]', async () => {
    const user = await createStudent();
    await Notification.create([
      { title: 'a', message: 'm', targetAudience: 'all' },
      { title: 'b', message: 'm', targetAudience: 'students' },
      { title: 'c', message: 'm', targetAudience: 'admins' },
    ]);
    const client = await connect({ token: tokenFor(user) });

    const confirmed = nextEvent(client, 'notification:all-read-confirmed');
    client.emit('notification:mark-all-read');

    await expect(confirmed).resolves.toEqual({ count: 2, unreadCount: 0 });
  });

  test('TC-UNIT-SOCK-09 forgets a user when their last socket disconnects [FR-017]', async () => {
    const user = await createStudent();
    const client = await connect({ token: tokenFor(user) });

    client.close();
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(socketManager.isUserOnline(user._id)).toBe(false);
  });
});

describe('Without a running Socket.IO server', () => {
  test('TC-UNIT-SOCK-10 delivery helpers are safe no-ops and getIO explains the problem [NFR-002]', () => {
    let isolated;
    jest.isolateModules(() => {
      isolated = require('../../../socket/socketManager');
    });

    expect(() => isolated.sendToUser('u', 'e', {})).not.toThrow();
    expect(() => isolated.sendToRole('student', 'e', {})).not.toThrow();
    expect(() => isolated.sendToCourse('c', 'e', {})).not.toThrow();
    expect(() => isolated.broadcast('e', {})).not.toThrow();
    expect(() => isolated.getIO()).toThrow('Socket.IO not initialized. Call initSocket first.');
  });
});
