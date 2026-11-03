import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FloatingAiSupport from '../../components/FloatingAiSupport';
import { clearChatHistory, fetchChatHistory, sendChatMessage } from '../../services/chatService';

const auth = vi.hoisted(() => ({ user: null }));
vi.mock('../../context/useAuth', () => ({ default: () => auth }));
vi.mock('../../services/chatService', async (importOriginal) => ({
  ...(await importOriginal()),
  sendChatMessage: vi.fn(),
  fetchChatHistory: vi.fn(),
  clearChatHistory: vi.fn(),
}));

const renderWidget = (path = '/') => render(
  <MemoryRouter initialEntries={[path]}>
    <FloatingAiSupport />
  </MemoryRouter>,
);

// Opens the chat and waits for the conversation to load
const openChat = async (loaded = /Welcome to SRI-KO Foreign Language Training Center/) => {
  fireEvent.click(screen.getByRole('button', { name: 'Chat with AI' }));
  await screen.findByText(loaded);
  return screen.getByRole('dialog', { name: 'SRI-KO AI Support chat' });
};

describe('Support assistant widget', () => {
  // jsdom has no element scrolling; the widget scrolls its message list
  beforeAll(() => {
    Element.prototype.scrollTo = () => {};
  });

  afterAll(() => {
    delete Element.prototype.scrollTo;
  });

  beforeEach(() => {
    sessionStorage.clear();
    auth.user = null;
  });

  test('TC-FE-CMP-13 the chat window can be enlarged and made smaller again [FR-021]', async () => {
    renderWidget();
    const dialog = await openChat();

    expect(dialog).toHaveAttribute('data-size', 'small');
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge chat' }));
    expect(dialog).toHaveAttribute('data-size', 'large');
    expect(localStorage.getItem('sriko-chat-size')).toBe('large');

    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chat with AI' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'large');

    fireEvent.click(screen.getByRole('button', { name: 'Make chat smaller' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'small');
    expect(localStorage.getItem('sriko-chat-size')).toBe('small');
  });

  test('TC-FE-CMP-14 reopens at the size chosen last time [FR-021]', async () => {
    localStorage.setItem('sriko-chat-size', 'large');
    renderWidget();

    expect(await openChat()).toHaveAttribute('data-size', 'large');
  });

  test('TC-FE-CMP-15 asks a starter question and shows the answer, links and follow-ups [FR-021]', async () => {
    sendChatMessage.mockResolvedValue({
      text: "I'm the SRI-KO assistant.", links: [{ label: 'Browse courses', to: '/courses' }], suggestions: ['How do I enroll?'], meta: {},
    });
    renderWidget();
    await openChat();

    fireEvent.click(screen.getByRole('button', { name: 'What can you do?' }));

    expect(await screen.findByText("I'm the SRI-KO assistant.")).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith('What can you do?', { courseId: undefined });
    expect(screen.getByRole('button', { name: /Browse courses/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How do I enroll?' })).toBeInTheDocument();
  });

  test('TC-FE-CMP-16 offers the question again when the assistant cannot be reached [NFR-002]', async () => {
    sendChatMessage.mockRejectedValue(new Error('offline'));
    renderWidget();
    await openChat();

    const input = screen.getByLabelText('Message SRI-KO AI Support');
    fireEvent.change(input, { target: { value: 'my attendance' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText(/couldn't reach the SRI-KO assistant/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'my attendance' })).toBeInTheDocument();
  });

  test('TC-FE-CMP-17 shows a signed-in student\'s saved conversation and starts a new one [FR-021]', async () => {
    auth.user = { _id: 'student-1', name: 'Nimali Perera', role: 'student' };
    fetchChatHistory.mockResolvedValue({
      messages: [
        { id: 'm1', sender: 'user', text: 'my attendance', timestamp: '2026-10-27T08:00:00Z' },
        { id: 'm2', sender: 'ai', text: 'Attendance rate: 90%', links: [], timestamp: '2026-10-27T08:00:01Z' },
      ],
      suggestions: ['My assignments'],
    });
    clearChatHistory.mockResolvedValue({ success: true });
    renderWidget();

    await openChat('Attendance rate: 90%');
    expect(screen.getByRole('button', { name: 'My assignments' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start a new conversation' }));

    expect(await screen.findByText(/Annyeonghaseyo, Nimali!/)).toBeInTheDocument();
    expect(screen.queryByText('Attendance rate: 90%')).not.toBeInTheDocument();
    expect(clearChatHistory).toHaveBeenCalledTimes(1);
  });

  test('TC-FE-CMP-18 stays hidden on the admin portal [FR-009]', () => {
    renderWidget('/admin/dashboard');

    expect(screen.queryByRole('button', { name: 'Chat with AI' })).not.toBeInTheDocument();
  });
});
