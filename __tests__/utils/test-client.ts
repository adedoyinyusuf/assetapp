import path from 'path';
import { URL } from 'url';
import { prismaMock } from '../__mocks__/prisma';

// In-memory data store to back prismaMock implementations
const store = {
  verificationCampaign: [] as any[],
  verificationAssignment: [] as any[],
  assetVerification: [] as any[],
  state: [] as any[],
  category: [] as any[],
  lGA: [] as any[],
  user: [] as any[],
  auditLog: [] as any[],
  _counters: {
    verificationCampaign: 1,
    verificationAssignment: 1,
    assetVerification: 1,
    state: 1,
    category: 1,
    lGA: 1,
    user: 1,
    auditLog: 1,
  },
};

// Helper to deep clone simple objects
const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

// Apply implementations to prismaMock using our in-memory store
export function initInMemoryPrisma() {
  // Users
  prismaMock.user.findUnique.mockImplementation(async (args: any) => {
    const id = args?.where?.id;
    const user = store.user.find((u) => u.id === id);
    if (!user) return null;
    // Build role + permissions if requested
    if (args?.include?.role) {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      const rolePermissions = perms.map((p: string) => {
        const normalized = p.replace(':', '.');
        const [resource, action] = normalized.split('.');
        return {
          permission: {
            resource,
            action,
            name: `${resource}:${action}`,
          },
        };
      });
      // DEBUG: Log generated permissions
      console.error(`[MockUser] ID ${id} Permissions:`, JSON.stringify(rolePermissions, null, 2));

      return clone({
        ...user,
        role: { permissions: rolePermissions },
      });
    }
    return clone(user);
  });

  // Transaction mock
  prismaMock.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return callback(prismaMock);
    }
    return callback; // If it's an array of promises
  });
  prismaMock.user.create?.mockImplementation(async ({ data }: any) => {
    const user = { id: store._counters.user++, isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data };
    store.user.push(user);
    return clone(user);
  });

  // States / Categories / LGAs
  prismaMock.state.findMany.mockImplementation(async (args: any) => {
    const ids = args?.where?.id?.in || [];
    return clone(store.state.filter((s) => ids.includes(s.id)));
  });
  prismaMock.state.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.state++;
    const record = { id, ...data };
    store.state.push(record);
    return clone(record);
  });

  prismaMock.category.findMany.mockImplementation(async (args: any) => {
    const ids = args?.where?.id?.in || [];
    return clone(store.category.filter((c) => ids.includes(c.id)));
  });
  prismaMock.category.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.category++;
    const record = { id, ...data };
    store.category.push(record);
    return clone(record);
  });

  prismaMock.lGA.findMany.mockImplementation(async (args: any) => {
    const ids = args?.where?.id?.in || [];
    return clone(store.lGA.filter((l) => ids.includes(l.id)));
  });
  prismaMock.lGA.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.lGA++;
    const record = { id, ...data };
    store.lGA.push(record);
    return clone(record);
  });

  // Assets
  prismaMock.asset.findUnique.mockImplementation(async (args: any) => {
    // We assume assets are static or we can mock a few known ones
    const id = args?.where?.id;
    // Return a dummy asset if ID matches what we expect in tests (e.g. 100)
    if (id === 100 || id === 101) {
      return {
        id,
        name: `Test Asset ${id}`,
        serialNumber: `SN-${id}`,
        category: { id: 5, name: 'Furniture' },
        state: { id: 1, name: 'Lagos' },
        lga: { id: 10, name: 'Ikeja' },
        // Add other required fields if necessary
      };
    }
    return null;
  });

  prismaMock.asset.count.mockImplementation(async (_args: any) => {
    // For simplicity in tests, return 0 unless assets are seeded separately
    return 0;
  });

  // VerificationCampaign
  prismaMock.verificationCampaign.create.mockImplementation(async ({ data, include }: any) => {
    const id = store._counters.verificationCampaign++;
    const record = {
      id,
      name: data.name,
      description: data.description ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status ?? 'DRAFT',
      createdBy: data.createdBy,
      assignedStates: data.assignedStates ?? data.stateIds ?? [],
      assignedLgas: data.assignedLgas ?? data.lgaIds ?? [],
      assignedCategories: data.assignedCategories ?? data.categoryIds ?? [],
      targetAssetCount: data.targetAssetCount ?? 0,
      instructions: data.instructions ?? null,
      metadata: data.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.verificationCampaign.push(record);

    let result: any = clone(record);
    if (include?.creator?.select) {
      const user = store.user.find((u) => u.id === record.createdBy);
      if (user) {
        result.creator = {
          id: user.id,
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          email: user.email,
        };
      }
    }
    if (include?._count?.select) {
      const verifications = store.assetVerification.filter((v) => v.campaignId === record.id).length;
      const assignments = store.verificationAssignment.filter((a) => a.campaignId === record.id).length;
      result._count = { verifications, assignments };
    }
    return result;
  });

  // AuditLog
  prismaMock.auditLog.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.auditLog++;
    const record = { id, ...data, timestamp: new Date() };
    store.auditLog.push(record);
    return clone(record);
  });

  prismaMock.verificationCampaign.createMany.mockImplementation(async ({ data }: any) => {
    const arr = Array.isArray(data) ? data : [data];
    arr.forEach((d) => {
      prismaMock.verificationCampaign.create({ data: d });
    });
    return { count: arr.length };
  });

  prismaMock.verificationCampaign.findMany.mockImplementation(async (args: any) => {
    let results = [...store.verificationCampaign];
    const where = args?.where || {};
    // Helper to check if a record matches a specific filter object
    const matchesFilter = (record: any, filter: any): boolean => {
      if (!filter || Object.keys(filter).length === 0) return true;

      // Handle AND
      if (filter.AND) {
        const conditions = Array.isArray(filter.AND) ? filter.AND : [filter.AND];
        return conditions.every((cond: any) => matchesFilter(record, cond));
      }
      // Handle OR (for search)
      if (filter.OR) {
        const conditions = Array.isArray(filter.OR) ? filter.OR : [filter.OR];
        return conditions.some((cond: any) => matchesFilter(record, cond));
      }

      // Handle specific fields
      for (const key of Object.keys(filter)) {
        if (key === 'AND' || key === 'OR') continue;
        const value = filter[key];
        if (value === undefined) continue;

        const recordValue = record[key];

        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          if (value.in) {
            if (!value.in.includes(recordValue)) return false;
          } else if (value.contains) {
            if (!String(recordValue || '').toLowerCase().includes(value.contains.toLowerCase())) return false;
          } else if (value.equals) {
            if (recordValue !== value.equals) return false;
          }
        } else {
          if (recordValue !== value) return false;
        }
      }
      return true;
    };

    results = results.filter(record => matchesFilter(record, where));
    // Pagination
    const skip = args?.skip || 0;
    const take = args?.take || results.length;
    results = results.slice(skip, skip + take);

    // Include support
    if (args?.include?._count?.select) {
      results = results.map((record) => {
        const verifications = store.assetVerification.filter((v) => v.campaignId === record.id).length;
        const assignments = store.verificationAssignment.filter((a) => a.campaignId === record.id).length;
        return { ...record, _count: { verifications, assignments } };
      });
    }
    if (args?.include?.creator?.select) {
      results = results.map((record) => {
        const user = store.user.find((u) => u.id === record.createdBy);
        if (!user) return record;
        return {
          ...record,
          creator: {
            id: user.id,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email,
          },
        };
      });
    }

    return clone(results);
  });

  prismaMock.verificationCampaign.count.mockImplementation(async ({ where }: any) => {
    let results = [...store.verificationCampaign];
    if (where?.status) {
      const statuses = where.status.in || [where.status];
      results = results.filter((c) => statuses.includes(c.status));
    }
    if (where?.createdBy) {
      results = results.filter((c) => c.createdBy === where.createdBy);
    }
    return results.length;
  });

  prismaMock.verificationCampaign.findFirst.mockImplementation(async (args: any) => {
    let results = [...store.verificationCampaign];
    const where = args?.where || {};

    if (where.name) {
      // Direct name match (case sensitive or insensitive depending on args, but keeping simple for now)
      results = results.filter((c) => c.name === where.name);
    }

    if (results.length > 0) return clone(results[0]);
    return null;
  });

  prismaMock.verificationCampaign.findUnique.mockImplementation(async (args: any) => {
    const id = args?.where?.id;
    const record = store.verificationCampaign.find((c) => c.id === id);
    if (!record) return null;
    let result: any = { ...record };

    if (args?.include?.assignments) {
      result.assignments = store.verificationAssignment.filter((a) => a.campaignId === id);
    }

    // Add _count support which is key for getting stats
    if (args?.include?._count) {
      const verifications = store.assetVerification.filter((v) => v.campaignId === id).length;
      const assignments = store.verificationAssignment.filter((a) => a.campaignId === id).length;
      result._count = { verifications, assignments };
    }

    return clone(result);
  });

  prismaMock.verificationCampaign.update.mockImplementation(async ({ where, data }: any) => {
    const id = where?.id;
    const idx = store.verificationCampaign.findIndex((c) => c.id === id);
    if (idx === -1) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
    const updated = { ...store.verificationCampaign[idx], ...data, updatedAt: new Date() };
    store.verificationCampaign[idx] = updated;
    return clone(updated);
  });

  prismaMock.verificationCampaign.delete.mockImplementation(async ({ where }: any) => {
    const id = where?.id;
    const idx = store.verificationCampaign.findIndex((c) => c.id === id);
    if (idx === -1) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
    const [removed] = store.verificationCampaign.splice(idx, 1);
    return clone(removed);
  });

  prismaMock.verificationCampaign.deleteMany.mockImplementation(async ({ where }: any) => {
    if (where?.name?.startsWith) {
      const prefix = where.name.startsWith;
      const before = store.verificationCampaign.length;
      store.verificationCampaign = store.verificationCampaign.filter((c) => !String(c.name || '').startsWith(prefix));
      return { count: before - store.verificationCampaign.length };
    }
    return { count: 0 };
  });

  // Assignments
  prismaMock.verificationAssignment.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.verificationAssignment++;
    const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    store.verificationAssignment.push(record);
    return clone(record);
  });

  prismaMock.verificationAssignment.findMany.mockImplementation(async (args: any) => {
    let results = [...store.verificationAssignment];
    const where = args?.where || {};

    if (where.userId) results = results.filter(a => a.userId === where.userId);
    if (where.campaignId) results = results.filter(a => a.campaignId === where.campaignId);
    if (where.status) results = results.filter(a => a.status === where.status);

    if (args?.include?.campaign) {
      results = results.map(a => {
        const campaign = store.verificationCampaign.find(c => c.id === a.campaignId);
        return {
          ...a,
          campaign: campaign || null
        };
      });
    }

    return clone(results);
  });

  // Asset Verifications
  prismaMock.assetVerification.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.assetVerification++;
    const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    store.assetVerification.push(record);
    return clone(record);
  });

  // Mock groupBy for AssetVerification
  prismaMock.assetVerification.groupBy.mockImplementation(async (args: any) => {
    const by = args?.by || []; // e.g. ['status']
    const where = args?.where || {};

    let filtered = [...store.assetVerification];
    if (where.campaignId) {
      filtered = filtered.filter(v => v.campaignId === where.campaignId);
    }

    // Minimal grouping logic for status
    if (by.includes('status')) {
      const groups: any[] = [];
      const statusMap = new Map<string, number>();
      filtered.forEach(v => {
        const s = v.status;
        statusMap.set(s, (statusMap.get(s) || 0) + 1);
      });

      statusMap.forEach((count, status) => {
        groups.push({
          status,
          _count: { _all: count }
        });
      });
      return groups;
    }
    return [];
  });

  prismaMock.assetVerification.count.mockImplementation(async ({ where }: any) => {
    let results = [...store.assetVerification];
    if (where?.campaignId) {
      results = results.filter((v) => v.campaignId === where.campaignId);
    }
    if (where?.status?.in) {
      results = results.filter((v) => where.status.in.includes(v.status));
    }
    return results.length;
  });
}

