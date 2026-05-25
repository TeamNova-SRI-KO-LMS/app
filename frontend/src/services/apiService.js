import apiUrl from '../config/apiConfig';
import axios from 'axios';

const AUTH_TOKEN_KEYS = ['adminToken', 'token'];

const isBrowser = typeof window !== 'undefined';

export const getAuthToken = () => {
	if (!isBrowser) {
		return null;
	}

	for (const key of AUTH_TOKEN_KEYS) {
		const token = localStorage.getItem(key);
		if (token) {
			return token;
		}
	}

	return null;
};

const clearAuthState = () => {
	if (!isBrowser) {
		return;
	}

	localStorage.removeItem('token');
	localStorage.removeItem('adminToken');
	localStorage.removeItem('user');
	localStorage.removeItem('adminUser');
};

export const apiClient = axios.create({
	baseURL: apiUrl,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use(
	(config) => {
		const token = getAuthToken();

		if (token) {
			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			clearAuthState();

			if (isBrowser) {
				window.location.href = '/login';
			}
		}

		return Promise.reject(error);
	}
);

const apiService = {
	client: apiClient,

	get(url, config = {}) {
		return apiClient.get(url, config);
	},

	post(url, data, config = {}) {
		return apiClient.post(url, data, config);
	},

	put(url, data, config = {}) {
		return apiClient.put(url, data, config);
	},

	delete(url, config = {}) {
		return apiClient.delete(url, config);
	},
};

export default apiService;
