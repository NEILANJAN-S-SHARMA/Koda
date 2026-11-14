import { KodaProject } from '../types/koda';

// Configured via environment variables; never hardcode localhost URLs across components.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiHealthStatus {
  status: 'ok' | 'offline_mock';
  mode: string;
  message: string;
}

/**
 * Phase 1 API Client Boilerplate for Koda FastAPI Backend.
 * TODO: Wire live fetch calls with error handling & optimistic state sync in Phase 2.
 */
export const kodaApi = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async checkHealth(): Promise<ApiHealthStatus> {
    if (!API_BASE_URL) {
      return {
        status: 'offline_mock',
        mode: 'local_scaffolding',
        message: 'VITE_API_BASE_URL not configured — running local UI scaffolding state.',
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'offline_mock',
        mode: 'local_scaffolding',
        message: 'Backend unreachable — using local project scaffolding.',
      };
    }
  },

  async listProjects(): Promise<KodaProject[]> {
    // TODO: Connect GET /api/projects when FastAPI server is running
    return [];
  },

  async startPipeline(projectId: string): Promise<{ queued: boolean; projectId: string }> {
    // TODO: Connect POST /api/projects/{projectId}/process
    return { queued: true, projectId };
  },

  async advancePipeline(projectId: string): Promise<{ advanced: boolean; projectId: string }> {
    // TODO: Connect POST /api/projects/{projectId}/advance
    return { advanced: true, projectId };
  },

  getExportBundleUrl(projectId: string): string {
    // TODO: Connect GET /api/projects/{projectId}/export in Phase 2
    return `${API_BASE_URL}/api/projects/${projectId}/export`;
  },
};