export function resetDbStore() {
  store.verificationCampaign = [];
  store.verificationAssignment = [];
  store.assetVerification = [];
  store.state = [];
  store.category = [];
  store.lGA = [];
  store.user = [];
  store.auditLog = [];
  store._counters = {
    verificationCampaign: 1,
    verificationAssignment: 1,
    assetVerification: 1,
    state: 1,
    category: 1,
    lGA: 1,
    user: 1,
    auditLog: 1,
  } as any;
}

// Minimal NextRequest mock used by route handlers
class MockNextRequest {
  url: string;
  headers: { get: (name: string) => string | null };
  private body: any;
  constructor(url: string, headers: Record<string, string>, body?: any) {
    this.url = url;
    const normalized: Record<string, string> = {};
    Object.entries(headers || {}).forEach(([k, v]) => { normalized[k.toLowerCase()] = String(v); });
    this.headers = {
      get: (name: string) => normalized[name.toLowerCase()] ?? null,
    };
    this.body = body;
  }
  async json() { return this.body; }
}

// Resolve route file path from URL string
function resolveRouteFile(url: string): string {
  const u = new URL(url, 'http://localhost');
  const pathname = u.pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'api') throw new Error(`Unsupported base path: ${pathname}`);
  const sub = segments.slice(1); // e.g., ['stock-verification','campaigns', '123', 'actions']
  const parts: string[] = [];

  for (let i = 0; i < sub.length; i++) {
    const s = sub[i];

    // Handle 'campaigns' dynamic routes
    if (s === 'campaigns' && i + 1 < sub.length) {
      parts.push('campaigns');
      const next = sub[i + 1];
      if (next && !next.includes('.')) {
        // dynamic id segment
        parts.push('[id]');
        i++; // skip id

        // Handle sub-resources
        if (i + 1 < sub.length) {
          const subRes = sub[i + 1];
          if (['actions', 'assignments'].includes(subRes)) {
            parts.push(subRes);
            i++;
          }
        }
        continue;
      }
      continue;
    }

    // Handle 'users' dynamic routes
    if (s === 'users' && i + 1 < sub.length) {
      parts.push('users');
      const next = sub[i + 1];
      if (next && !next.includes('.')) {
        // dynamic id segment
        parts.push('[id]');
        i++; // skip id

        // Handle sub-resources
        if (i + 1 < sub.length) {
          const subRes = sub[i + 1];
          if (['assignments'].includes(subRes)) {
            parts.push(subRes);
            i++;
          }
        }
        continue;
      }
      continue;
    }

    parts.push(s);
  }

  const relative = path.join('app', 'api', ...parts, 'route.ts');
  return path.join(process.cwd(), relative);
}

