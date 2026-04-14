// Web Worker: fires a "tick" message every 10 seconds.
// Running in a Worker means the interval isn't throttled by the browser's
// background-tab timer coalescing that affects main-thread setInterval calls.

let intervalId = null;

self.onmessage = (e) => {
  if (e.data === 'start') {
    if (intervalId !== null) return; // already running
    intervalId = setInterval(() => {
      self.postMessage('tick');
    }, 10000);
  } else if (e.data === 'stop') {
    clearInterval(intervalId);
    intervalId = null;
  }
};
