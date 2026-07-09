// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiGet = vi.fn(async (..._a: unknown[]) => ({ key: 'BPubKey' }));
const apiPost = vi.fn(async (..._a: unknown[]) => undefined);
const apiDelete = vi.fn(async (..._a: unknown[]) => undefined);
vi.mock('@/lib/api', () => ({ api: {
  get: (...a: unknown[]) => apiGet(...a),
  post: (...a: unknown[]) => apiPost(...a),
  delete: (...a: unknown[]) => apiDelete(...a),
} }));

import { enablePush, disablePush, isPushSupported } from './push';

function mockPushEnv(existingSub: unknown = null) {
  const subscribe = vi.fn(async () => ({
    endpoint: 'https://push.example/e1',
    toJSON: () => ({ endpoint: 'https://push.example/e1', keys: { p256dh: 'p', auth: 'a' } }),
    unsubscribe: vi.fn(async () => true),
  }));
  const registration = {
    pushManager: { subscribe, getSubscription: vi.fn(async () => existingSub) },
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: vi.fn(async () => registration), ready: Promise.resolve(registration) },
    configurable: true,
  });
  Object.defineProperty(window, 'PushManager', { value: function () {}, configurable: true });
  Object.defineProperty(window, 'Notification', {
    value: { requestPermission: vi.fn(async () => 'granted'), permission: 'default' },
    configurable: true,
  });
  return { subscribe, registration };
}

describe('push client lib (Backlog 7)', () => {
  beforeEach(() => { apiGet.mockClear(); apiPost.mockClear(); apiDelete.mockClear(); });

  it('enablePush: registriert SW, abonniert mit VAPID-Key, meldet Subscription an die API', async () => {
    mockPushEnv();
    await enablePush();
    expect(apiGet).toHaveBeenCalledWith('/push/vapid-key');
    expect(apiPost).toHaveBeenCalledWith('/me/push-subscriptions', expect.objectContaining({
      endpoint: 'https://push.example/e1',
      keys: { p256dh: 'p', auth: 'a' },
    }));
  });

  it('disablePush: kündigt Browser-Subscription und meldet sie bei der API ab', async () => {
    const sub = {
      endpoint: 'https://push.example/e1',
      toJSON: () => ({ endpoint: 'https://push.example/e1', keys: { p256dh: 'p', auth: 'a' } }),
      unsubscribe: vi.fn(async () => true),
    };
    mockPushEnv(sub);
    await disablePush();
    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(apiDelete).toHaveBeenCalledWith('/me/push-subscriptions', { endpoint: 'https://push.example/e1' });
  });
});
