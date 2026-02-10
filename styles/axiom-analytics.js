/**
 * Axiom Documentation Observability (do11y) - Privacy-First Analytics
 * 
 * Framework-agnostic documentation observability. Works with any static-site
 * generator or docs framework including Mintlify, Docusaurus, Nextra,
 * GitBook, MkDocs Material, VitePress, and plain HTML.
 * 
 * Defaults are configured for Mintlify. To adapt to another framework,
 * update the "Framework-specific selectors" section in the config object.
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
 * Set AXIOM_INGEST_TOKEN and AXIOM_DATASET in the config object below.
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
    token: "xaat-31aceafd-2a71-4313-8a43-1494ea125085",
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
    // Allowed domains - restrict where this script can send data from
    // Set to null to allow any domain, or ['docs.axiom.co'] to restrict
    allowedDomains: null,
    // Respect Do Not Track browser setting
    respectDNT: true,
    // Maximum retries for failed requests
    maxRetries: 2,
    // Retry delay in milliseconds (doubles with each retry)
    retryDelay: 1000,
    // Rate limiting: minimum milliseconds between events of the same type
    rateLimitMs: 100,
    // ---- Framework-specific selectors ----
    // The selectors below default to Mintlify. Adapt them to your docs
    // framework by uncommenting or replacing with the appropriate values.
    //
    // CSS selector for the search trigger element(s)
    //   Mintlify:        '#search-bar-entry, #search-bar-entry-mobile, [class*="search"]'
    //   Docusaurus:      '.DocSearch, .DocSearch-Button'
    //   Nextra:          '.nextra-search input'
    //   GitBook:         '[data-testid="search"]'
    //   MkDocs Material: '.md-search__input'
    //   VitePress:       '.VPNavBarSearch button, #local-search'
    searchSelector: '#search-bar-entry, #search-bar-entry-mobile, [class*="search"]',
    // CSS selector for "copy code" buttons
    //   Mintlify:        '[class*="copy"], button[aria-label*="copy" i]'
    //   Docusaurus:      '.clean-btn[class*="copy"], button[class*="copyButton"]'
    //   Nextra:          'button[class*="copy"]'
    //   MkDocs Material: '.md-clipboard'
    //   VitePress:       '.vp-code-copy'
    copyButtonSelector: '[class*="copy"], button[aria-label*="copy" i]',
    // CSS selector for code block containers (parent of copy button)
    //   Works across most frameworks as-is. Adjust if your framework
    //   uses a non-standard wrapper around code blocks.
    codeBlockSelector: 'pre, [class*="code"]',
    // CSS selectors for page regions used in link context detection.
    // These use semantic HTML elements plus common class-name patterns
    // and should work with most frameworks without changes.
    navigationSelector: 'nav, [role="navigation"], #navbar, #sidebar, [class*="nav"], [class*="sidebar"]',
    footerSelector: 'footer, [role="contentinfo"], [class*="footer"]',
    contentSelector: 'main, article, [role="main"], [class*="content"]',
  };

  // ============================================================
  // Security & Privacy Checks
  // ============================================================

  /**
   * Check if analytics should be disabled
   * Returns true if tracking should be blocked
   */
  function shouldDisableTracking() {
    // Respect Do Not Track
    if (config.respectDNT && (
      navigator.doNotTrack === '1' || 
      navigator.doNotTrack === 'yes' ||
      window.doNotTrack === '1'
    )) {
      if (config.debug) {
        console.log('[Axiom Analytics] Disabled: Do Not Track is enabled');
      }
      return true;
    }

    // Check allowed domains
    if (config.allowedDomains && config.allowedDomains.length > 0) {
      const currentDomain = window.location.hostname;
      const isAllowed = config.allowedDomains.some(function(domain) {
        return currentDomain === domain || currentDomain.endsWith('.' + domain);
      });
      if (!isAllowed) {
        if (config.debug) {
          console.log('[Axiom Analytics] Disabled: Domain not allowed:', currentDomain);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Sanitize text to remove potential PII and limit length
   */
  function sanitizeText(text, maxLength) {
    if (!text || typeof text !== 'string') return null;
    
    maxLength = maxLength || 100;
    
    // Remove potential email addresses
    let sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
    
    // Remove potential phone numbers (basic patterns)
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');
    
    // Remove potential SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted]');
    
    // Trim and limit length
    return sanitized.trim().substring(0, maxLength);
  }

  // ============================================================
  // Session Management (No Cookies)
  // ============================================================
  
  /**
   * Generate a random session ID
   * Uses crypto API for better randomness
   */
  function generateSessionId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
      // Fallback using getRandomValues for better entropy
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const arr = new Uint8Array(16);
        window.crypto.getRandomValues(arr);
        // Set version (4) and variant bits
        arr[6] = (arr[6] & 0x0f) | 0x40;
        arr[8] = (arr[8] & 0x3f) | 0x80;
        const hex = Array.from(arr, function(b) { 
          return b.toString(16).padStart(2, '0'); 
        }).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + 
               hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
      }
    } catch (e) {
      // Fall through to Math.random fallback
    }
    // Last resort fallback for very old browsers
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
      title: sanitizeText(document.title, 150),
    };
  }

  // ============================================================
  // Event Batching & Sending
  // ============================================================
  
  let eventQueue = [];
  let flushTimeout = null;
  let lastEventTime = {}; // Rate limiting: track last event time by type
  let isDisabled = false; // Set after initialization checks

  /**
   * Queue an event for sending
   */
  function queueEvent(eventType, eventData) {
    // Skip if tracking is disabled
    if (isDisabled) return;

    // Rate limiting per event type
    const now = Date.now();
    if (config.rateLimitMs > 0 && lastEventTime[eventType]) {
      if (now - lastEventTime[eventType] < config.rateLimitMs) {
        if (config.debug) {
          console.log('[Axiom Analytics] Rate limited:', eventType);
        }
        return;
      }
    }
    lastEventTime[eventType] = now;

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

    // Cap queue size to prevent memory issues
    if (eventQueue.length > 100) {
      eventQueue = eventQueue.slice(-100);
      if (config.debug) {
        console.warn('[Axiom Analytics] Event queue capped at 100 events');
      }
    }

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
   * Validate configuration before sending
   */
  function validateConfig() {
    if (!config.token) {
      if (config.debug) {
        console.warn('[Axiom Analytics] No API token configured');
      }
      return false;
    }

    // Validate token format (basic check)
    if (typeof config.token !== 'string' || config.token.length < 10) {
      if (config.debug) {
        console.warn('[Axiom Analytics] Invalid token format');
      }
      return false;
    }

    // Validate endpoint
    try {
      new URL(config.endpoint);
    } catch (e) {
      if (config.debug) {
        console.warn('[Axiom Analytics] Invalid endpoint URL');
      }
      return false;
    }

    // Validate dataset name (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(config.dataset)) {
      if (config.debug) {
        console.warn('[Axiom Analytics] Invalid dataset name');
      }
      return false;
    }

    return true;
  }

  /**
   * Send queued events to Axiom with retry logic
   */
  function flush(retriesLeft) {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    if (eventQueue.length === 0) return;
    if (!validateConfig()) return;

    // Default retries
    if (typeof retriesLeft !== 'number') {
      retriesLeft = config.maxRetries;
    }

    // Copy events and clear queue
    const events = eventQueue.slice();
    eventQueue = [];

    const url = config.endpoint + '/v1/datasets/' + encodeURIComponent(config.dataset) + '/ingest';

    sendEvents(url, events, retriesLeft);
  }

  /**
   * Send events with fetch and retry support
   */
  function sendEvents(url, events, retriesLeft) {
    // Use fetch with keepalive for better page unload support
    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
      keepalive: true, // Allows request to outlive the page
    }).then(function(response) {
      if (response.ok) {
        if (config.debug) {
          console.log('[Axiom Analytics] Flushed', events.length, 'events');
        }
        return;
      }
      
      // Handle retriable errors (5xx, 429)
      if (retriesLeft > 0 && (response.status >= 500 || response.status === 429)) {
        if (config.debug) {
          console.log('[Axiom Analytics] Retrying after error:', response.status);
        }
        // Re-add events to queue for retry
        eventQueue = events.concat(eventQueue);
        setTimeout(function() {
          flush(retriesLeft - 1);
        }, config.retryDelay * (config.maxRetries - retriesLeft + 1));
        return;
      }

      // Non-retriable error
      if (config.debug) {
        response.text().then(function(text) {
          console.error('[Axiom Analytics] Ingest failed:', response.status, text);
        });
      }
    }).catch(function(err) {
      // Network error - retry if possible
      if (retriesLeft > 0) {
        if (config.debug) {
          console.log('[Axiom Analytics] Network error, retrying:', err.message);
        }
        eventQueue = events.concat(eventQueue);
        setTimeout(function() {
          flush(retriesLeft - 1);
        }, config.retryDelay * (config.maxRetries - retriesLeft + 1));
      } else if (config.debug) {
        console.error('[Axiom Analytics] Failed to send events:', err);
      }
    });
  }

  /**
   * Fallback flush for page unload (no retry, fire-and-forget)
   */
  function flushSync() {
    if (eventQueue.length === 0) return;
    if (!validateConfig()) return;

    const events = eventQueue;
    eventQueue = [];

    const url = config.endpoint + '/v1/datasets/' + encodeURIComponent(config.dataset) + '/ingest';

    // Try sendBeacon first (most reliable for page unload)
    // Note: sendBeacon can't send auth headers, so we encode token in URL if needed
    // For Axiom, we fall back to fetch with keepalive
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + config.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        keepalive: true,
      });
    } catch (e) {
      // Best effort - ignore errors on page unload
    }

    if (config.debug) {
      console.log('[Axiom Analytics] Sync flushed', events.length, 'events');
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
        linkText: sanitizeText(link.textContent, 100),
        // Track which section of the page the link was in
        linkContext: getLinkContext(link),
        // Track the nearest heading to identify which section
        linkSection: sanitizeText(getNearestHeading(link), 100),
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
    // Check if in navigation (configured via config.navigationSelector)
    if (link.closest(config.navigationSelector)) {
      return 'navigation';
    }
    // Check if in footer (configured via config.footerSelector)
    if (link.closest(config.footerSelector)) {
      return 'footer';
    }
    // Check if in main content (configured via config.contentSelector)
    if (link.closest(config.contentSelector)) {
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
    try {
      // Escape the href for use in selector (CSS.escape may not be available)
      var escapedHref = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(href)
        : href.replace(/["\\]/g, '\\$&'); // Basic escaping fallback
      
      var allLinks = document.querySelectorAll('a[href="' + escapedHref + '"]');
      for (var i = 0; i < allLinks.length; i++) {
        if (allLinks[i] === link) {
          return i + 1; // 1-based index
        }
      }
    } catch (e) {
      // Selector failed (malformed href), fall back to 1
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

      var totalTime = Date.now() - pageLoadTime;
      // Prevent division by zero
      var engagementRatio = totalTime > 0 ? totalActiveTime / totalTime : 0;
      
      // Safely get max scroll depth (Set spread may fail in old browsers)
      var maxScroll = 0;
      trackedScrollDepths.forEach(function(depth) {
        if (depth > maxScroll) maxScroll = depth;
      });

      queueEvent('page_exit', {
        totalTimeSeconds: Math.round(totalTime / 1000),
        activeTimeSeconds: Math.round(totalActiveTime / 1000),
        engagementRatio: Math.round(engagementRatio * 100) / 100,
        maxScrollDepth: maxScroll,
      });

      // Force sync flush on exit (no retry, fire-and-forget)
      flushSync();
    });
  }

  // ============================================================
  // Search Tracking
  // ============================================================

  /**
   * Track documentation search usage
   */
  function setupSearchTracking() {
    // Track clicks on search elements (configured via config.searchSelector)
    document.addEventListener('click', function(e) {
      const searchTrigger = e.target.closest(config.searchSelector);
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
      const copyButton = e.target.closest(config.copyButtonSelector);
      if (copyButton) {
        const codeBlock = copyButton.closest(config.codeBlockSelector);
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

  var mutationObserver = null; // Store reference for cleanup

  /**
   * Initialize analytics
   */
  function init() {
    // Check for token in a meta tag (secure server-side injection)
    var metaToken = document.querySelector('meta[name="axiom-analytics-token"]');
    if (metaToken) {
      config.token = metaToken.getAttribute('content');
    }

    // Check for dataset override
    var metaDataset = document.querySelector('meta[name="axiom-analytics-dataset"]');
    if (metaDataset) {
      config.dataset = metaDataset.getAttribute('content');
    }

    // Check for debug mode
    var metaDebug = document.querySelector('meta[name="axiom-analytics-debug"]');
    if (metaDebug && metaDebug.getAttribute('content') === 'true') {
      config.debug = true;
    }

    // Check for allowed domains override
    var metaDomains = document.querySelector('meta[name="axiom-analytics-domains"]');
    if (metaDomains) {
      var domainsStr = metaDomains.getAttribute('content');
      if (domainsStr) {
        config.allowedDomains = domainsStr.split(',').map(function(d) { return d.trim(); });
      }
    }

    if (config.debug) {
      console.log('[Axiom Analytics] Initializing with config:', {
        endpoint: config.endpoint,
        dataset: config.dataset,
        hasToken: !!config.token,
        allowedDomains: config.allowedDomains,
        respectDNT: config.respectDNT,
      });
    }

    // Check if tracking should be disabled
    if (shouldDisableTracking()) {
      isDisabled = true;
      if (config.debug) {
        console.log('[Axiom Analytics] Tracking disabled');
      }
      return;
    }

    // Warn if no token (but don't fail - allows development without token)
    if (!config.token) {
      if (config.debug) {
        console.warn('[Axiom Analytics] No API token configured. Events will not be sent.');
        console.warn('[Axiom Analytics] Add <meta name="axiom-analytics-token" content="your-token"> to enable.');
      }
    }

    // Set up tracking
    trackPageView();
    setupLinkTracking();
    setupScrollTracking();
    setupEngagementTracking();
    setupSearchTracking();
    setupCopyTracking();

    // Handle SPA navigation (works with any client-side router via MutationObserver)
    var lastPath = window.location.pathname;
    
    // Use MutationObserver to detect page changes
    mutationObserver = new MutationObserver(function() {
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

    mutationObserver.observe(document.body, {
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

  /**
   * Cleanup function for SPA unmount
   */
  function cleanup() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    flushSync();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for debugging and integration
  window.AxiomAnalytics = {
    // Read-only config access (don't expose token)
    getConfig: function() {
      return {
        endpoint: config.endpoint,
        dataset: config.dataset,
        hasToken: !!config.token,
        debug: config.debug,
        isDisabled: isDisabled,
        allowedDomains: config.allowedDomains,
        respectDNT: config.respectDNT,
      };
    },
    // Manually flush events
    flush: flush,
    // Enable/disable debug mode
    debug: function(enabled) {
      config.debug = enabled !== false;
    },
    // Cleanup for SPA unmount
    cleanup: cleanup,
    // Check if tracking is enabled
    isEnabled: function() {
      return !isDisabled && !!config.token;
    },
    // Get queue size (for debugging)
    getQueueSize: function() {
      return eventQueue.length;
    },
    // Version for debugging
    version: '2.0.0',
  };

})();
