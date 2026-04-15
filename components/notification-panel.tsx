'use client';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function relativeTime(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
}

export default function NotificationPanel({
  notifications,
  onOpen,
  onMarkAllRead,
}: {
  notifications: NotificationItem[];
  onOpen: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 10px)',
        width: 420,
        maxHeight: 460,
        overflowY: 'auto',
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 12,
        zIndex: 60,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Powiadomienia</strong>
        <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={onMarkAllRead}>
          Oznacz wszystkie
        </button>
      </div>
      {notifications.length === 0 ? (
        <div className="app-muted" style={{ padding: 16, textAlign: 'center' }}>
          Brak nowych powiadomień.
        </div>
      ) : (
        notifications.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            style={{
              width: '100%',
              textAlign: 'left',
              border: '1px solid #1e293b',
              background: item.readAt ? '#0f172a' : '#111827',
              borderRadius: 10,
              padding: 10,
              marginBottom: 8,
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.body}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{relativeTime(item.createdAt)}</div>
          </button>
        ))
      )}
    </div>
  );
}
