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
      return clone({
        ...user,
        role: { permissions: rolePermissions },
      });
    }
    return clone(user);
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
  prismaMock.category.findMany.mockImplementation(async (args: any) => {
    const ids = args?.where?.id?.in || [];
    return clone(store.category.filter((c) => ids.includes(c.id)));
  });
  prismaMock.lGA.findMany.mockImplementation(async (args: any) => {
    const ids = args?.where?.id?.in || [];
    return clone(store.lGA.filter((l) => ids.includes(l.id)));
  });

  // Assets (basic count only)
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
    if (where.status) {
      const statuses = where.status.in || [where.status];
      results = results.filter((c) => statuses.includes(c.status));
    }
    if (where.createdBy) {
      results = results.filter((c) => c.createdBy === where.createdBy);
    }
    if (where.OR) {
      const search = where.OR.find((cond: any) => cond.name?.contains || cond.description?.contains);
      if (search) {
        const term = (search.name?.contains || search.description?.contains || '').toLowerCase();
        results = results.filter((c) => (c.name?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)));
      }
    }
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

  prismaMock.verificationCampaign.findUnique.mockImplementation(async (args: any) => {
    const id = args?.where?.id;
    const record = store.verificationCampaign.find((c) => c.id === id);
    if (!record) return null;
    let result: any = { ...record };
    if (args?.include?.assignments) {
      result.assignments = store.verificationAssignment.filter((a) => a.campaignId === id);
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

  // Asset Verifications
  prismaMock.assetVerification.create.mockImplementation(async ({ data }: any) => {
    const id = store._counters.assetVerification++;
    const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    store.assetVerification.push(record);
    return clone(record);
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
    if (s === 'campaigns' && i + 1 < sub.length) {
      parts.push('campaigns');
      const next = sub[i + 1];
      if (next && next !== 'route.ts' && next !== 'actions' && !next.includes('.')) {
        // dynamic id segment
        parts.push('[id]');
        i++; // skip next
        if (i + 1 < sub.length && sub[i + 1] === 'actions') {
          parts.push('actions');
          i++;
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

// Execute route handler and normalize response
async function executeRoute(method: 'GET'|'POST'|'PUT'|'DELETE', url: string, headers: Record<string,string>, body?: any) {
  // Expose headers to mocked getServerSession
  (global as any).__CURRENT_REQUEST_HEADERS = headers || {};

  const file = resolveRouteFile(url);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(file);
  const handler = mod[method];
  if (typeof handler !== 'function') throw new Error(`No handler for ${method} at ${url}`);
  const req = new MockNextRequest(url, headers || {}, body);
  const res = await handler(req);
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
  private _method: 'GET'|'POST'|'PUT'|'DELETE';
  private _url: string;
  private _headers: Record<string,string> = {};
  private _body: any;
  private _query: Record<string, any> | undefined;
  constructor(method: 'GET'|'POST'|'PUT'|'DELETE', url: string) {
    this._method = method;
    this._url = url;
  }
  set(headers: Record<string,string>) { this._headers = { ...this._headers, ...(headers || {}) }; return this; }
  send(body: any) { this._body = body; return this; }
  query(q: Record<string, any>) { this._query = q; return this; }
  async expect(status: number) {
    let url = this._url;
    if (this._query) {
      const usp = new URL(url, 'http://localhost');
      Object.entries(this._query).forEach(([k,v]) => usp.searchParams.set(k, String(v)));
      url = usp.toString();
    }
    const response = await executeRoute(this._method, url, this._headers, this._body);
    if (response.status !== status) {
      throw new Error(`Expected status ${status} but got ${response.status}`);
    }
    return response;
  }
}

export const testClient = {
  get: (url: string) => new RequestBuilder('GET', url),
  post: (url: string) => new RequestBuilder('POST', url),
  put: (url: string) => new RequestBuilder('PUT', url),
  delete: (url: string) => new RequestBuilder('DELETE', url),
  db: prismaMock,
  store,
};

export type TestDBStore = typeof store;