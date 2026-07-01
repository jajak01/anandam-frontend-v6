/**
 * Deferred Scripts Utility
 * 
 * Loads non-critical third-party scripts after the page has finished rendering
 * to prevent render-blocking and improve Core Web Vitals.
 * 
 * Scripts are loaded after:
 * - window.onload event fires, OR
 * - A configurable delay (default 3 seconds), whichever comes first
 */

type ScriptConfig = {
  id: string;
  src?: string;
  innerHTML?: string;
  async?: boolean;
  defer?: boolean;
  /** If true, the script will be inserted at the end of <body> instead of <head> */
  appendToBody?: boolean;
  /** Attributes to set on the script element */
  attrs?: Record<string, string>;
};

const loadedScripts = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function injectScript(config: ScriptConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    // Prevent duplicate injection
    if (loadedScripts.has(config.id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = config.id;

    if (config.src) {
      script.src = config.src;
    }

    if (config.innerHTML) {
      script.innerHTML = config.innerHTML;
    }

    if (config.async !== undefined) script.async = config.async;
    if (config.defer !== undefined) script.defer = config.defer;

    if (config.attrs) {
      Object.entries(config.attrs).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
    }

    script.onload = () => {
      loadedScripts.add(config.id);
      resolve();
    };
    script.onerror = (err) => {
      console.warn(`[DeferredScripts] Failed to load: ${config.id}`, err);
      reject(err);
    };

    if (config.appendToBody) {
      document.body.appendChild(script);
    } else {
      document.head.appendChild(script);
    }
  });
}

/**
 * Initialize all deferred third-party scripts.
 * Call this once in App.tsx or main.tsx.
 */
export function initDeferredScripts(): void {
  // Wait for the page to be fully loaded OR 3 seconds, whichever comes first
  const delay = 3000; // 3 seconds max delay

  const startLoading = () => {
    // 1. Google Tag Manager (GTM) - already in index.html, but we can add a noscript fallback
    // The GTM script in index.html is already async, but we keep it there for early tracking.
    // If you want to fully defer GTM, move it from index.html to here.

    // 2. Google Maps iframe - defer loading is handled by Footer component via lazyLoadGoogleMaps()
    // 3. Microsoft Clarity - if you add it later
    // injectClarity();
  };

  if (document.readyState === 'complete') {
    startLoading();
  } else {
    window.addEventListener('load', startLoading);
    // Fallback: start after 3 seconds even if window.onload hasn't fired
    setTimeout(startLoading, delay);
  }
}

/**
 * Lazy-load the Google Maps iframe in the footer.
 * The iframe is replaced with a placeholder div initially,
 * then the actual iframe is injected when the user scrolls near it
 * OR after the deferred timeout.
 */
export function lazyLoadGoogleMaps(containerId: string, embedUrl: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Use IntersectionObserver to load when visible
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = '0';
            iframe.loading = 'lazy';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            container.appendChild(iframe);
            observer.unobserve(container);
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);
  } else {
    // Fallback: load after delay
    setTimeout(() => {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = '0';
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      container.appendChild(iframe);
    }, THIRD_PARTY_DELAY);
  }
}

// Delay constant used as fallback for lazy loading
export const THIRD_PARTY_DELAY = 3000;
