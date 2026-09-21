self.addEventListener('push', (event) => {
  const fallback = { title: '见闻 · 今日精选', body: '今天的 15 条资讯已经准备好。', url: '/' };
  const data = event.data ? event.data.json() : fallback;
  event.waitUntil(self.registration.showNotification(data.title || fallback.title, {
    body: data.body || fallback.body,
    icon: '/images/editorial-hero.png',
    badge: '/images/editorial-hero.png',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const current = clients.find((client) => 'focus' in client);
    if (current) return current.focus().then(() => current.navigate(target));
    return self.clients.openWindow(target);
  }));
});
