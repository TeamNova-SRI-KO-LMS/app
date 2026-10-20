import { apiClient, getAuthToken } from './apiService';
import apiUrl from '../config/apiConfig';
import axios from 'axios';

const assignmentService = {
  // Create an assignment
  createAssignment: async (payload) => {
    const res = await apiClient.post('/assignments', payload);
    return res.data;
  },

  // Get assignments for a course
  getCourseAssignments: async (courseId) => {
    const res = await apiClient.get(`/assignments/course/${courseId}`);
    return res.data;
  },

  // Get single assignment
  getAssignmentById: async (id) => {
    const res = await apiClient.get(`/assignments/${id}`);
    return res.data;
  },

  // Submit student files to Google Drive with progress tracking
  submitAssignment: async (assignmentId, formData, onProgress) => {
    const token = getAuthToken();
    const response = await axios.post(`${apiUrl}/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 300000, // 5 min for multiple files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  // Get current user's submission for an assignment
  getMySubmission: async (assignmentId) => {
    const res = await apiClient.get(`/assignments/${assignmentId}/my-submission`);
    return res.data;
  },

  // Admin: Get all student submissions for an assignment
  getAllSubmissions: async (assignmentId) => {
    const res = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return res.data;
  },

  // Admin: Grade a submission
  gradeSubmission: async (submissionId, gradeData) => {
    const res = await apiClient.patch(`/assignments/submissions/${submissionId}/grade`, gradeData);
    return res.data;
  },

  // Admin: Delete assignment
  deleteAssignment: async (assignmentId) => {
    const res = await apiClient.delete(`/assignments/${assignmentId}`);
    return res.data;
  },
};

export default assignmentService;
