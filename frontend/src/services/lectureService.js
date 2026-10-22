import { apiClient, getAuthToken } from './apiService';
import apiUrl from '../config/apiConfig';
import axios from 'axios';

const lectureService = {
  // Get all lecture materials for a course
  getCourseMaterials: async (courseId) => {
    const res = await apiClient.get(`/lectures/course/${courseId}`);
    return res.data;
  },

  // Get single lecture material
  getMaterialById: async (id) => {
    const res = await apiClient.get(`/lectures/${id}`);
    return res.data;
  },

  // Upload lecture material (video, pdf, image) to Supabase Storage with progress tracking
  uploadMaterial: async (formData, onProgress) => {
    const token = getAuthToken();
    const response = await axios.post(`${apiUrl}/lectures/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 300000, // 5 minutes timeout for Supabase Storage uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Upload course thumbnail to Supabase Storage
  uploadThumbnail: async (file, onProgress) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await axios.post(`${apiUrl}/lectures/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Add external link resource (e.g. YouTube video or external link)
  addExternalLink: async (payload) => {
    const res = await apiClient.post('/lectures/link', payload);
    return res.data;
  },

  // Delete lecture material from Supabase Storage & MongoDB
  deleteMaterial: async (id) => {
    const res = await apiClient.delete(`/lectures/${id}`);
    return res.data;
  },
};

export default lectureService;
