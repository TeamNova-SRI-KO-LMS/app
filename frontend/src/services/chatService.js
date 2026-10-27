import { apiClient } from './apiService';

/**
 * Ask the SRI-KO assistant a question. Works for guests; when the user is signed in
 * the answer is personalized (their courses, attendance) and saved to their history.
 * @param {string} message
 * @param {{ courseId?: string }} [context]  course discussed in the previous answer
 * @returns {Promise<{ text: string, suggestions: string[], links: {label: string, to: string}[], meta: object, intent: string, timestamp: string }>}
 */
export const sendChatMessage = async (message, context = {}) => {
  const response = await apiClient.post('/chat', { message, context });
  return response.data.reply;
};

/** The signed-in user's saved conversation: { messages, suggestions } */
export const fetchChatHistory = async () => {
  const response = await apiClient.get('/chat/history');
  return response.data;
};

/** Start a new conversation for the signed-in user. */
export const clearChatHistory = async () => {
  const response = await apiClient.delete('/chat/history');
  return response.data;
};

// Same starter suggestions as the server (ChatbotEngine.suggestionsFor)
export const GUEST_SUGGESTIONS = ['What can you do?', 'What courses do you offer?', 'How much are the courses?', 'How do I enroll?'];
export const STUDENT_SUGGESTIONS = ['What can you do?', 'My courses and progress', 'My assignments', 'My attendance'];
