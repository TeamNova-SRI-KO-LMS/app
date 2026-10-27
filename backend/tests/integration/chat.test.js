const ChatSession = require('../../models/ChatSession');
const ChatbotEngine = require('../../services/ChatbotEngine');
const { api, createStudent, createCourse, authHeader, tokenFor } = require('../helpers/factories');

describe('Support chat assistant', () => {
  test('TC-CHAT-01 answers a guest without saving a conversation [FR-021]', async () => {
    await createCourse({ title: 'Korean for Beginners', price: 15000 });

    const res = await api().post('/api/chat').send({ message: 'What courses do you offer?' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatchObject({ intent: 'courses' });
    expect(res.body.reply.text).toContain('Korean for Beginners');
    expect(await ChatSession.countDocuments()).toBe(0);
  });

  test('TC-CHAT-02 saves the conversation for a signed-in student and returns it as history [FR-021]', async () => {
    const student = await createStudent({ name: 'Nimali Perera' });

    await api().post('/api/chat').set(authHeader(student)).send({ message: 'hello' });
    await api().post('/api/chat').set(authHeader(student)).send({ message: 'contact details' });
    const history = await api().get('/api/chat/history').set(authHeader(student));

    expect(history.status).toBe(200);
    expect(history.body.messages.map((m) => m.sender)).toEqual(['user', 'ai', 'user', 'ai']);
    expect(history.body.messages[1].text).toContain('Annyeonghaseyo, Nimali!');
    expect(history.body.suggestions).toEqual(ChatbotEngine.suggestionsFor(student));
  });

  test('TC-CHAT-03 starting a new conversation archives the old one [FR-021]', async () => {
    const student = await createStudent();
    await api().post('/api/chat').set(authHeader(student)).send({ message: 'hi' });

    const cleared = await api().delete('/api/chat/history').set(authHeader(student));
    const history = await api().get('/api/chat/history').set(authHeader(student));

    expect(cleared.status).toBe(200);
    expect(history.body.messages).toEqual([]);
    expect(await ChatSession.countDocuments({ isActive: false })).toBe(1);
  });

  test('TC-CHAT-04 rejects empty and overlong messages [FR-021]', async () => {
    expect((await api().post('/api/chat').send({ message: '   ' })).status).toBe(400);
    expect((await api().post('/api/chat').send({})).status).toBe(400);
    expect((await api().post('/api/chat').send({ message: 'x'.repeat(501) })).status).toBe(400);
  });

  test('TC-CHAT-05 treats an expired token as a guest instead of failing [FR-021]', async () => {
    const student = await createStudent();

    const res = await api().post('/api/chat').set('Authorization', `Bearer ${tokenFor(student, { expiresIn: '-1s' })}`).send({ message: 'my attendance' });

    expect(res.status).toBe(200);
    expect(res.body.reply.text).toContain('Attendance is tracked for enrolled students');
  });

  test('TC-CHAT-06 limits each user to 20 messages per minute [FR-021][OWASP-A04]', async () => {
    const student = await createStudent();
    const statuses = [];

    for (let i = 0; i < 21; i += 1) {
      statuses.push((await api().post('/api/chat').set(authHeader(student)).send({ message: 'hi' })).status);
    }

    expect(statuses.slice(0, 20).every((status) => status === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });

  test('TC-CHAT-07 still answers when the conversation cannot be saved [NFR-002]', async () => {
    const student = await createStudent();
    jest.spyOn(ChatSession, 'findOneAndUpdate').mockImplementation(() => Promise.reject(new Error('write conflict')));

    const res = await api().post('/api/chat').set(authHeader(student)).send({ message: 'thanks' });

    expect(res.status).toBe(200);
    expect(res.body.reply.intent).toBe('thanks');
  });

  test('TC-CHAT-08 answers 500 if the assistant fails and requires sign-in for history [NFR-002]', async () => {
    jest.spyOn(ChatbotEngine, 'reply').mockRejectedValue(new Error('engine crashed'));

    const res = await api().post('/api/chat').send({ message: 'hello' });

    expect(res.status).toBe(500);
    expect((await api().get('/api/chat/history')).status).toBe(401);
  });
});
