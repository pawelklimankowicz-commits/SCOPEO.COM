'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationPanel from '@/components/notification-panel';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function load() {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return;
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      void load();
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const unreadIds = useMemo(
    () => notifications.filter((item) => !item.readAt).map((item) => item.id),
    [notifications]
  );

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    await load();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen((value) => !value)}
        style={{ position: 'relative', padding: '6px 10px' }}
      >
        🔔
        {unreadCount > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: 'white',
              borderRadius: 999,
              minWidth: 20,
              height: 20,
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <NotificationPanel
          notifications={notifications}
          onMarkAllRead={() => {
            void markRead(unreadIds);
          }}
          onOpen={(item) => {
            const toRead = item.readAt ? [] : [item.id];
            void markRead(toRead);
            setOpen(false);
            if (item.link) router.push(item.link);
          }}
        />
      ) : null}
    </div>
  );
}
