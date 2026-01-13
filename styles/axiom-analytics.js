/**
 * Axiom Docs Analytics - Privacy-First Analytics
 * 
 * This script collects anonymous usage analytics without:
 * - Cookies (uses sessionStorage only - cleared when browser closes)
 * - Personal identifiable information (PII)
 * - Device fingerprinting
 * - Cross-site tracking
 * 
 * No GDPR consent banner required.
 * 
 * Configuration:
 * Set AXIOM_INGEST_TOKEN and AXIOM_DATASET in your environment,
 * or update the config object below.
 */

(function() {
  'use strict';

  // ============================================================
  // Configuration
  // ============================================================
  const config = {
    // Axiom API base URL (use edge deployment domain if applicable)
    endpoint: 'https://api.axiom.co',
    // Dataset name - update this to your Axiom dataset
    dataset: 'docs-analytics',
    // API token for ingest - use a token with ONLY ingest permissions
    // IMPORTANT: Create a restricted token that can only ingest to this dataset
    token: "xaat-d4a6fb6d-6b57-42da-8b3d-2298405237c8",
    // Enable debug logging to console
    debug: false,
    // Batch events and send periodically (milliseconds)
    flushInterval: 5000,
    // Maximum events to batch before forcing a flush
    maxBatchSize: 10,
    // Track outbound link clicks
    trackOutboundLinks: true,
    // Track internal navigation
    trackInternalLinks: true,
    // Track scroll depth
    trackScrollDepth: true,
    // Scroll depth thresholds to track (percentages)
    scrollThresholds: [25, 50, 75, 90],
  };

  // ============================================================
  // Session Management (No Cookies)
  // ============================================================
  
  /**
   * Generate a random session ID
   * Uses crypto API for better randomness
   */
  function generateSessionId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get or create session data from sessionStorage
   * Session data is automatically cleared when browser closes
   */
  function getSession() {
    let session = null;
    try {
      const stored = sessionStorage.getItem('axiom_docs_session');
      if (stored) {
        session = JSON.parse(stored);
      }
    } catch (e) {
      // sessionStorage not available or parsing error
    }

    if (!session) {
      session = {
        id: generateSessionId(),
        startTime: new Date().toISOString(),
        pageSequence: [],
        pageCount: 0,
      };
      saveSession(session);
    }

    return session;
  }

  /**
   * Save session data to sessionStorage
   */
  function saveSession(session) {
    try {
      sessionStorage.setItem('axiom_docs_session', JSON.stringify(session));
    } catch (e) {
      // sessionStorage not available
    }
  }

  /**
   * Update page sequence in session
   */
  function updatePageSequence(path) {
    const session = getSession();
    session.pageCount++;
    session.pageSequence.push({
      path: path,
      timestamp: new Date().toISOString(),
      index: session.pageCount,
    });
    // Keep only last 50 pages to avoid storage limits
    if (session.pageSequence.length > 50) {
      session.pageSequence = session.pageSequence.slice(-50);
    }
    saveSession(session);
    return session;
  }

  // ============================================================
  // Data Collection (Privacy-First)
  // ============================================================

  /**
   * Get non-identifying browser context
   * Only collects general categories, not fingerprinting data
   */
  function getBrowserContext() {
    return {
      // General viewport size category (not exact dimensions)
      viewportCategory: categorizeViewport(),
      // General browser family (not exact version)
      browserFamily: getBrowserFamily(),
      // Device type category
      deviceType: getDeviceType(),
      // Preferred language (first language only)
      language: (navigator.language || '').split('-')[0] || 'unknown',
      // Timezone offset (hours from UTC)
      timezoneOffset: new Date().getTimezoneOffset() / 60,
    };
  }

  /**
   * Categorize viewport into general buckets
   */
  function categorizeViewport() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'large-desktop';
  }

  /**
   * Get general browser family (not exact version)
   */
  function getBrowserFamily() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Other';
  }

  /**
   * Get device type from user agent
   */
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      if (/iPad|Tablet/.test(ua)) return 'tablet';
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get referrer domain only (not full URL for privacy)
   */
  function getReferrerDomain() {
    try {
      if (!document.referrer) return 'direct';
      const url = new URL(document.referrer);
      // If same domain, return 'internal'
      if (url.hostname === window.location.hostname) return 'internal';
      // Return just the domain
      return url.hostname;
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * Get current page info
   */
  function getPageInfo() {
    return {
      path: window.location.pathname,
      hash: window.location.hash || null,
      search: window.location.search ? 'has_params' : null, // Don't log actual params
      title: document.title,
    };
  }

  // ============================================================
  // Event Batching & Sending
  // ============================================================
  
  let eventQueue = [];
  let flushTimeout = null;

  /**
   * Queue an event for sending
   */
  function queueEvent(eventType, eventData) {
    const session = getSession();
    
    const event = {
      _time: new Date().toISOString(),
      eventType: eventType,
      sessionId: session.id,
      sessionPageCount: session.pageCount,
      ...getPageInfo(),
      ...getBrowserContext(),
      ...eventData,
    };

    if (config.debug) {
      console.log('[Axiom Analytics] Event queued:', event);
    }

    eventQueue.push(event);

    // Flush if batch is full
    if (eventQueue.length >= config.maxBatchSize) {
      flush();
    } else {
      // Schedule flush
      scheduleFlush();
    }
  }

  /**
   * Schedule a flush after the interval
   */
  function scheduleFlush() {
    if (flushTimeout) return;
    flushTimeout = setTimeout(flush, config.flushInterval);
  }

  /**
   * Send queued events to Axiom
   */
  function flush() {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    if (eventQueue.length === 0) return;
    if (!config.token) {
      if (config.debug) {
        console.warn('[Axiom Analytics] No API token configured');
      }
      return;
    }

    const events = eventQueue;
    eventQueue = [];

    const url = `${config.endpoint}/v1/datasets/${config.dataset}/ingest`;

    // Use sendBeacon for reliability (works even when page is closing)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(events)], {
        type: 'application/json',
      });
      const headers = new Headers({
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      });
      
      // sendBeacon doesn't support custom headers, so fall back to fetch
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        keepalive: true, // Allows request to outlive the page
      }).then(function(response) {
        if (!response.ok) {
          return response.text().then(function(text) {
            console.error('[Axiom Analytics] Ingest failed:', response.status, text);
          });
        }
      }).catch(function(err) {
        if (config.debug) {
          console.error('[Axiom Analytics] Failed to send events:', err);
        }
      });
    } else {
      // Fallback for older browsers
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${config.token}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(events));
    }

    if (config.debug) {
      console.log('[Axiom Analytics] Flushed', events.length, 'events');
    }
  }

  // ============================================================
  // Page View Tracking
  // ============================================================

  /**
   * Track a page view
   */
  function trackPageView() {
    const session = updatePageSequence(window.location.pathname);
    
    queueEvent('page_view', {
      referrerDomain: getReferrerDomain(),
      isFirstPage: session.pageCount === 1,
      previousPath: session.pageSequence.length > 1 
        ? session.pageSequence[session.pageSequence.length - 2].path 
        : null,
    });
  }

  // ============================================================
  // Link Click Tracking
  // ============================================================

  /**
   * Track link clicks
   */
  function setupLinkTracking() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      let linkType = 'other';
      let targetDomain = null;

      try {
        if (href.startsWith('#')) {
          linkType = 'anchor';
        } else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
          linkType = 'internal';
        } else if (href.startsWith('http')) {
          const url = new URL(href);
          if (url.hostname === window.location.hostname) {
            linkType = 'internal';
          } else {
            linkType = 'external';
            targetDomain = url.hostname;
          }
        } else if (href.startsWith('mailto:')) {
          linkType = 'email';
        }
      } catch (e) {
        // Invalid URL
      }

      // Only track based on config
      if (linkType === 'internal' && !config.trackInternalLinks) return;
      if (linkType === 'external' && !config.trackOutboundLinks) return;

      queueEvent('link_click', {
        linkType: linkType,
        targetUrl: href,
        targetDomain: targetDomain,
        linkText: (link.textContent || '').trim().substring(0, 100),
        // Track which section of the page the link was in
        linkContext: getLinkContext(link),
        // Track the nearest heading to identify which section
        linkSection: getNearestHeading(link),
        // Track link position for disambiguation
        linkIndex: getLinkIndex(link, href),
      });

      // Flush immediately for external links (page may unload)
      if (linkType === 'external') {
        flush();
      }
    });
  }

  /**
   * Get context about where the link is on the page
   */
  function getLinkContext(link) {
    // Check if in navigation
    if (link.closest('nav, #navbar, #sidebar, [class*="nav"]')) {
      return 'navigation';
    }
    // Check if in footer
    if (link.closest('footer, [class*="footer"]')) {
      return 'footer';
    }
    // Check if in main content
    if (link.closest('main, article, [class*="content"]')) {
      return 'content';
    }
    return 'other';
  }

  /**
   * Get the nearest heading above the link (for section context)
   */
  function getNearestHeading(element) {
    // Walk up and back through the DOM to find the nearest heading
    let current = element;
    
    while (current && current !== document.body) {
      // Check previous siblings for headings
      let sibling = current.previousElementSibling;
      while (sibling) {
        // Check if sibling is a heading
        if (/^H[1-6]$/.test(sibling.tagName)) {
          return sibling.textContent.trim().substring(0, 100);
        }
        // Check if sibling contains a heading (search backwards)
        const heading = sibling.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          // Get the last heading in this sibling
          const headings = sibling.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (headings.length > 0) {
            return headings[headings.length - 1].textContent.trim().substring(0, 100);
          }
        }
        sibling = sibling.previousElementSibling;
      }
      // Move up to parent
      current = current.parentElement;
    }
    
    return null;
  }

  /**
   * Get the index of this link among links with the same href
   * Helps disambiguate multiple identical links on the page
   */
  function getLinkIndex(link, href) {
    const allLinks = document.querySelectorAll('a[href="' + CSS.escape(href) + '"]');
    for (let i = 0; i < allLinks.length; i++) {
      if (allLinks[i] === link) {
        return i + 1; // 1-based index
      }
    }
    return 1;
  }

  // ============================================================
  // Scroll Depth Tracking
  // ============================================================

  let trackedScrollDepths = new Set();

  /**
   * Track scroll depth
   */
  function setupScrollTracking() {
    if (!config.trackScrollDepth) return;

    let ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          checkScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Check and track scroll depth thresholds
   */
  function checkScrollDepth() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return;
    
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    config.scrollThresholds.forEach(function(threshold) {
      if (scrollPercent >= threshold && !trackedScrollDepths.has(threshold)) {
        trackedScrollDepths.add(threshold);
        queueEvent('scroll_depth', {
          threshold: threshold,
          scrollPercent: scrollPercent,
        });
      }
    });
  }

  // ============================================================
  // Time on Page Tracking
  // ============================================================

  let pageLoadTime = Date.now();
  let lastActivityTime = Date.now();
  let totalActiveTime = 0;
  let isPageVisible = true;

  /**
   * Track user activity for engagement time
   */
  function setupEngagementTracking() {
    // Track visibility changes
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        // Page became hidden, record active time
        if (isPageVisible) {
          totalActiveTime += Date.now() - lastActivityTime;
          isPageVisible = false;
        }
      } else {
        // Page became visible
        lastActivityTime = Date.now();
        isPageVisible = true;
      }
    });

    // Track before unload to send final engagement data
    window.addEventListener('beforeunload', function() {
      if (isPageVisible) {
        totalActiveTime += Date.now() - lastActivityTime;
      }

      const totalTime = Date.now() - pageLoadTime;
      const engagementRatio = totalActiveTime / totalTime;

      queueEvent('page_exit', {
        totalTimeSeconds: Math.round(totalTime / 1000),
        activeTimeSeconds: Math.round(totalActiveTime / 1000),
        engagementRatio: Math.round(engagementRatio * 100) / 100,
        maxScrollDepth: Math.max(...trackedScrollDepths, 0),
      });

      // Force flush on exit
      flush();
    });
  }

  // ============================================================
  // Search Tracking
  // ============================================================

  /**
   * Track documentation search usage
   */
  function setupSearchTracking() {
    // Track clicks on search elements (Mintlify's search)
    document.addEventListener('click', function(e) {
      const searchTrigger = e.target.closest(
        '#search-bar-entry, #search-bar-entry-mobile, [class*="search"]'
      );
      if (searchTrigger) {
        queueEvent('search_opened', {});
      }
    });

    // Track keyboard shortcut for search
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        queueEvent('search_opened', {
          trigger: 'keyboard',
        });
      }
    });
  }

  // ============================================================
  // Copy Code Tracking
  // ============================================================

  /**
   * Track when users copy code blocks
   */
  function setupCopyTracking() {
    document.addEventListener('click', function(e) {
      const copyButton = e.target.closest('[class*="copy"], button[aria-label*="copy" i]');
      if (copyButton) {
        const codeBlock = copyButton.closest('pre, [class*="code"]');
        const language = codeBlock?.getAttribute('data-language') || 
                         codeBlock?.className.match(/language-(\w+)/)?.[1] || 
                         'unknown';
        
        queueEvent('code_copied', {
          language: language,
        });
      }
    });
  }

  // ============================================================
  // Initialization
  // ============================================================

  /**
   * Initialize analytics
   */
  function init() {
    // Check for token in various places
    if (!config.token) {
      // Check for token in a meta tag (allows server-side injection)
      const metaToken = document.querySelector('meta[name="axiom-analytics-token"]');
      if (metaToken) {
        config.token = metaToken.getAttribute('content');
      }
    }

    // Check for dataset override
    const metaDataset = document.querySelector('meta[name="axiom-analytics-dataset"]');
    if (metaDataset) {
      config.dataset = metaDataset.getAttribute('content');
    }

    if (config.debug) {
      console.log('[Axiom Analytics] Initializing with config:', {
        endpoint: config.endpoint,
        dataset: config.dataset,
        hasToken: !!config.token,
      });
    }

    // Set up tracking
    trackPageView();
    setupLinkTracking();
    setupScrollTracking();
    setupEngagementTracking();
    setupSearchTracking();
    setupCopyTracking();

    // Handle SPA navigation (Mintlify uses client-side routing)
    let lastPath = window.location.pathname;
    
    // Use MutationObserver to detect page changes
    const observer = new MutationObserver(function() {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        // Reset scroll tracking for new page
        trackedScrollDepths = new Set();
        pageLoadTime = Date.now();
        lastActivityTime = Date.now();
        totalActiveTime = 0;
        // Track new page view
        trackPageView();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for popstate (browser back/forward)
    window.addEventListener('popstate', function() {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        trackedScrollDepths = new Set();
        pageLoadTime = Date.now();
        lastActivityTime = Date.now();
        totalActiveTime = 0;
        trackPageView();
      }
    });

    if (config.debug) {
      console.log('[Axiom Analytics] Initialized successfully');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose configuration for debugging
  window.AxiomAnalytics = {
    config: config,
    flush: flush,
    debug: function(enabled) {
      config.debug = enabled !== false;
    },
  };

})();
