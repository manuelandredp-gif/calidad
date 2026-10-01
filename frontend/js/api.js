// ==========================================================================
// API REST Client - TestGenAI
// ==========================================================================

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('testgenai_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('testgenai_token', token);
    } else {
      localStorage.removeItem('testgenai_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = (typeof data === 'object' && (data?.error || data?.message)) || data || `Error HTTP ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request('/health');
  }

  async getDbHealth() {
    return this.request('/health/db');
  }

  // Auth
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async register(email, password, fullName, role = 'QA_TESTER') {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(payload) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProject(id, payload) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Requirements
  async getRequirements(projectId) {
    return this.request(`/requirements/project/${projectId}`);
  }

  async getRequirement(id) {
    return this.request(`/requirements/${id}`);
  }

  async createRequirement(payload) {
    return this.request('/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateRequirement(id, payload) {
    return this.request(`/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteRequirement(id) {
    return this.request(`/requirements/${id}`, {
      method: 'DELETE',
    });
  }

  async importRequirements(projectId, requirements) {
    return this.request('/requirements/import', {
      method: 'POST',
      body: JSON.stringify({ projectId, requirements }),
    });
  }

  // AI Generation
  async generateAiTests(payload) {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAiHistory(requirementId) {
    return this.request(`/ai/history/${requirementId}`);
  }

  // Heuristics Engine (Offline ISTQB)
  async generateHeuristicTests(payload) {
    return this.request('/heuristics/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Test Cases & Manual Design
  async getTestCases(requirementId) {
    return this.request(`/test-cases/requirement/${requirementId}`);
  }

  async getProjectTestCases(projectId) {
    return this.request(`/test-cases/project/${projectId}`);
  }

  async createTestCaseManual(payload) {
    return this.request('/test-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTestCase(id, payload) {
    return this.request(`/test-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTestCase(id) {
    return this.request(`/test-cases/${id}`, {
      method: 'DELETE',
    });
  }

  async cloneTestCase(id) {
    return this.request(`/test-cases/${id}/clone`, {
      method: 'POST',
    });
  }

  async batchReviewTestCases(ids, decision = 'APPROVED', comments = '') {
    return this.request('/test-cases/batch-review', {
      method: 'PATCH',
      body: JSON.stringify({ ids, decision, comments }),
    });
  }

  async reviewTestCase(id, reviewData) {
    const payload = {
      decision: reviewData.decision || reviewData.reviewStatus || 'APPROVED',
      comments: reviewData.comments,
      ...reviewData,
    };
    delete payload.reviewStatus;
    return this.request(`/test-cases/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Traceability & Metrics
  async getTraceability(projectId) {
    return this.request(`/traceability/${projectId}`);
  }

  async getMetrics(projectId) {
    return this.request(`/metrics/project/${projectId}`);
  }

  // Export URL helper
  getExportUrl(projectId, format = 'csv', onlyApproved = false) {
    return `${API_BASE}/export/${projectId}?format=${format}&onlyApproved=${onlyApproved}`;
  }
}

export const api = new ApiClient();
