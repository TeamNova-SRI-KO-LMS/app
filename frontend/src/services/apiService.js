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
		if (token && token !== 'undefined' && token !== 'null') {
			return token;
		}
	}

	try {
		const sessionStr = localStorage.getItem('auth-session');
		if (sessionStr) {
			const parsed = JSON.parse(sessionStr);
			if (parsed?.token && parsed.token !== 'undefined' && parsed.token !== 'null') {
				return parsed.token;
			}
		}
	} catch {}

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
	localStorage.removeItem('auth-session'); // also clear the persisted session
};

export const apiClient = axios.create({
	baseURL: apiUrl,
	timeout: 30000,
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

		if (config.data instanceof FormData) {
			delete config.headers['Content-Type'];
		}

		return config;
	},
	(error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			// Clear persisted auth state so the next page load starts fresh.
			// Do NOT do window.location.href here — that causes a full page reload
			// and a redirect loop. The AuthProvider's .catch() dispatches LOGOUT
			// which lets React Router handle the redirect cleanly.
			clearAuthState();
		}

		return Promise.reject(error);
	}
);

const apiService = {
	client: apiClient,

	async login(credentials) {
		const response = await apiClient.post('/auth/login', credentials);
		return response.data;
	},

	async register(userData) {
		const response = await apiClient.post('/auth/register', userData);
		return response.data;
	},

	async getCurrentUser() {
		const response = await apiClient.get('/auth/me');
		return response.data;
	},

	get(url, config = {}) {
		return apiClient.get(url, config);
	},

	post(url, data, config = {}) {
		return apiClient.post(url, data, config);
	},

	put(url, data, config = {}) {
		return apiClient.put(url, data, config);
	},

	patch(url, data, config = {}) {
		return apiClient.patch(url, data, config);
	},

	delete(url, config = {}) {
		return apiClient.delete(url, config);
	},
};

export default apiService;
