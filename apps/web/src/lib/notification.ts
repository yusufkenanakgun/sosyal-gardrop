'use client';

// Simple notification sound using Web Audio API
export function playMessageSound() {
  if (typeof window === 'undefined') return;

  try {
    // Create audio context
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();

    // Create oscillator for a pleasant "pop" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (gentle pop)
    oscillator.frequency.value = 800; // Higher pitch
    oscillator.type = 'sine';

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    // Play
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

// Browser notification (requires permission)
export async function showBrowserNotification(title: string, body: string, icon?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  // Show notification if permission granted
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: 'message-notification',
        requireInteraction: false,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
}
