/* global self, importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyCkj3IuSS5Xuq7NQ38vc1fL5kw-VmQa03s',
    authDomain: 'concert-finder-27d6a.firebaseapp.com',
    projectId: 'concert-finder-27d6a',
    storageBucket: "concert-finder-27d6a.firebasestorage.app",
    messagingSenderId: '381549296165',
    appId: '1:381549296165:web:279130f24f43d8abd79dcc',
    measurementId: 'G-E9F9GGNFZN',
  });


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage', payload);

  const title = payload.data?.title || 'Notification';
  const options = {
    body: payload.data?.body,
    data: {
      ...payload.data,
      linkUrl: payload.data?.linkUrl || '/',
    },
  };

  self.registration.showNotification(title, options);
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.linkUrl;
  if (link) event.waitUntil(clients.openWindow(link));
});