// Helper to extract params from URL for known routes
function extractParams(url: string): { params: Record<string, string> } {
  const u = new URL(url, 'http://localhost');
  const path = u.pathname;

  // Pattern: /api/stock-verification/campaigns/:id
  const campaignMatch = path.match(/\/api\/stock-verification\/campaigns\/([^\/]+)(?:\/.*)?$/);
  if (campaignMatch && campaignMatch[1] && campaignMatch[1] !== 'route.ts') {
    return { params: { id: campaignMatch[1] } };
  }

  // Pattern: /api/stock-verification/users/:id
  const userMatch = path.match(/\/api\/stock-verification\/users\/([^\/]+)(?:\/.*)?$/);
  if (userMatch && userMatch[1]) {
    return { params: { id: userMatch[1] } };
  }

  return { params: {} };
}

// Execute route handler and normalize response
async function executeRoute(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, headers: Record<string, string>, body?: any) {
  // Expose headers to mocked getServerSession
  (global as any).__CURRENT_REQUEST_HEADERS = headers || {};

  // Force patch next-auth in require cache
  try {
    const nextAuthPath = require.resolve('next-auth');
    require.cache[nextAuthPath] = {
      id: nextAuthPath,
      filename: nextAuthPath,
      loaded: true,
      exports: {
        getServerSession: async () => {
          // Direct read from global since we are inside the forced mock
          const reqHeaders = (global as any).__CURRENT_REQUEST_HEADERS || {};
          const auth = reqHeaders['authorization'] || reqHeaders['Authorization'];
          if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
            const id = auth.split(' ')[1];
            return { user: { id } };
          }
          return null;
        }
      }
    } as any;
  } catch (e) {
    console.warn('Failed to patch next-auth in test client:', e);
  }

  const file = resolveRouteFile(url);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(file);
  const handler = mod[method];
  if (typeof handler !== 'function') throw new Error(`No handler for ${method} at ${url}`);

  const req = new MockNextRequest(url, headers || {}, body);
  const context = extractParams(url);

  const res = await handler(req, context);
  // Response normalization
  let status = (res as any)?.status || 200;
  let bodyOut: any = null;
  try {
    if (typeof (res as any)?.json === 'function') {
      bodyOut = await (res as any).json();
    } else {
      bodyOut = res;
    }
  } catch {
    bodyOut = null;
  }
  return { status, body: bodyOut };
}

// Chainable request builder similar to supertest
class RequestBuilder {
  private _method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  private _url: string;
  private _headers: Record<string, string> = {};
  private _body: any;
  private _query: Record<string, any> | undefined;
  constructor(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string) {
    this._method = method;
    this._url = url;
  }
  set(headers: Record<string, string>) { this._headers = { ...this._headers, ...(headers || {}) }; return this; }
  send(body: any) { this._body = body; return this; }
  query(q: Record<string, any>) { this._query = q; return this; }
  async expect(status: number) {
    let url = this._url;
    if (this._query) {
      const usp = new URL(url, 'http://localhost');
      Object.entries(this._query).forEach(([k, v]) => usp.searchParams.set(k, String(v)));
      url = usp.toString();
    }
    const response = await executeRoute(this._method, url, this._headers, this._body);
    if (response.status !== status) {
      console.error('Request failed:', this._method, url);
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      throw new Error(`Expected status ${status} but got ${response.status}`);
    }
    return response;
  }
}

const testClient = {
  get: (url: string) => new RequestBuilder('GET', url),
  post: (url: string) => new RequestBuilder('POST', url),
  put: (url: string) => new RequestBuilder('PUT', url),
  delete: (url: string) => new RequestBuilder('DELETE', url),
  db: prismaMock,
  store,
};

// Initialize mocks immediately
initInMemoryPrisma();

// Add missing auditLog mock
prismaMock.auditLog.findMany.mockResolvedValue([]);

export { testClient };

export type TestDBStore = typeof store;