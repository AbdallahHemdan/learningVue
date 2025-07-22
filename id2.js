var optima = (function (exports) {
  'use strict';

  /**
   * Utility helper functions for Optima SDK
   */

  /**
   * Generate a random UUID v4 format
   * @returns {string} UUID string
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Fixed exclusion list for Optima SDK requests - these are ALWAYS excluded
   * This list cannot be overridden by user configuration
   */
  const OPTIMA_EXCLUSION_LIST = [
    // Optima SDK API endpoints - these requests should not affect performance measurements
    '/api/optima/sessions',
    '/api/optima/events',
    '/api/optima/resources',
    '/api/optima/web-vitals',
    '/api/optima/ajax-calls',
    '/api/optima/collect',
    '/api/optima/',
    
    // Optima SDK script files
    'optima.js',
    'optima.min.js',
    'optima-sdk.js',
    'optima-view-based.js'
  ];

  /**
   * Default third-party exclusion list - these can be overridden by user configuration
   * Users can provide their own exclusionList in config to replace this default list
   */
  const DEFAULT_THIRD_PARTY_EXCLUSION_LIST = [
    'analytics.google.com',
    'analytics.twitter.com',
    'api.cr-relay.com',
    'api.getkoala.com',
    'api.segment.io',
    'api.vector.co',
    'app.clearbit.com',
    'bam-cell.nr-data.net',
    'browser-intake-us5-datadoghq.com',
    'browser.sentry-cdn.com',
    'c.6sc.co',
    'cdn.cr-relay.com',
    'cdn.debugbear.com',
    'cdn.getkoala.com',
    'cdn.heapanalytics.com',
    'cdn.jsdelivr.net',
    'cdn.segment.com',
    'cdn.vector.co',
    'd-code.liadm.com',
    'data.debugbear.com',
    'googleads.g.doubleclick.net',
    'i.liadm.com',
    'idx.liadm.com',
    'ipv6.6sc.co',
    'j.6sc.co',
    'js-agent.newrelic.com',
    'pro.ip-api.com',
    'px.ads.linkedin.com',
    'rp.liadm.com',
    'secure.gravatar.com',
    'snap.licdn.com',
    'stats.g.doubleclick.net',
    'tag.clearbitscripts.com',
    'unpkg.com',
    'widget.intercom.io',
    'www.datadoghq-browser-agent.com',
    'www.google-analytics.com',
    'www.google.com',
    'www.googleadservices.com',
    'www.googletagmanager.com',
    'x.clearbitjs.com'
  ];

  /**
   * Check if a URL should be excluded from SDK operations (resource collection, activity tracking, etc.)
   * Uses a combination of fixed Optima exclusions and configurable third-party exclusions
   * @param {string} url - The URL to check
   * @param {Object} config - SDK configuration object (optional)
   * @param {Array} config.exclusionList - User-provided exclusion list to override default third-party exclusions
   * @returns {boolean} True if the URL should be excluded
   */
  function isInExclusionList(url, config = {}) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Always check Optima exclusions first - these cannot be overridden
    const isOptimaExcluded = OPTIMA_EXCLUSION_LIST.some(pattern => url.includes(pattern));
    if (isOptimaExcluded) {
      console.log(`[Optima SDK] 🚫 Optima URL excluded from processing: ${url}`);
      return true;
    }

    // Use user-provided exclusion list if available, otherwise use default third-party list
    const thirdPartyExclusionList = config.exclusionList || DEFAULT_THIRD_PARTY_EXCLUSION_LIST;
    
    // Check third-party exclusions
    const isThirdPartyExcluded = thirdPartyExclusionList.some(pattern => url.includes(pattern));
    if (isThirdPartyExcluded) {
      console.log(`[Optima SDK] 🚫 Third-party URL excluded from processing: ${url}`);
      return true;
    }

    return false;
  }

  /**
   * View Management System for Optima SDK
   * Handles view lifecycle, data isolation, and collector management
   */


  /**
   * ViewManager class - Core component for view-based data collection
   */
  class ViewManager {
    constructor(sdk) {
      this.sdk = sdk;
      this.currentView = null;
      this.viewHistory = [];
      this.viewStartTime = null;
      this.maxViewHistory = 10; // Keep last 10 views in memory
      
      console.log('[Optima ViewManager] 🏗️ ViewManager initialized');
    }

    /**
     * Create a new view object with isolated data containers
     * @param {string} type - 'initial' or 'route_change'
     * @param {string} url - Current URL
     * @param {string} trigger - What triggered this view creation
     * @param {number} routeTriggerTime - Performance timestamp when route change was triggered (for route_change views)
     * @returns {Object} New view object
     */
    createView(type, url, trigger, interactionBaseline = null, routeTriggerTime = null) {
      const view = {
        // View identification
        id: generateUUID(),
        type: type, // 'initial' | 'route_change'
        url: url,
        trigger: trigger,
        
        // Timing information
        startTime: performance.now(),
        timestamp: Date.now(),
        duration: null,
        
        // Route change specific timing
        routeTriggerTime: routeTriggerTime, // When route change was actually triggered (for filtering resources)
        interactionBaseline: interactionBaseline, // User interaction time for better resource attribution
        
        // View-specific data containers (100% isolated)
        webVitals: {
          LCP: null,
          FID: null, 
          CLS: null,
          FCP: null,
          INP: null,
          TTFB: null,
          loading_time: null
        },
        
        // Resource data (maintains existing structure)
        resources: [],
        
        // AJAX requests extracted from resources
        ajaxRequests: [],
        
        // Errors that occurred in this view
        errors: [],
        
        // Events that occurred in this view
        events: [],
        
        // View state management
        isCompleted: false,
        isActive: true,
        lastActivityTime: Date.now(),
        completionReason: null,
        
        // Collector state for this view
        collectorState: {
          resourcesCollected: false,
          webVitalsSetup: false,
          errorsSetup: false,
          eventsSetup: false
        }
      };
      
      console.log(`[Optima ViewManager] 📋 Created ${type} view: ${view.id.substring(0, 8)}... for ${url}`);
      if (routeTriggerTime && typeof routeTriggerTime === 'number') {
        console.log(`[Optima ViewManager] ⏰ Route trigger time: ${routeTriggerTime.toFixed(2)}ms, view creation: ${view.startTime.toFixed(2)}ms (delay: ${(view.startTime - routeTriggerTime).toFixed(2)}ms)`);
      }
      if (interactionBaseline && typeof interactionBaseline === 'number') {
        console.log(`[Optima ViewManager] 🎯 Interaction baseline: ${interactionBaseline.toFixed(2)}ms (${(view.startTime - interactionBaseline).toFixed(2)}ms before view creation)`);
        console.log(`[Optima ViewManager] ⚡ Baseline advantage: ${(routeTriggerTime && typeof routeTriggerTime === 'number') ? (routeTriggerTime - interactionBaseline).toFixed(2) : 'N/A'}ms earlier filtering`);
      }
      return view;
    }

    /**
     * Start a new view and properly handle the transition
     * @param {string} type - 'initial' or 'route_change'
     * @param {string} url - Current URL
     * @param {number|null} interactionBaseline - User interaction time for baseline filtering (optional)
     * @param {number|null} routeTriggerTime - Performance timestamp when route change was triggered (for route_change views)
     * @returns {Object} New current view
     */
    startNewView(type, url, interactionBaseline = null, routeTriggerTime = null) {
      const trigger = type === 'initial' ? 'page_load' : 'pushstate';
      console.log(`[Optima ViewManager] 🔄 Starting new ${type} view: ${url} (trigger: ${trigger})`);
      
      // CRITICAL: Clear old observers IMMEDIATELY to prevent contamination
      // This must happen BEFORE the old view is completed to prevent race conditions
      if (this.sdk && typeof this.sdk._resetPerformanceObservers === 'function') {
        this.sdk._resetPerformanceObservers();
      }
      
      // Complete current view if exists and not already completed
      if (this.currentView && !this.currentView.isCompleted) {
        this.completeView('new_view_started');
      }
      
      // Create new view with interaction baseline
      this.currentView = this.createView(type, url, trigger, interactionBaseline, routeTriggerTime);
      this.viewStartTime = this.currentView.startTime;
      
      // Reset collectors for new view (this now mainly resets state, observers already cleared)
      this.resetCollectors();
      
      // Update activity time
      this.updateActivity();
      
      console.log(`[Optima ViewManager] ✅ Started new view: ${this.currentView.id.substring(0, 8)}... (type: ${type}, url: ${url})`);
      
      // Start collectors for the new view (moved here to avoid race condition)
      if (this.sdk && typeof this.sdk.startCollectorsForView === 'function') {
        console.log(`[Optima ViewManager] 🔧 Starting collectors for ${this.currentView.type} view at ${performance.now().toFixed(2)}ms`);
        this.sdk.startCollectorsForView(this.currentView.type);
        
        // Reset continuous metrics for new view
        if (this.sdk.continuousMetrics) {
          this.sdk.continuousMetrics.reset();
        }
        
        console.log(`[Optima ViewManager] ✅ Collectors started for ${this.currentView.type} view`);
      } else {
        console.warn(`[Optima ViewManager] ⚠️ No SDK or startCollectorsForView method available`);
      }
      
      return this.currentView;
    }

    /**
     * Complete the current view and prepare for sending
     * @param {string} reason - Reason for completion
     */
    completeView(reason = 'manual') {
      if (!this.currentView || this.currentView.isCompleted) {
        console.log('[Optima ViewManager] ⚠️ No active view to complete or already completed');
        return;
      }
      
      console.log(`[Optima ViewManager] 🏁 Completing view: ${this.currentView.id.substring(0, 8)}... (reason: ${reason})`);
      
      // Mark view as completed
      this.currentView.isCompleted = true;
      this.currentView.isActive = false;
      this.currentView.completionReason = reason;
      this.currentView.duration = Date.now() - this.currentView.timestamp;
      
      // Log view summary
      this.logViewSummary(this.currentView);
      
      // Archive view to history
      this.archiveView(this.currentView);
      
      // Notify SDK that view is completed (for data sending)
      if (this.sdk && typeof this.sdk._onViewCompleted === 'function') {
        this.sdk._onViewCompleted(this.currentView, reason);
      }
      
      console.log(`[Optima ViewManager] ✅ View completed: ${this.currentView.id.substring(0, 8)}...`);
    }

    /**
     * Archive completed view to history
     * @param {Object} view - View to archive
     */
    archiveView(view) {
      this.viewHistory.push({
        ...view,
        // Keep only essential data in history to save memory
        resources: view.resources.length,
        ajaxRequests: view.ajaxRequests.length,
        errors: view.errors.length,
        events: view.events.length
      });
      
      // Limit history size
      if (this.viewHistory.length > this.maxViewHistory) {
        this.viewHistory.shift();
      }
      
      console.log(`[Optima ViewManager] 📚 Archived view to history. Total views: ${this.viewHistory.length}`);
    }

    /**
     * Reset collectors for new view
     */
    resetCollectors() {
      if (!this.currentView) return;
      
      console.log('[Optima ViewManager] 🔄 Resetting collectors for new view');
      
      // Reset collection state
      this.currentView.collectorState = {
        resourcesCollected: false,
        webVitalsSetup: false,
        errorsSetup: false,
        eventsSetup: false
      };
      
      // Clear processed URLs tracking
      if (this.sdk && this.sdk.collectionState) {
        this.sdk.collectionState.sentResourceURLs = new Set();
      }
    }

    /**
     * Update activity time for current view
     */
    updateActivity() {
      if (this.currentView && this.currentView.isActive) {
        this.currentView.lastActivityTime = Date.now();
      }
    }

    /**
     * Add resource to current view
     * @param {Object} resource - Resource data
     */
    addResource(resource) {
      if (!this.currentView || !this.currentView.isActive) {
        console.warn('[Optima ViewManager] ⚠️ No active view to add resource to');
        return false;
      }
      
      // DETAILED LIFECYCLE TRACKING for releases.bundle.js
      if (resource.name && resource.name.includes('releases.bundle.js')) {
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE - releases.bundle.js being added to view`);
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE - View details:`, {
          viewId: this.currentView.id.substring(0, 8),
          viewType: this.currentView.type,
          currentResourceCount: this.currentView.resources.length,
          isActive: this.currentView.isActive
        });
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE - Resource details:`, {
          name: resource.name,
          type: resource.type,
          size: resource.transfer_size,
          startTime: resource.start_time,
          duration: resource.duration
        });
      }
      
      // Add view-specific metadata
      resource.viewId = this.currentView.id;
      resource.viewType = this.currentView.type;
      
      this.currentView.resources.push(resource);
      this.updateActivity();
      
      if (resource.name && resource.name.includes('releases.bundle.js')) {
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE SUCCESS - releases.bundle.js added to view resources`);
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE - New resource count: ${this.currentView.resources.length}`);
        console.log(`[Optima ViewManager] 🎯 LIFECYCLE - Resource now in view.resources array at index: ${this.currentView.resources.length - 1}`);
      }
      
      return true;
    }

    /**
     * Add AJAX request to current view
     * @param {Object} ajaxRequest - AJAX request data
     */
    addAjaxRequest(ajaxRequest) {
      if (!this.currentView || !this.currentView.isActive) {
        console.warn('[Optima ViewManager] ⚠️ No active view to add AJAX request to');
        return false;
      }
      
      // Add view-specific metadata
      ajaxRequest.viewId = this.currentView.id;
      ajaxRequest.viewType = this.currentView.type;
      
      this.currentView.ajaxRequests.push(ajaxRequest);
      this.updateActivity();
      
      return true;
    }

    /**
     * Add error to current view
     * @param {Object} error - Error data
     */
    addError(error) {
      if (!this.currentView || !this.currentView.isActive) {
        console.warn('[Optima ViewManager] ⚠️ No active view to add error to');
        return false;
      }
      
      // Add view-specific metadata
      error.viewId = this.currentView.id;
      error.viewType = this.currentView.type;
      
      this.currentView.errors.push(error);
      this.updateActivity();
      
      return true;
    }

    /**
     * Add event to current view
     * @param {Object} event - Event data
     */
    addEvent(event) {
      if (!this.currentView || !this.currentView.isActive) {
        console.warn('[Optima ViewManager] ⚠️ No active view to add event to');
        return false;
      }
      
      // Add view-specific metadata
      event.viewId = this.currentView.id;
      event.viewType = this.currentView.type;
      
      this.currentView.events.push(event);
      this.updateActivity();
      
      return true;
    }

    /**
     * Update web vital for current view
     * @param {string} metric - Metric name (LCP, FID, CLS, etc.)
     * @param {number} value - Metric value
     * @param {Object} details - Additional metric details
     */
    updateWebVital(metric, value, details = {}) {
      if (!this.currentView || !this.currentView.isActive) {
        console.warn('[Optima ViewManager] ⚠️ No active view to update web vital');
        return false;
      }
      
      this.currentView.webVitals[metric] = {
        value: value,
        timestamp: Date.now(),
        viewRelativeTime: performance.now() - this.currentView.startTime,
        ...details
      };
      
      this.updateActivity();
      
      // console.log(`[Optima ViewManager] 📊 Updated ${metric}: ${value} for view ${this.currentView.id.substring(0, 8)}...`);
      
      // Notify continuous metrics manager about new web vital
      if (this.sdk && this.sdk.continuousMetrics) {
        this.sdk.continuousMetrics.onWebVitalDetected(metric, value);
      }
      
      return true;
    }

    /**
     * Get current view data for sending
     * @returns {Object|null} Current view data or null
     */
    getCurrentViewData() {
      if (!this.currentView) return null;
      
      return {
        ...this.currentView,
        // Add computed fields
        resourceCount: this.currentView.resources.length,
        ajaxCount: this.currentView.ajaxRequests.length,
        errorCount: this.currentView.errors.length,
        eventCount: this.currentView.events.length
      };
    }

    /**
     * Log view summary for debugging
     * @param {Object} view - View to summarize
     */
    logViewSummary(view) {
      const summary = {
        id: view.id.substring(0, 8) + '...',
        type: view.type,
        url: view.url,
        duration: view.duration,
        resources: view.resources.length,
        ajaxRequests: view.ajaxRequests.length,
        errors: view.errors.length,
        events: view.events.length,
        webVitals: Object.keys(view.webVitals).filter(k => view.webVitals[k]?.value).length
      };
      
      console.log('[Optima ViewManager] 📊 View Summary:', summary);
    }

    /**
     * Get view history for debugging
     * @returns {Array} View history
     */
    getViewHistory() {
      return this.viewHistory;
    }

    /**
     * Check if view is stale (no activity for too long)
     * @param {number} maxIdleTime - Max idle time in ms (default: 30 seconds)
     * @returns {boolean} True if view is stale
     */
    isViewStale(maxIdleTime = 30000) {
      if (!this.currentView || !this.currentView.isActive) return false;
      
      const idleTime = Date.now() - this.currentView.lastActivityTime;
      return idleTime > maxIdleTime;
    }

    /**
     * Force complete stale view
     */
    completeStaleView() {
      if (this.isViewStale()) {
        console.log('[Optima ViewManager] ⏰ Completing stale view');
        this.completeView('stale_timeout');
      }
    }

    /**
     * Get debug information about resource collection
     */
    getResourceCollectionDebug() {
      if (this.sdk && this.sdk.resourceCollector) {
        return this.sdk.resourceCollector.getDebugInfo();
      }
      return null;
    }
  }

  /**
   * Route Change Detection for Optima SDK
   * Handles detection of route changes and triggers view transitions
   */

  /**
   * RouteChangeDetector - Detects various types of route changes
   */
  class RouteChangeDetector {
    constructor(viewManager) {
      this.viewManager = viewManager;
      this.currentUrl = window.location.href;
      this.isSetup = false;
      
      // User interaction tracking for better route change attribution
      this.lastUserInteractionTime = null;
      this.lastUserInteractionType = null;
      this.userInteractionTimeout = 5000; // 5 seconds - interactions older than this are ignored
      
      console.log('[Optima RouteDetector] 🛣️ Route detector initialized');
    }

    /**
     * Setup route change detection
     */
    setupRouteDetection() {
      if (this.isSetup) {
        console.warn('[Optima RouteDetector] ⚠️ Route detection already setup');
        return;
      }
      
      console.log('[Optima RouteDetector] 🔧 Setting up route change detection');
      
      // Setup user interaction tracking first
      this.setupUserInteractionTracking();
      
      // Patch History API for pushState/replaceState detection
      this.patchHistoryAPI();
      
      // Setup popstate listener for back/forward navigation
      this.setupPopstateListener();
      
      // Setup hashchange listener for hash-based routing
      this.setupHashchangeListener();
      
      // Setup mutation observer for dynamic content changes (fallback)
      this.setupMutationObserver();
      
      this.isSetup = true;
      console.log('[Optima RouteDetector] ✅ Route detection setup complete');
    }

    /**
     * Setup user interaction tracking for better route change attribution
     */
    setupUserInteractionTracking() {
      console.log('[Optima RouteDetector] 👆 Setting up user interaction tracking');
      
      // Track clicks
      document.addEventListener('click', (event) => {
        this.recordUserInteraction('click', event);
      }, { capture: true, passive: true });
      
      // Track touch events for mobile
      document.addEventListener('touchstart', (event) => {
        this.recordUserInteraction('touchstart', event);
      }, { capture: true, passive: true });
      
      // Track keyboard navigation (Enter, Space on focusable elements)
      document.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && 
            this.isNavigationElement(event.target)) {
          this.recordUserInteraction('keydown', event);
        }
      }, { capture: true, passive: true });
      
      console.log('[Optima RouteDetector] ✅ User interaction tracking setup complete');
    }

    /**
     * Record user interaction for later use in route change attribution
     * @param {string} type - Type of interaction (click, touchstart, keydown)
     * @param {Event} event - The interaction event
     */
    recordUserInteraction(type, event) {
      const interactionTime = performance.now();
      
      // Only record interactions on potentially navigational elements
      if (this.isNavigationElement(event.target)) {
        this.lastUserInteractionTime = interactionTime;
        this.lastUserInteractionType = type;
        
        console.log(`[Optima RouteDetector] 👆 User interaction recorded: ${type} at ${interactionTime.toFixed(2)}ms on`, {
          tagName: event.target.tagName,
          className: event.target.className,
          id: event.target.id,
          href: event.target.href,
          textContent: event.target.textContent?.substring(0, 50)
        });
      }
    }

    /**
     * Check if an element is likely to trigger navigation
     * @param {Element} element - The target element
     * @returns {boolean} True if element might trigger navigation
     */
    isNavigationElement(element) {
      if (!element || !element.tagName) return false;
      
      const tagName = element.tagName.toLowerCase();
      
      // Direct navigation elements
      if (tagName === 'a' || tagName === 'button') return true;
      
      // Elements with navigation-related attributes
      if (element.hasAttribute('href') || 
          element.hasAttribute('onclick') ||
          element.hasAttribute('data-href') ||
          element.hasAttribute('data-route')) return true;
      
      // Elements with navigation-related classes
      const className = element.className || '';
      if (typeof className === 'string' && 
          (className.includes('nav') || 
           className.includes('link') || 
           className.includes('button') ||
           className.includes('menu') ||
           className.includes('tab'))) return true;
      
      // Check parent elements (up to 3 levels) for navigation context
      let parent = element.parentElement;
      let level = 0;
      while (parent && level < 3) {
        if (this.isNavigationElement(parent)) return true;
        parent = parent.parentElement;
        level++;
      }
      
      return false;
    }

    /**
     * Get the last user interaction time if it's recent enough to be relevant
     * @param {number} currentTime - Current performance.now() time
     * @returns {number|null} Last interaction time or null if too old/unavailable
     */
    getRecentUserInteractionTime(currentTime) {
      if (!this.lastUserInteractionTime) return null;
      
      const timeSinceInteraction = currentTime - this.lastUserInteractionTime;
      
      if (timeSinceInteraction <= this.userInteractionTimeout) {
        return this.lastUserInteractionTime;
      }
      
      return null;
    }

    /**
     * Patch History API to detect pushState and replaceState calls
     */
    patchHistoryAPI() {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      // Patch pushState
      history.pushState = (...args) => {
        // Capture trigger time IMMEDIATELY when event fires
        const triggerTime = performance.now();
        
        // Call original method first
        originalPushState.apply(history, args);
        
        // Handle route change IMMEDIATELY - no setTimeout delay
        this.handleRouteChange('pushstate', window.location.href, triggerTime);
      };
      
      // Patch replaceState
      history.replaceState = (...args) => {
        // Capture trigger time IMMEDIATELY when event fires
        const triggerTime = performance.now();
        
        // Call original method first
        originalReplaceState.apply(history, args);
        
        // Handle route change IMMEDIATELY - no setTimeout delay
        this.handleRouteChange('replacestate', window.location.href, triggerTime);
      };
      
      console.log('[Optima RouteDetector] 🔧 History API patched');
    }

    /**
     * Setup popstate event listener for back/forward navigation
     */
    setupPopstateListener() {
      window.addEventListener('popstate', (event) => {
        // Capture trigger time IMMEDIATELY when event fires
        const triggerTime = performance.now();
        
        // Handle route change IMMEDIATELY - no setTimeout delay
        this.handleRouteChange('popstate', window.location.href, triggerTime);
      });
      
      console.log('[Optima RouteDetector] 🔧 Popstate listener setup');
    }

    /**
     * Setup hashchange event listener for hash-based routing
     */
    setupHashchangeListener() {
      window.addEventListener('hashchange', (event) => {
        // Capture trigger time IMMEDIATELY when event fires
        const triggerTime = performance.now();
        
        // Handle route change immediately for hash changes
        this.handleRouteChange('hashchange', window.location.href, triggerTime);
      });
      
      console.log('[Optima RouteDetector] 🔧 Hashchange listener setup');
    }

    /**
     * Setup mutation observer for dynamic content changes (fallback)
     */
    setupMutationObserver() {
      if (!('MutationObserver' in window)) {
        console.warn('[Optima RouteDetector] ⚠️ MutationObserver not supported');
        return;
      }
      
      // Create observer for significant DOM changes that might indicate route changes
      const observer = new MutationObserver((mutations) => {
        let significantChange = false;
        
        // Capture trigger time IMMEDIATELY when mutation is detected
        const triggerTime = performance.now();
        mutations.forEach((mutation) => {
          // Check for significant changes (new elements added, title changes, etc.)
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if added nodes contain significant content
            const hasSignificantContent = Array.from(mutation.addedNodes).some(node => {
              return node.nodeType === Node.ELEMENT_NODE && 
                     (node.tagName === 'MAIN' || 
                      node.tagName === 'SECTION' || 
                      node.tagName === 'ARTICLE' ||
                      node.classList.contains('page') ||
                      node.classList.contains('view') ||
                      node.classList.contains('route'));
            });
            
            if (hasSignificantContent) {
              significantChange = true;
            }
          }
        });
        
        // If we detected significant changes and URL is different, it might be a route change
        if (significantChange && window.location.href !== this.currentUrl) {
          console.log('[Optima RouteDetector] 🔄 Potential route change detected via DOM mutation');
          // Use immediate handling with a small delay for DOM mutation detection only
          setTimeout(() => {
            this.handleRouteChange('mutation_observer', window.location.href, triggerTime);
          }, 50); // Reduced from 100ms to 50ms for DOM mutations only
        }
      });
      
      // Wait for document.body to be available
      const setupObserver = () => {
        if (document.body) {
          // Observe changes to body and main content areas
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
          });
          console.log('[Optima RouteDetector] 🔧 Mutation observer setup');
        } else {
          // If body is not available yet, wait for DOMContentLoaded
          document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: false
            });
            console.log('[Optima RouteDetector] 🔧 Mutation observer setup (after DOMContentLoaded)');
          });
        }
      };

      // Try to set up immediately or wait for DOMContentLoaded
      setupObserver();
    }

    /**
     * Handle route change and trigger view transition
     * @param {string} method - Method that triggered the change
     * @param {string} newUrl - New URL
     * @param {number} routeTriggerTime - Performance timestamp when route change was triggered
     */
    handleRouteChange(method, newUrl, routeTriggerTime = null) {
      // Use provided trigger time or capture current time as fallback
      const triggerTime = routeTriggerTime || performance.now();
      
      // Validate that URL actually changed
      if (newUrl === this.currentUrl) {
        return;
      }
      
      // Check if this is a meaningful route change (not just query params or hash)
      if (!this.isMeaningfulRouteChange(this.currentUrl, newUrl)) {
        this.currentUrl = newUrl; // Update URL but don't trigger view change
        return;
      }
      
      try {
        // Analyze user interaction timing for better resource attribution
        const recentInteractionTime = this.getRecentUserInteractionTime(triggerTime);
        
        // Determine if we should use user interaction time as baseline
        const shouldUseInteractionBaseline = this.canUseInteractionTimeAsBaseline();
        const interactionBaseline = shouldUseInteractionBaseline ? this.lastUserInteractionTime : null;
        
        // Enhanced route change logging
        console.group(
          `%c🛣️ Route Change Detected %c${method.toUpperCase()}`,
          'color: #10b981; font-weight: bold; font-size: 14px;',
          'color: #ffffff; background: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 12px;'
        );
        
        console.log('%c📊 Route Change Details:', 'color: #6b7280; font-weight: bold;');
        console.table({
          'Method': method,
          'From URL': this.currentUrl,
          'To URL': newUrl,
          'Route Trigger Time': `${triggerTime.toFixed(2)}ms`,
          'Interaction Baseline': interactionBaseline ? `${interactionBaseline.toFixed(2)}ms` : 'Not available',
          'Using Interaction Baseline': shouldUseInteractionBaseline
        });
        
        if (interactionBaseline) {
          const baselineAdvantage = triggerTime - interactionBaseline;
          console.log(`⚡ Baseline advantage: ${baselineAdvantage.toFixed(2)}ms earlier filtering (interaction vs route trigger)`);
          console.log(`👆 Last interaction: ${this.lastUserInteractionType} at ${interactionBaseline.toFixed(2)}ms`);
        }
        
        console.groupEnd();
        
        // Update current URL
        this.currentUrl = newUrl;
        
        // Trigger view change with both baseline times
        this.viewManager.startNewView('route_change', newUrl, interactionBaseline, triggerTime);
        
      } catch (error) {
        console.error('[Optima RouteDetector] ❌ Error processing route change:', error);
      }
    }

    /**
     * Log detailed analysis of user interaction timing for route change attribution
     * @param {number} triggerTime - Route trigger time
     * @param {number|null} interactionTime - Recent user interaction time or null
     * @param {string} method - Route change method
     */
    logInteractionAnalysis(triggerTime, interactionTime, method) {
      console.log(`[Optima RouteDetector] 🔍 INTERACTION ANALYSIS for ${method} route change:`);
      
      if (interactionTime) {
        const timeDiff = triggerTime - interactionTime;
        console.log(`[Optima RouteDetector] ✅ Recent user interaction found!`);
        console.log(`[Optima RouteDetector] 👆 Last interaction: ${this.lastUserInteractionType} at ${interactionTime.toFixed(2)}ms`);
        console.log(`[Optima RouteDetector] ⏱️ Interaction-to-route delay: ${timeDiff.toFixed(2)}ms`);
        console.log(`[Optima RouteDetector] 🎯 CAN USE INTERACTION TIME AS BASELINE: YES`);
        console.log(`[Optima RouteDetector] 📊 Proposed filter time: ${interactionTime.toFixed(2)}ms (interaction time)`);
        
        // Categorize the delay
        if (timeDiff < 100) {
          console.log(`[Optima RouteDetector] ⚡ Category: IMMEDIATE (< 100ms) - Very likely user-initiated`);
        } else if (timeDiff < 500) {
          console.log(`[Optima RouteDetector] 🚀 Category: FAST (100-500ms) - Likely user-initiated`);
        } else if (timeDiff < 1000) {
          console.log(`[Optima RouteDetector] 🐌 Category: SLOW (500-1000ms) - Possibly user-initiated with framework delay`);
        } else {
          console.log(`[Optima RouteDetector] 🦴 Category: VERY SLOW (> 1000ms) - User-initiated but significant framework delay`);
        }
      } else {
        console.log(`[Optima RouteDetector] ❌ No recent user interaction found`);
        console.log(`[Optima RouteDetector] 🎯 CAN USE INTERACTION TIME AS BASELINE: NO`);
        
        if (this.lastUserInteractionTime) {
          const timeDiff = triggerTime - this.lastUserInteractionTime;
          console.log(`[Optima RouteDetector] 👆 Last interaction: ${this.lastUserInteractionType} at ${this.lastUserInteractionTime.toFixed(2)}ms`);
          console.log(`[Optima RouteDetector] ⏱️ Time since last interaction: ${timeDiff.toFixed(2)}ms (too old - threshold: ${this.userInteractionTimeout}ms)`);
          console.log(`[Optima RouteDetector] 📊 Will use fallback: route trigger time - grace period`);
        } else {
          console.log(`[Optima RouteDetector] 👆 No user interactions recorded yet`);
          console.log(`[Optima RouteDetector] 📊 Will use fallback: route trigger time - grace period`);
        }
      }
    }

    /**
     * Analyze user interaction timing for route change attribution
     * @param {string} method - Route change method
     * @param {number} routeTriggerTime - When route change was triggered
     */
    analyzeInteractionTiming(method, routeTriggerTime) {
      console.log(`[Optima RouteDetector] 🔍 INTERACTION ANALYSIS for ${method} route change:`);
      
      const recentInteractionTime = this.getRecentUserInteractionTime(routeTriggerTime);
      
      if (recentInteractionTime) {
        const delay = routeTriggerTime - recentInteractionTime;
        console.log(`[Optima RouteDetector] ✅ Recent user interaction found!`);
        console.log(`[Optima RouteDetector] 👆 Last interaction: ${this.lastUserInteractionType} at ${recentInteractionTime.toFixed(2)}ms`);
        console.log(`[Optima RouteDetector] ⏱️ Interaction-to-route delay: ${delay.toFixed(2)}ms`);
        
        // Determine if we can use interaction time as baseline
        const canUseAsBaseline = delay <= this.userInteractionTimeout;
        console.log(`[Optima RouteDetector] 🎯 CAN USE INTERACTION TIME AS BASELINE: ${canUseAsBaseline ? 'YES' : 'NO'}`);
        
        if (canUseAsBaseline) {
          console.log(`[Optima RouteDetector] 📊 Proposed filter time: ${recentInteractionTime.toFixed(2)}ms (interaction time)`);
          
          // Categorize the delay for debugging
          if (delay < 100) {
            console.log(`[Optima RouteDetector] ⚡ Category: IMMEDIATE (< 100ms) - Very likely user-initiated`);
          } else if (delay < 500) {
            console.log(`[Optima RouteDetector] 🚀 Category: FAST (100-500ms) - User-initiated with normal framework delay`);
          } else if (delay < 1000) {
            console.log(`[Optima RouteDetector] 🐌 Category: SLOW (500-1000ms) - User-initiated but slow framework`);
          } else {
            console.log(`[Optima RouteDetector] 🦴 Category: VERY SLOW (> 1000ms) - User-initiated but significant framework delay`);
          }
        } else {
          console.log(`[Optima RouteDetector] ❌ Interaction too old (${delay.toFixed(2)}ms > ${this.userInteractionTimeout}ms)`);
          console.log(`[Optima RouteDetector] 📊 Will use route trigger time: ${routeTriggerTime.toFixed(2)}ms`);
        }
      } else {
        console.log(`[Optima RouteDetector] ❌ No recent user interaction found`);
        console.log(`[Optima RouteDetector] 📊 Will use route trigger time: ${routeTriggerTime.toFixed(2)}ms`);
        console.log(`[Optima RouteDetector] 🤖 Likely programmatic navigation`);
      }
    }

    /**
     * Determine if user interaction time can be used as baseline for resource filtering
     * @returns {boolean} True if interaction time should be used as baseline
     */
    canUseInteractionTimeAsBaseline() {
      if (!this.lastUserInteractionTime) {
        return false;
      }
      
      const now = performance.now();
      const timeSinceInteraction = now - this.lastUserInteractionTime;
      
      // Only use interaction time if it's recent enough
      return timeSinceInteraction <= this.userInteractionTimeout;
    }

    /**
     * Determine if route change is meaningful (not just query params or hash)
     * @param {string} oldUrl - Previous URL
     * @param {string} newUrl - New URL
     * @returns {boolean} True if meaningful route change
     */
    isMeaningfulRouteChange(oldUrl, newUrl) {
      try {
        const oldUrlObj = new URL(oldUrl);
        const newUrlObj = new URL(newUrl);
        
        // Different origins are always meaningful
        if (oldUrlObj.origin !== newUrlObj.origin) {
          console.log('[Route detector**]: #1');
          return true;
        }
        
        // Different pathnames are always meaningful
        if (oldUrlObj.pathname !== newUrlObj.pathname) {
          console.log('[Route detector**]: #2');
          return true;
        }
        
        // Hash-only changes are meaningful for hash-based routing
        if (oldUrlObj.hash !== newUrlObj.hash && 
            (oldUrlObj.hash.length > 1 || newUrlObj.hash.length > 1)) {
          console.log('[Route detector**]: #3');
          return true;
        }
        
        return false;
        
      } catch (error) {
        console.error('[Optima RouteDetector] ❌ Error parsing URLs for comparison:', error);
        // If we can't parse URLs, assume it's meaningful to be safe
        return true;
      }
    }

    /**
     * Manually trigger a route change (for programmatic use)
     * @param {string} url - New URL
     * @param {string} method - Method identifier
     */
    triggerRouteChange(url, method = 'manual') {
      console.log(`[Optima RouteDetector] 🔧 Manual route change triggered: ${url}`);
      
      // Capture trigger time IMMEDIATELY when manual trigger is called
      const triggerTime = performance.now();
      console.log('😎😎 5', triggerTime);
      
      this.handleRouteChange(method, url, triggerTime);
    }

    /**
     * Get current URL
     * @returns {string} Current URL
     */
    getCurrentUrl() {
      return this.currentUrl;
    }

    /**
     * Check if route detection is setup
     * @returns {boolean} True if setup
     */
    isRouteDetectionSetup() {
      return this.isSetup;
    }

    /**
     * Force URL sync (useful after external navigation)
     */
    syncUrl() {
      const actualUrl = window.location.href;
      if (actualUrl !== this.currentUrl) {
        console.log('[Optima RouteDetector] 🔄 Syncing URL:', actualUrl);
        this.currentUrl = actualUrl;
      }
    }

    /**
     * Cleanup route detection (for testing or shutdown)
     */
    cleanup() {
      console.log('[Optima RouteDetector] 🧹 Cleaning up route detection');
      
      // Note: We can't easily unpatch history API without storing original references
      // This is acceptable for most use cases as the SDK typically runs for the page lifetime
      
      this.isSetup = false;
    }
  }

  /**
   * View-Based Data Sender for Optima SDK
   * Handles smart data synchronization with immediate and batched sending
   */

  /**
   * ViewBasedDataSender - Manages data sending strategy for view-based architecture
   */
  class ViewBasedDataSender {
    constructor(sdk) {
      this.sdk = sdk;
      this.sendQueue = [];
      this.batchTimer = null;
      this.maxBatchSize = 3;
      this.batchTimeout = 5000; // 5 seconds
      this.isProcessing = false;
      
      // Track which views have had their initial session created
      this.createdViewSessions = new Set();
      
      console.log('[Optima DataSender] 📤 Data sender initialized');
    }

    /**
     * Send view data with appropriate strategy
     * @param {Object} view - View object with collected data
     * @param {string} trigger - What triggered the send
     */
    sendViewData(view, trigger = 'completed') {
      if (!view || !this.sdk.sessionId) {
        console.warn('[Optima DataSender] ⚠️ Cannot send view data: missing view or session');
        return;
      }
      
      console.log(`[Optima DataSender] 📦 Preparing to send view data: ${view.id.substring(0, 8)}... (trigger: ${trigger})`);
      
      // Mark this view as having its session created
      this.createdViewSessions.add(view.id);
      
      // Format payload for server
      const payload = this.formatViewPayload(view, trigger);
      
      // Determine sending strategy
      if (this.shouldSendImmediately(trigger, view.type)) {
        this.sendImmediate(payload);
      } else {
        this.queueForBatch(payload);
      }
    }

    /**
     * Format view data into server payload
     * @param {Object} view - View object
     * @param {string} trigger - Send trigger
     * @returns {Object} Formatted payload
     */
    formatViewPayload(view, trigger) {
      console.log(`[Optima DataSender] 🔍 Formatting payload for view: ${view.id.substring(0, 8)}...`);
      console.log(`[Optima DataSender] 📊 View data summary:`, {
        resources: view.resources?.length || 0,
        ajaxRequests: view.ajaxRequests?.length || 0,
        errors: view.errors?.length || 0,
        events: view.events?.length || 0,
        webVitals: Object.keys(view.webVitals || {}).length
      });
      
      // Track resources specifically
      if (view.resources && view.resources.length > 0) {
        console.log(`[Optima DataSender] 📦 RESOURCES TO SEND (${view.resources.length}):`);
        
        // Log each resource with key details
        view.resources.forEach((resource, index) => {
          const isJsFile = resource.name && (resource.name.endsWith('.js') || resource.name.includes('.bundle.'));
          const logPrefix = isJsFile ? '🟨 JS/BUNDLE' : '📄 RESOURCE';
          
          console.log(`[Optima DataSender] ${logPrefix} ${index + 1}: ${resource.name || 'unknown'} (type: ${resource.initiatorType || 'unknown'}, size: ${resource.transferSize || 0})`);
          
          // Special attention to releases.bundle.js
          if (resource.name && resource.name.includes('releases.bundle.js')) {
            console.log(`[Optima DataSender] 🎯 FOUND releases.bundle.js! Details:`, {
              name: resource.name,
              type: resource.initiatorType,
              size: resource.transferSize,
              startTime: resource.startTime,
              duration: resource.duration,
              viewId: view.id.substring(0, 8)
            });
          }
        });
        
        // Summary of JS/bundle files
        const jsFiles = view.resources.filter(r => r.name && (r.name.endsWith('.js') || r.name.includes('.bundle.')));
        console.log(`[Optima DataSender] 🟨 JS/Bundle files in payload: ${jsFiles.length}/${view.resources.length}`);
      } else {
        console.log(`[Optima DataSender] ⚠️ NO RESOURCES to send for view ${view.id.substring(0, 8)}`);
      }
      
      const payload = {
        // Session identification
        session_id: this.sdk.sessionId,
        session_type: view.type, // 'initial' or 'route_change'
        view_id: view.id,
        
        // Trigger and timing info
        trigger: trigger,
        timestamp: view.timestamp,
        url: view.url,
        duration: view.duration,
        completion_reason: view.completionReason,
        
        // View-specific data (maintaining existing structure)
        web_vitals: this.formatWebVitals(view.webVitals, view.type),
        resources: view.resources || [],
        ajax_requests: view.ajaxRequests || [],
        errors: view.errors || [],
        events: view.events || [],
        
        // Complete metadata (same as legacy SDK)
        meta: this.sdk.generateMetadata(),
        
        // View-specific metadata
        view_metadata: {
          start_time: view.startTime,
          last_activity: view.lastActivityTime,
          resource_count: view.resources?.length || 0,
          ajax_count: view.ajaxRequests?.length || 0,
          error_count: view.errors?.length || 0,
          event_count: view.events?.length || 0,
          web_vitals_count: Object.keys(view.webVitals).filter(k => view.webVitals[k]?.value).length
        },
        
        // Send metadata
        send_timestamp: Date.now(),
        send_strategy: this.shouldSendImmediately(trigger, view.type) ? 'immediate' : 'batch'
      };
      
      return payload;
    }

    /**
     * Format web vitals for sending
     * @param {Object} webVitals - Web vitals object
     * @param {string} sessionType - Session type ('initial' or 'route_change')
     * @returns {Object} Formatted web vitals
     */
    formatWebVitals(webVitals, sessionType) {
      const formatted = {};
      
      // Define which metrics are only applicable for initial page load
      const initialLoadOnlyMetrics = ['LCP', 'FCP', 'FID', 'TTFB'];
      
      console.log(`[Optima DataSender] 🔍 Formatting web vitals for ${sessionType} session:`);
      
      Object.keys(webVitals).forEach(metric => {
        if (webVitals[metric]?.value !== null && webVitals[metric]?.value !== undefined) {
          
          // Filter out initial-load-only metrics for route changes
          if (sessionType === 'route_change' && initialLoadOnlyMetrics.includes(metric)) {
            console.log(`[Optima DataSender] 🚫 Filtering out ${metric} for route change session`);
            return; // Skip this metric
          }
          
          console.log(`[Optima DataSender] ✅ Including ${metric} = ${webVitals[metric].value} for ${sessionType}`);
          
          formatted[metric] = {
            value: webVitals[metric].value,
            timestamp: webVitals[metric].timestamp,
            view_relative_time: webVitals[metric].viewRelativeTime,
            ...webVitals[metric] // Include any additional details
          };
        } else {
          console.log(`[Optima DataSender] ⚠️ Skipping ${metric} - no valid value (${webVitals[metric]?.value})`);
        }
      });
      
      console.log(`[Optima DataSender] 📊 Final formatted web vitals count: ${Object.keys(formatted).length}`);
      
      return formatted;
    }

    /**
     * Determine if data should be sent immediately
     * @param {string} trigger - Send trigger
     * @param {string} viewType - View type
     * @returns {boolean} True if should send immediately
     */
    shouldSendImmediately(trigger, viewType) {
      // Route changes should send immediately
      if (trigger === 'new_view_started' && viewType === 'route_change') {
        return true;
      }
      
      // Route change completions should send immediately
      if (trigger === 'route_change_trigger') {
        return true;
      }
      
      // Page unload/visibility changes should send immediately
      if (trigger === 'page_unload' || trigger === 'page_hidden') {
        return true;
      }
      
      // Error conditions should send immediately
      if (trigger === 'error' || trigger === 'critical_error') {
        return true;
      }
      
      // Everything else can be batched
      return false;
    }

    /**
     * Send data immediately
     * @param {Object} payload - Data payload
     */
    sendImmediate(payload) {
      console.log(`[Optima DataSender] 🚀 Sending immediately: ${payload.view_id.substring(0, 8)}...`);
      
      this.performSend(payload, {
        immediate: true,
        sync: payload.trigger === 'page_unload' || payload.trigger === 'page_hidden'
      });
    }

    /**
     * Queue data for batch sending
     * @param {Object} payload - Data payload
     */
    queueForBatch(payload) {
      console.log(`[Optima DataSender] 📋 Queuing for batch: ${payload.view_id.substring(0, 8)}...`);
      
      this.sendQueue.push(payload);
      
      // Process queue if it's full
      if (this.sendQueue.length >= this.maxBatchSize) {
        this.processBatchQueue();
      } else {
        // Set/reset batch timer
        this.setBatchTimer();
      }
    }

    /**
     * Set batch timer for automatic processing
     */
    setBatchTimer() {
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      this.batchTimer = setTimeout(() => {
        this.processBatchQueue();
      }, this.batchTimeout);
    }

    /**
     * Process the batch queue
     */
    processBatchQueue() {
      if (this.sendQueue.length === 0 || this.isProcessing) {
        return;
      }
      
      console.log(`[Optima DataSender] 📦 Processing batch queue: ${this.sendQueue.length} items`);
      
      this.isProcessing = true;
      
      // Clear batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      
      // Process all queued items
      const batch = [...this.sendQueue];
      this.sendQueue = [];
      
      // Send each item in the batch
      batch.forEach((payload, index) => {
        setTimeout(() => {
          this.performSend(payload, { batch: true, batchIndex: index, batchSize: batch.length });
        }, index * 100); // Stagger sends by 100ms to avoid overwhelming server
      });
      
      // Reset processing flag after all sends are initiated
      setTimeout(() => {
        this.isProcessing = false;
      }, batch.length * 100 + 500);
    }

    /**
     * Perform the actual send operation
     * @param {Object} payload - Data payload
     * @param {Object} options - Send options
     */
    performSend(payload, options = {}) {
      try {
        // Add send options to payload
        payload.send_options = {
          immediate: options.immediate || false,
          sync: options.sync || false,
          batch: options.batch || false,
          batch_index: options.batchIndex,
          batch_size: options.batchSize
        };
        
        // Enhanced logging for better traceability
        const requestType = payload.type || 'view_completion';
        const sessionType = payload.session_type || 'unknown';
        const sendMethod = options.immediate ? 'immediate' : 'batch';
        
        console.log(`[Optima DataSender] 📤 SENDING ${requestType.toUpperCase()}: view=${payload.view_id.substring(0, 8)}..., session_type=${sessionType}, method=${sendMethod}`);
        
        if (payload.trigger) {
          console.log(`[Optima DataSender] 🔍 Trigger: ${payload.trigger}`);
        }
        
        // Use SDK's send method
        this.sdk._sendToServer('/api/optima/collect', payload, {
          sync: options.sync,
          immediate: options.immediate
        });
        
        console.log(`[Optima DataSender] ✅ SENT ${requestType.toUpperCase()}: view=${payload.view_id.substring(0, 8)}..., session_type=${sessionType}`);
        
      } catch (error) {
        console.error('[Optima DataSender] ❌ Error sending view data:', error);
        
        // For critical sends, try fallback
        if (options.immediate && !options.sync) {
          console.log('[Optima DataSender] 🔄 Retrying with sync send');
          try {
            this.sdk._sendToServer('/api/optima/collect', payload, { sync: true });
          } catch (fallbackError) {
            console.error('[Optima DataSender] ❌ Fallback send also failed:', fallbackError);
          }
        }
      }
    }

    /**
     * Send continuous metric update
     * @param {Object} update - Metric update data
     */
    sendContinuousUpdate(update) {
      if (!update || !this.sdk.sessionId) {
        console.warn('[Optima DataSender] ⚠️ Cannot send continuous update: missing data or session');
        return;
      }
      
      console.log(`[Optima DataSender] 📊 Preparing continuous update for view: ${update.view_id.substring(0, 8)}...`);
      console.log(`[Optima DataSender] 📊 Update includes (ALL from view session start): web_vitals=${Object.keys(update.web_vitals || {}).length}, resources=${(update.resources || []).length}, ajax=${(update.ajax_requests || []).length}, errors=${(update.errors || []).length}`);
      
      // Track resources in continuous updates (now sending ALL resources from view session start)
      if (update.resources && update.resources.length > 0) {
        console.log(`[Optima DataSender] 📦 CONTINUOUS UPDATE - ALL RESOURCES FROM VIEW SESSION START (${update.resources.length}):`);
        
        update.resources.forEach((resource, index) => {
          const isJsFile = resource.name && (resource.name.endsWith('.js') || resource.name.includes('.bundle.'));
          const logPrefix = isJsFile ? '🟨 JS/BUNDLE' : '📄 RESOURCE';
          
          console.log(`[Optima DataSender] ${logPrefix} ${index + 1}: ${resource.name || 'unknown'} (type: ${resource.initiatorType || 'unknown'}, size: ${resource.transferSize || 0})`);
          
          // Special attention to releases.bundle.js
          if (resource.name && resource.name.includes('releases.bundle.js')) {
            console.log(`[Optima DataSender] 🎯 CONTINUOUS UPDATE - FOUND releases.bundle.js! Details:`, {
              name: resource.name,
              type: resource.initiatorType,
              size: resource.transferSize,
              startTime: resource.startTime,
              duration: resource.duration,
              viewId: update.view_id.substring(0, 8),
              updateType: 'continuous_all_from_view_start'
            });
          }
        });
        
        const jsFiles = update.resources.filter(r => r.name && (r.name.endsWith('.js') || r.name.includes('.bundle.')));
        console.log(`[Optima DataSender] 🟨 JS/Bundle files in continuous update (ALL from view start): ${jsFiles.length}/${update.resources.length}`);
      }
      
      // Get current view to determine session_type
      const currentView = this.sdk.viewManager?.currentView;
      
      // Check if this view has had its session created yet
      const hasSessionCreated = this.createdViewSessions.has(update.view_id);
      
      const sessionType = currentView?.type || 'initial';
      
      const payload = {
        session_id: this.sdk.sessionId,
        session_type: sessionType,
        view_id: update.view_id,
        type: 'continuous_update',
        web_vitals: this.formatWebVitals(update.web_vitals || {}, sessionType),
        resources: update.resources || [],
        ajax_requests: update.ajax_requests || [],
        errors: update.errors || [],
        timestamp: update.timestamp,
        send_timestamp: Date.now(),
        // Only mark as update-only if session has been created
        is_update_only: hasSessionCreated,
        // Include complete metadata
        meta: this.sdk.generateMetadata()
      };
      
      console.log(`[Optima DataSender] 🔍 View session exists: ${hasSessionCreated}, is_update_only: ${hasSessionCreated}`);
      
      // If this is the first update for this view, mark session as created
      if (!hasSessionCreated) {
        this.createdViewSessions.add(update.view_id);
      }
      
      // Continuous updates are sent immediately but non-blocking
      // Add 3-second delay for updates when session has been created
      if (hasSessionCreated) {
        console.log(`[Optima DataSender] ⏳ Delaying performSend by 3 seconds for existing session view: ${update.view_id.substring(0, 8)}...`);
        setTimeout(() => {
          this.performSend(payload, { immediate: true, sync: false });
        }, 3000);
      } else {
        this.performSend(payload, { immediate: true, sync: false });
      }
    }

    /**
     * Force flush all queued data (for page unload)
     */
    forceFlush() {
      console.log('[Optima DataSender] 🚨 Force flushing all queued data');
      
      if (this.sendQueue.length > 0) {
        // Send all queued items immediately with sync
        this.sendQueue.forEach(payload => {
          payload.trigger = 'force_flush';
          this.performSend(payload, { immediate: true, sync: true });
        });
        
        this.sendQueue = [];
      }
      
      // Clear batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
    }

    /**
     * Get queue status for debugging
     * @returns {Object} Queue status
     */
    getQueueStatus() {
      return {
        queueLength: this.sendQueue.length,
        isProcessing: this.isProcessing,
        hasBatchTimer: !!this.batchTimer,
        maxBatchSize: this.maxBatchSize,
        batchTimeout: this.batchTimeout
      };
    }

    /**
     * Update sending configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
      if (config.maxBatchSize) this.maxBatchSize = config.maxBatchSize;
      if (config.batchTimeout) this.batchTimeout = config.batchTimeout;
      
      console.log('[Optima DataSender] ⚙️ Configuration updated:', { 
        maxBatchSize: this.maxBatchSize, 
        batchTimeout: this.batchTimeout 
      });
    }

    /**
     * Remove view from created sessions tracking (when view is completed)
     * @param {string} viewId - View ID to remove
     */
    markViewCompleted(viewId) {
      if (this.createdViewSessions.has(viewId)) {
        console.log(`[Optima DataSender] ✅ Marking view as completed: ${viewId.substring(0, 8)}...`);
        // Keep the view in the set for a while in case there are delayed continuous updates
        setTimeout(() => {
          this.createdViewSessions.delete(viewId);
          console.log(`[Optima DataSender] 🧹 Cleaned up view tracking: ${viewId.substring(0, 8)}...`);
        }, 30000); // Clean up after 30 seconds
      }
    }

    /**
     * Cleanup data sender
     */
    cleanup() {
      console.log('[Optima DataSender] 🧹 Cleaning up data sender');
      
      // Force flush any remaining data
      this.forceFlush();
      
      // Clear timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      
      // Clear view tracking
      this.createdViewSessions.clear();
      
      this.isProcessing = false;
    }
  }

  /**
   * Continuous Metrics Manager for Optima SDK
   * Handles background updates for metrics that continue throughout view lifetime
   */

  /**
   * ContinuousMetricsManager - Manages continuous metric updates
   */
  class ContinuousMetricsManager {
    constructor(viewManager, dataSender) {
      this.viewManager = viewManager;
      this.dataSender = dataSender;
      this.updateInterval = null;
      this.lastSentMetrics = {};
      this.updateIntervalMs = 10000; // 10 seconds
      this.isTracking = false;
      this.significantChangeThresholds = {
        CLS: 0.01,  // 0.01 CLS score change
        INP: 50     // 50ms INP change
      };
      
      console.log('[Optima ContinuousMetrics] 📊 Continuous metrics manager initialized');
    }

    /**
     * Start continuous metrics tracking
     */
    startContinuousTracking() {
      if (this.isTracking) {
        console.warn('[Optima ContinuousMetrics] ⚠️ Continuous tracking already started');
        return;
      }
      
      console.log('[Optima ContinuousMetrics] 🚀 Starting continuous metrics tracking');
      
      this.isTracking = true;
      this.lastSentMetrics = {};
      
      // Start periodic updates
      this.updateInterval = setInterval(() => {
        this.checkAndSendUpdates();
      }, this.updateIntervalMs);
      
      // Also send updates on significant metric changes (via event listeners)
      this.setupChangeDetection();
    }

    /**
     * Stop continuous metrics tracking
     */
    stopContinuousTracking() {
      if (!this.isTracking) return;
      
      console.log('[Optima ContinuousMetrics] 🛑 Stopping continuous metrics tracking');
      
      this.isTracking = false;
      
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      
      this.lastSentMetrics = {};
    }

    /**
     * Setup change detection for immediate updates on significant changes
     */
    setupChangeDetection() {
      // Monitor for significant CLS changes
      this.setupCLSChangeDetection();
      
      // Monitor for significant INP changes
      this.setupINPChangeDetection();
    }

    /**
     * Setup CLS change detection
     */
    setupCLSChangeDetection() {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const clsObserver = new PerformanceObserver((list) => {
          if (!this.isTracking || !this.viewManager.currentView?.isActive) return;
          
          const entries = list.getEntries();
          let hasSignificantChange = false;
          
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              hasSignificantChange = true;
            }
          });
          
          // If we detected significant CLS changes, check for updates sooner
          if (hasSignificantChange) {
            setTimeout(() => {
              this.checkAndSendUpdates();
            }, 1000); // Check after 1 second delay
          }
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: false });
        
      } catch (error) {
        console.error('[Optima ContinuousMetrics] ❌ Error setting up CLS change detection:', error);
      }
    }

    /**
     * Setup INP change detection
     */
    setupINPChangeDetection() {
      // Listen for interaction events that might affect INP
      const eventTypes = ['click', 'keydown', 'pointerdown'];
      
      eventTypes.forEach(type => {
        document.addEventListener(type, () => {
          if (!this.isTracking || !this.viewManager.currentView?.isActive) return;
          
          // Check for INP updates after interactions
          setTimeout(() => {
            this.checkForINPUpdate();
          }, 500); // Check after 500ms to allow for processing
        }, { passive: true });
      });
    }

    /**
     * Check specifically for INP updates
     */
    checkForINPUpdate() {
      if (!this.viewManager.currentView?.isActive) return;
      
      const currentINP = this.viewManager.currentView.webVitals.INP?.value;
      const lastSentINP = this.lastSentMetrics.INP;
      
      if (currentINP && this.hasSignificantINPChange(currentINP, lastSentINP)) {
        console.log('[Optima ContinuousMetrics] 🖱️ Significant INP change detected, sending update');
        this.sendContinuousUpdate();
      }
    }

    /**
     * Check for metric updates and send if significant changes detected
     */
    checkAndSendUpdates() {
      if (!this.isTracking || !this.viewManager.currentView?.isActive) {
        return;
      }
      
      const currentMetrics = this.getCurrentContinuousMetrics();
      
      if (this.hasSignificantChanges(currentMetrics)) {
        console.log('[Optima ContinuousMetrics] 📊 Significant changes detected, sending update');
        this.sendContinuousUpdate();
      }
    }

    /**
     * Get current continuous metrics from active view
     * @returns {Object} Current continuous metrics and data
     */
    getCurrentContinuousMetrics() {
      if (!this.viewManager.currentView) return {};
      
      const currentView = this.viewManager.currentView;
      const webVitals = currentView.webVitals;
      const isInitialLoad = currentView.type === 'initial';
      
      // Define which metrics are appropriate for each view type
      const continuousMetrics = ['CLS', 'INP', 'loading_time'];
      const initialLoadOnlyMetrics = ['LCP', 'FCP', 'FID', 'TTFB'];
      
      const result = {
        webVitals: {},
        resourceCount: currentView.resources?.length || 0,
        ajaxCount: currentView.ajaxRequests?.length || 0,
        errorCount: currentView.errors?.length || 0
      };
      
      // Always include continuous metrics
      continuousMetrics.forEach(metric => {
        result.webVitals[metric] = webVitals[metric]?.value || null;
      });
      
      // Only include initial-load-only metrics for initial page load
      if (isInitialLoad) {
        initialLoadOnlyMetrics.forEach(metric => {
          result.webVitals[metric] = webVitals[metric]?.value || null;
        });
      } else {
        // For route changes, explicitly set initial-load-only metrics to null
        initialLoadOnlyMetrics.forEach(metric => {
          result.webVitals[metric] = null;
        });
        console.log('[Optima ContinuousMetrics] 🚫 Excluding initial-load-only metrics for route change view');
      }
      
      return result;
    }

    /**
     * Check if there are significant changes in metrics
     * @param {Object} currentMetrics - Current metric values
     * @returns {boolean} True if significant changes detected
     */
    hasSignificantChanges(currentMetrics) {
      const lastMetrics = this.lastSentMetrics;
      
      // Check web vitals changes
      if (this.hasSignificantWebVitalsChange(currentMetrics.webVitals, lastMetrics.webVitals)) {
        return true;
      }
      
      // Check for new resources, AJAX requests, or errors
      if (this.hasSignificantDataChange(currentMetrics, lastMetrics)) {
        return true;
      }
      
      // If no metrics were sent before and we have data now
      if (Object.keys(lastMetrics).length === 0 && this.hasAnyData(currentMetrics)) {
        return true;
      }
      
      return false;
    }

    /**
     * Check for significant web vitals changes
     * @param {Object} current - Current web vitals
     * @param {Object} last - Last sent web vitals
     * @returns {boolean} True if significant change
     */
    hasSignificantWebVitalsChange(current, last = {}) {
      // Check CLS changes
      if (this.hasSignificantCLSChange(current.CLS, last.CLS)) {
        return true;
      }
      
      // Check INP changes
      if (this.hasSignificantINPChange(current.INP, last.INP)) {
        return true;
      }
      
      // Check for new web vitals (LCP, FCP, FID, TTFB, loading_time)
      const newVitals = ['LCP', 'FCP', 'FID', 'TTFB', 'loading_time'];
      for (const vital of newVitals) {
        if (current[vital] !== null && (last[vital] === null || last[vital] === undefined)) {
          console.log(`[Optima ContinuousMetrics] 🆕 New ${vital} detected: ${current[vital]}`);
          return true;
        }
      }
      
      return false;
    }

    /**
     * Check for significant data changes (resources, AJAX, errors)
     * @param {Object} current - Current metrics
     * @param {Object} last - Last sent metrics
     * @returns {boolean} True if significant change
     */
    hasSignificantDataChange(current, last = {}) {
      // Check for new resources (threshold: 5 new resources)
      if (current.resourceCount > (last.resourceCount || 0) && 
          current.resourceCount - (last.resourceCount || 0) >= 5) {
        console.log(`[Optima ContinuousMetrics] 📦 Significant resource increase: ${current.resourceCount} (+${current.resourceCount - (last.resourceCount || 0)})`);
        return true;
      }
      
      // Check for new AJAX requests (threshold: 3 new requests)
      if (current.ajaxCount > (last.ajaxCount || 0) && 
          current.ajaxCount - (last.ajaxCount || 0) >= 3) {
        console.log(`[Optima ContinuousMetrics] 🌐 Significant AJAX increase: ${current.ajaxCount} (+${current.ajaxCount - (last.ajaxCount || 0)})`);
        return true;
      }
      
      // Check for new errors (threshold: any new error)
      if (current.errorCount > (last.errorCount || 0)) {
        console.log(`[Optima ContinuousMetrics] ❌ New errors detected: ${current.errorCount} (+${current.errorCount - (last.errorCount || 0)})`);
        return true;
      }
      
      return false;
    }

    /**
     * Check if current metrics have any data
     * @param {Object} metrics - Metrics to check
     * @returns {boolean} True if has any data
     */
    hasAnyData(metrics) {
      // Has any web vitals
      const hasWebVitals = Object.values(metrics.webVitals || {}).some(value => value !== null);
      
      // Has any resources, AJAX, or errors
      const hasData = metrics.resourceCount > 0 || metrics.ajaxCount > 0 || metrics.errorCount > 0;
      
      return hasWebVitals || hasData;
    }

    /**
     * Check for significant CLS change
     * @param {number} current - Current CLS value
     * @param {number} last - Last sent CLS value
     * @returns {boolean} True if significant change
     */
    hasSignificantCLSChange(current, last) {
      if (current === null || current === undefined) return false;
      if (last === null || last === undefined) return current > 0;
      
      const change = Math.abs(current - last);
      return change >= this.significantChangeThresholds.CLS;
    }

    /**
     * Check for significant INP change
     * @param {number} current - Current INP value
     * @param {number} last - Last sent INP value
     * @returns {boolean} True if significant change
     */
    hasSignificantINPChange(current, last) {
      if (current === null || current === undefined) return false;
      if (last === null || last === undefined) return current > 0;
      
      const change = Math.abs(current - last);
      return change >= this.significantChangeThresholds.INP;
    }

    /**
     * Send continuous metric update
     */
    sendContinuousUpdate() {
      if (!this.viewManager.currentView?.isActive) return;
      
      const currentMetrics = this.getCurrentContinuousMetrics();
      const currentView = this.viewManager.currentView;
      
      // Prepare comprehensive update payload
      const update = {
        view_id: currentView.id,
        web_vitals: {},
        resources: [],
        ajax_requests: [],
        errors: [],
        timestamp: Date.now()
      };
      
      // Include web vitals that have values and are appropriate for the view type
      const isInitialLoad = currentView.type === 'initial';
      const continuousMetrics = ['CLS', 'INP', 'loading_time'];
      const initialLoadOnlyMetrics = ['LCP', 'FCP', 'FID', 'TTFB'];
      
      // Determine which metrics to include based on view type
      const allowedMetrics = isInitialLoad 
        ? [...continuousMetrics, ...initialLoadOnlyMetrics]  // All metrics for initial load
        : continuousMetrics;  // Only continuous metrics for route changes
      
      const webVitalsMap = {
        LCP: 'LCP',
        FCP: 'FCP', 
        FID: 'FID',
        CLS: 'CLS',
        INP: 'INP',
        TTFB: 'TTFB',
        loading_time: 'loading_time'
      };
      
      Object.entries(webVitalsMap).forEach(([key, vitalName]) => {
        // Only include metrics that are allowed for this view type
        if (allowedMetrics.includes(key) && 
            currentMetrics.webVitals[key] !== null && 
            currentView.webVitals[key]) {
          console.log(`[Optima ContinuousMetrics] ✅ Including ${vitalName} = ${currentMetrics.webVitals[key]} for ${currentView.type} view`);
          
          update.web_vitals[vitalName] = {
            value: currentMetrics.webVitals[key],
            timestamp: currentView.webVitals[key].timestamp,
            view_relative_time: currentView.webVitals[key].viewRelativeTime,
            // Include metric-specific details
            ...(key === 'CLS' && {
              lastShiftTime: currentView.webVitals[key].lastShiftTime,
              lastShiftValue: currentView.webVitals[key].lastShiftValue,
              shiftSource: currentView.webVitals[key].shiftSource,
              hadRecentInput: currentView.webVitals[key].hadRecentInput
            }),
            ...(key === 'INP' && {
              interaction_type: currentView.webVitals[key].interactionType,
              target: currentView.webVitals[key].target,
              processing_time: currentView.webVitals[key].processingTime,
              input_delay: currentView.webVitals[key].inputDelay,
              manual: currentView.webVitals[key].manual
            }),
            ...(key === 'LCP' && {
              element: currentView.webVitals[key].element,
              url: currentView.webVitals[key].url,
              absolute_time: currentView.webVitals[key].absoluteTime,
              attribution: currentView.webVitals[key].attribution,
              entry: currentView.webVitals[key].entry,
              source: currentView.webVitals[key].source
            }),
            ...(key === 'FID' && {
              absolute_time: currentView.webVitals[key].absoluteTime,
              processing_time: currentView.webVitals[key].processingTime,
              interaction_type: currentView.webVitals[key].interactionType,
              target: currentView.webVitals[key].target,
              source: currentView.webVitals[key].source
            }),
            ...(key === 'FCP' && {
              absolute_time: currentView.webVitals[key].absoluteTime,
              source: currentView.webVitals[key].source
            }),
            ...(key === 'TTFB' && {
              domain_lookup: currentView.webVitals[key].domainLookup,
              connection: currentView.webVitals[key].connection,
              request: currentView.webVitals[key].request,
              tls: currentView.webVitals[key].tls
            }),
            ...(key === 'loading_time' && {
              reason: currentView.webVitals[key].reason,
              activity_sources: currentView.webVitals[key].activitySources,
              detailed_activities: currentView.webVitals[key].detailedActivities,
              view_type: currentView.webVitals[key].viewType,
              baseline_time: currentView.webVitals[key].baselineTime,
              end_time: currentView.webVitals[key].endTime
            })
          };
        } else if (!allowedMetrics.includes(key) && !isInitialLoad) {
          console.log(`[Optima ContinuousMetrics] 🚫 Skipping ${vitalName} for route change view`);
        } else if (allowedMetrics.includes(key)) {
          // Metric is allowed but has no value - log for debugging
          console.log(`[Optima ContinuousMetrics] ⚠️ ${vitalName} allowed for ${currentView.type} but no value: currentMetrics=${currentMetrics.webVitals[key]}, viewVitals=${currentView.webVitals[key] ? 'exists' : 'null'}`);
        }
      });
      
      // Include ALL resources since view session started (not just new ones since last update)
      if (currentView.resources && currentView.resources.length > 0) {
        update.resources = currentView.resources; // Send all resources from the view session
        console.log(`[Optima ContinuousMetrics] 📦 Including ALL ${update.resources.length} resources from view session start`);
        
        // DETAILED LIFECYCLE TRACKING for releases.bundle.js
        const releasesBundleInUpdate = update.resources.find(r => r.name && r.name.includes('releases.bundle.js'));
        if (releasesBundleInUpdate) {
          console.log(`[Optima ContinuousMetrics] 🎯 LIFECYCLE - releases.bundle.js is included in continuous update!`);
          console.log(`[Optima ContinuousMetrics] 🎯 LIFECYCLE - Update details:`, {
            totalResourcesFromViewStart: update.resources.length,
            currentResourceCount: currentView.resources.length,
            releasesBundleIndex: update.resources.findIndex(r => r.name && r.name.includes('releases.bundle.js')),
            releasesBundleDetails: {
              name: releasesBundleInUpdate.name,
              type: releasesBundleInUpdate.type,
              size: releasesBundleInUpdate.transfer_size,
              startTime: releasesBundleInUpdate.start_time,
              viewId: releasesBundleInUpdate.viewId.substring(0, 8)
            }
          });
        }
      }
      
      // Include ALL AJAX requests since view session started (not just new ones since last update)
      if (currentView.ajaxRequests && currentView.ajaxRequests.length > 0) {
        update.ajax_requests = currentView.ajaxRequests; // Send all AJAX requests from the view session
        console.log(`[Optima ContinuousMetrics] 🌐 Including ALL ${update.ajax_requests.length} AJAX requests from view session start`);
      }
      
      // Include ALL errors since view session started (not just new ones since last update)
      if (currentView.errors && currentView.errors.length > 0) {
        update.errors = currentView.errors; // Send all errors from the view session
        console.log(`[Optima ContinuousMetrics] ❌ Including ALL ${update.errors.length} errors from view session start`);
      }
      
      // Send update via data sender
      this.dataSender.sendContinuousUpdate(update);
      
      // Update last sent metrics
      this.lastSentMetrics = { ...currentMetrics };
      
      console.log('[Optima ContinuousMetrics] ✅ Sent comprehensive continuous update:', {
        webVitals: Object.keys(update.web_vitals),
        resources: update.resources.length,
        ajaxRequests: update.ajax_requests.length,
        errors: update.errors.length
      });
    }

    /**
     * Update change thresholds
     * @param {Object} thresholds - New threshold values
     */
    updateThresholds(thresholds) {
      if (thresholds.CLS !== undefined) {
        this.significantChangeThresholds.CLS = thresholds.CLS;
      }
      
      if (thresholds.INP !== undefined) {
        this.significantChangeThresholds.INP = thresholds.INP;
      }
      
      console.log('[Optima ContinuousMetrics] ⚙️ Updated thresholds:', this.significantChangeThresholds);
    }

    /**
     * Update tracking interval
     * @param {number} intervalMs - New interval in milliseconds
     */
    updateInterval(intervalMs) {
      this.updateIntervalMs = intervalMs;
      
      // Restart tracking with new interval if currently tracking
      if (this.isTracking) {
        this.stopContinuousTracking();
        this.startContinuousTracking();
      }
      
      console.log('[Optima ContinuousMetrics] ⚙️ Updated interval:', intervalMs);
    }

    /**
     * Trigger update check when new web vital is detected
     * @param {string} vitalName - Name of the web vital
     * @param {number} value - Value of the web vital
     */
    onWebVitalDetected(vitalName, value) {
      if (!this.isTracking || !this.viewManager.currentView?.isActive) return;
      
      console.log(`[Optima ContinuousMetrics] 📊 Web vital detected: ${vitalName} = ${value}`);
      
      const currentView = this.viewManager.currentView;
      const isInitialLoad = currentView.type === 'initial';
      
      // Define metric categories
      const initialLoadOnlyVitals = ['LCP', 'FCP', 'FID', 'TTFB'];
      const continuousVitals = ['CLS', 'INP', 'loading_time'];
      
      // For initial-load-only vitals, only send updates if this is an initial load
      if (initialLoadOnlyVitals.includes(vitalName)) {
        if (isInitialLoad) {
          console.log(`[Optima ContinuousMetrics] 🚀 Initial load vital detected for initial view, sending immediate update`);
          setTimeout(() => {
            this.checkAndSendUpdates();
          }, 100); // Small delay to ensure metric is recorded in view
        } else {
          console.log(`[Optima ContinuousMetrics] 🚫 Ignoring ${vitalName} for route change view - not applicable`);
        }
      }
      
      // For continuous vitals, always send updates regardless of view type
      else if (continuousVitals.includes(vitalName)) {
        console.log(`[Optima ContinuousMetrics] 📊 Continuous vital detected, sending update`);
        setTimeout(() => {
          this.checkAndSendUpdates();
        }, 100);
      }
    }

    /**
     * Force send current metrics (for testing or manual triggers)
     */
    forceSendUpdate() {
      console.log('[Optima ContinuousMetrics] 🔧 Force sending continuous update');
      this.sendContinuousUpdate();
    }

    /**
     * Get tracking status for debugging
     * @returns {Object} Tracking status
     */
    getStatus() {
      return {
        isTracking: this.isTracking,
        updateInterval: this.updateIntervalMs,
        lastSentMetrics: { ...this.lastSentMetrics },
        thresholds: { ...this.significantChangeThresholds },
        hasActiveView: !!this.viewManager.currentView?.isActive
      };
    }

    /**
     * Reset continuous metrics tracking (for new view)
     */
    reset() {
      console.log('[Optima ContinuousMetrics] 🔄 Resetting continuous metrics tracking');
      
      this.lastSentMetrics = {};
      
      // Don't stop tracking, just reset the baseline
      if (this.isTracking) {
        console.log('[Optima ContinuousMetrics] 🔄 Continuing tracking with reset baseline');
      }
    }

    /**
     * Cleanup continuous metrics manager
     */
    cleanup() {
      console.log('[Optima ContinuousMetrics] 🧹 Cleaning up continuous metrics manager');
      
      this.stopContinuousTracking();
    }
  }

  /**
   * View-Scoped Collectors for Optima SDK
   * Handles resource collection with proper view isolation
   */


  /**
   * ViewScopedResourceCollector - Collects resources scoped to current view
   */
  class ViewScopedResourceCollector {
    constructor(viewManager) {
      this.viewManager = viewManager;
      this.processedUrls = new Set();
      this.resourceObserver = null;
      this.isObserving = false;
      
      // Debug tracking for missing resources
      this.allDetectedResources = new Set();
      this.setupGlobalResourceTracking();

      console.log('[Optima ViewScopedCollector] 📦 Resource collector initialized');
    }

    /**
     * Helper method to safely format numbers
     * @param {number} value - Value to format
     * @param {number} digits - Number of decimal places
     * @returns {string} Formatted string
     */
    safeToFixed(value, digits = 2) {
      if (typeof value !== 'number' || isNaN(value)) {
        return '0.00';
      }
      return value.toFixed(digits);
    }

    /**
     * Setup global resource tracking for all resources
     */
    setupGlobalResourceTracking() {
      // This method can be used for global resource tracking if needed
      console.log('[Optima ViewScopedCollector] 🌐 Global resource tracking setup');
    }

    /**
     * Start collecting resources for current view
     */
    startCollecting() {
      if (this.viewManager.currentView) {
        console.log(`[Optima ViewScopedCollector] 🚀 Starting collection for view: ${this.viewManager.currentView.id}`);
        
      // Clear processed URLs for new view
      this.processedUrls.clear();
      
        // Setup resource observer for new resources
      this.setupResourceObserver();
      
        // Collect existing resources from performance buffer
      this.collectExistingResources();
      } else {
        console.warn('[Optima ViewScopedCollector] ⚠️ No active view to collect resources for');
      }
    }

    /**
     * Stop collecting resources
     */
    stopCollecting() {
      if (this.resourceObserver && this.isObserving) {
        this.resourceObserver.disconnect();
        this.isObserving = false;
        console.log('[Optima ViewScopedCollector] ⏹️ Resource collection stopped');
      }
    }

    /**
     * Clear all observers
     */
    clearObservers() {
      this.stopCollecting();
    }

    /**
     * Setup PerformanceObserver for new resources
     */
    setupResourceObserver() {
      if (!('PerformanceObserver' in window)) {
        console.warn('[Optima ViewScopedCollector] ⚠️ PerformanceObserver not supported');
        return;
      }
      
      // Disconnect existing observer
      if (this.resourceObserver && this.isObserving) {
        this.resourceObserver.disconnect();
      }
      
      try {
        this.resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          // FIXED: Notify loading time tracker about resource activity
          this.notifyLoadingTimeTracker(entries);
          
          this.processResourceEntries(entries);
        });
        
        this.resourceObserver.observe({ entryTypes: ['resource'] });
        this.isObserving = true;
      } catch (error) {
        console.error('[Optima ViewScopedCollector] ❌ Failed to setup resource observer:', error);
      }
    }

    /**
     * Notify loading time tracker about resource activity
     * @param {Array} entries - Resource entries
     */
    notifyLoadingTimeTracker(entries) {
      // Get the loading time tracker from the web vitals collector
      const webVitalsCollector = this.viewManager.webVitalsCollector;
      if (!webVitalsCollector) {
        console.warn('[Optima ViewScopedCollector] ⚠️ No webVitalsCollector found on viewManager');
        return;
      }
      
      if (!webVitalsCollector.loadingTimeTracker) {
        console.warn('[Optima ViewScopedCollector] ⚠️ No loadingTimeTracker found on webVitalsCollector');
        return;
      }
      
      const loadingTimeTracker = webVitalsCollector.loadingTimeTracker;
      
      // Only notify if tracker is active
      if (!loadingTimeTracker.isTracking || loadingTimeTracker.isComplete) {
        console.log(`[Optima ViewScopedCollector] 🔄 Loading time tracker not active (isTracking: ${loadingTimeTracker.isTracking}, isComplete: ${loadingTimeTracker.isComplete})`);
        return;
      }
      
      console.log(`[Optima ViewScopedCollector] 🎯 Notifying loading time tracker about ${entries.length} resources`);
      
      entries.forEach(entry => {
        const resourceStartTime = performance.timeOrigin + entry.startTime;
        
        // Check if this resource should be considered for loading time
        if (resourceStartTime >= loadingTimeTracker.baselineTime) {
          // Add to pending resources and record activity with details
          loadingTimeTracker.pendingResources.add(entry.name);
          
          const resourceDetails = {
            url: entry.name,
            type: entry.initiatorType || 'unknown',
            size: entry.transferSize || 0,
            duration: Math.round(entry.duration || 0),
            startTime: Math.round(entry.startTime),
            endTime: Math.round(entry.startTime + (entry.duration || 0))
          };
          
          loadingTimeTracker.recordActivity('resource', resourceDetails);
          
          console.log(`[Optima ViewScopedCollector] 🎯 Notified loading time tracker about resource: ${entry.name.substring(entry.name.lastIndexOf('/') + 1)}`);
          
          // Remove from pending when complete
          setTimeout(() => {
            loadingTimeTracker.pendingResources.delete(entry.name);
          }, 50);
        } else {
          console.log(`[Optima ViewScopedCollector] ⏰ Resource filtered out (started before baseline): ${entry.name.substring(entry.name.lastIndexOf('/') + 1)}`);
        }
      });
    }

    /**
     * Collect existing resources that belong to current view
     */
    collectExistingResources() {
      if (!this.viewManager.currentView) return;
      
        const currentView = this.viewManager.currentView;
        const isInitialLoad = currentView.type === 'initial';
        
      // Get all resource entries
      const entries = performance.getEntriesByType('resource');
      
      // FIXED: Notify loading time tracker about existing resources
      this.notifyLoadingTimeTrackerAboutExistingResources(entries, isInitialLoad);
      
      // Calculate filter time based on view type
      const filterTime = isInitialLoad ? 0 : this.calculateRouteChangeFilterTime(currentView);
      
      // Enhanced logging for resource collection process
      console.group(
        `%c📦 Resource Collection Process %c${currentView.type.toUpperCase()}`,
        'color: #8b5cf6; font-weight: bold; font-size: 14px;',
        'color: #3b82f6; font-weight: bold; font-size: 12px; background: #eff6ff; padding: 2px 6px; border-radius: 4px;'
      );
      
      console.log('%c📊 Collection Configuration:', 'color: #6b7280; font-weight: bold;');
      console.table({
        'View Type': currentView.type,
        'View Start Time': `${currentView.startTime.toFixed(2)}ms`,
        'Filter Time': isInitialLoad ? '0ms (collect all)' : `${filterTime.toFixed(2)}ms`,
        'Total Resources Available': entries.length,
        'Is Initial Load': isInitialLoad
      });
      
        if (!isInitialLoad) {
        console.log('%c🎯 Route Change Filter Details:', 'color: #6b7280; font-weight: bold;');
          if (currentView.interactionBaseline && typeof currentView.interactionBaseline === 'number') {
          console.log(`🎯 Interaction baseline: ${currentView.interactionBaseline.toFixed(2)}ms (using for filtering)`);
          console.log(`⚡ Baseline advantage: ${(currentView.routeTriggerTime && typeof currentView.routeTriggerTime === 'number') ? (currentView.routeTriggerTime - currentView.interactionBaseline).toFixed(2) : 'N/A'}ms earlier than route trigger`);
          }
          if (currentView.routeTriggerTime && typeof currentView.routeTriggerTime === 'number') {
          console.log(`🎯 Route trigger time: ${currentView.routeTriggerTime.toFixed(2)}ms`);
          console.log(`⏰ View creation delay: ${(currentView.startTime - currentView.routeTriggerTime).toFixed(2)}ms`);
        }
      }
      
      // Track filtering results
      let includedCount = 0;
      let excludedCount = 0;
      const includedResources = [];
      const excludedResources = [];
        
        // Find releases.bundle.js for detailed lifecycle tracking
        const releasesBundleEntry = entries.find(entry => entry.name.includes('releases.bundle.js'));
        if (releasesBundleEntry) {
        console.log(`🎯 LIFECYCLE START - releases.bundle.js detected in existing resources`);
        console.log(`🎯 LIFECYCLE - Resource timing:`, {
            resourceStartTime: this.safeToFixed(releasesBundleEntry.startTime),
            routeTriggerTime: (currentView.routeTriggerTime && typeof currentView.routeTriggerTime === 'number') ? currentView.routeTriggerTime.toFixed(2) : 'N/A',
            viewStartTime: this.safeToFixed(currentView.startTime),
            filterTime: this.safeToFixed(filterTime),
            timeDifference: this.safeToFixed(releasesBundleEntry.startTime - filterTime),
            viewType: currentView.type,
            isInitialLoad: isInitialLoad
          });
        }
        
        // For initial load, collect all resources from buffer
      // For route changes, only collect resources that started after filter time
      entries.forEach(entry => {
        const shouldInclude = isInitialLoad || entry.startTime >= filterTime;
        
        if (shouldInclude) {
          // Process and add the resource
          const resourceData = this.processResourceEntry(entry, currentView);
          if (resourceData) {
            if (this.viewManager.addResource(resourceData)) {
              includedCount++;
              includedResources.push({
                name: this.truncateUrl(entry.name, 50),
                startTime: entry.startTime.toFixed(2),
                type: entry.initiatorType || 'unknown',
                size: entry.transferSize || 0
              });
            }
          }
        } else {
          excludedCount++;
          excludedResources.push({
            name: this.truncateUrl(entry.name, 50),
            startTime: entry.startTime.toFixed(2),
            timeDiff: (entry.startTime - filterTime).toFixed(2),
            type: entry.initiatorType || 'unknown'
          });
        }
      });
      
      // Log filtering results
      console.log('%c📊 Collection Results:', 'color: #10b981; font-weight: bold;');
      console.table({
        'Total Resources': entries.length,
        'Included': includedCount,
        'Excluded': excludedCount,
        'Inclusion Rate': `${((includedCount / entries.length) * 100).toFixed(1)}%`
      });
      
      // Show sample of included resources
      if (includedResources.length > 0) {
        console.log('%c✅ Sample Included Resources (first 5):', 'color: #10b981; font-weight: bold;');
        console.table(includedResources.slice(0, 5));
      }
      
      // Show sample of excluded resources for route changes
      if (!isInitialLoad && excludedResources.length > 0) {
        console.log('%c❌ Sample Excluded Resources (first 5):', 'color: #ef4444; font-weight: bold;');
        console.table(excludedResources.slice(0, 5));
      }
      
      console.log(`✅ Resource collection completed: ${includedCount} resources added to ${currentView.type} view`);
      console.groupEnd();
    }

    /**
     * Notify loading time tracker about existing resources in the buffer
     * @param {Array} entries - All resource entries
     * @param {boolean} isInitialLoad - Whether this is an initial load
     */
    notifyLoadingTimeTrackerAboutExistingResources(entries, isInitialLoad) {
      // Get the loading time tracker from the web vitals collector
      const webVitalsCollector = this.viewManager.webVitalsCollector;
      if (!webVitalsCollector) {
        console.warn('[Optima ViewScopedCollector] ⚠️ No webVitalsCollector found on viewManager for existing resources');
        return;
      }
      
      if (!webVitalsCollector.loadingTimeTracker) {
        console.warn('[Optima ViewScopedCollector] ⚠️ No loadingTimeTracker found on webVitalsCollector for existing resources');
        return;
      }
      
      const loadingTimeTracker = webVitalsCollector.loadingTimeTracker;
      
      // Only notify if tracker is active
      if (!loadingTimeTracker.isTracking || loadingTimeTracker.isComplete) {
        console.log(`[Optima ViewScopedCollector] 🔄 Loading time tracker not active for existing resources (isTracking: ${loadingTimeTracker.isTracking}, isComplete: ${loadingTimeTracker.isComplete})`);
        return;
      }
      
      console.log(`[Optima ViewScopedCollector] 🎯 Notifying loading time tracker about ${entries.length} existing resources (isInitialLoad: ${isInitialLoad})`);
      
      let notifiedCount = 0;
      
      entries.forEach(entry => {
        const resourceStartTime = performance.timeOrigin + entry.startTime;
        
        // Check if this resource should be considered for loading time
        if (resourceStartTime >= loadingTimeTracker.baselineTime) {
          // Add to pending resources and record activity with details
          loadingTimeTracker.pendingResources.add(entry.name);
          
          const resourceDetails = {
            url: entry.name,
            type: entry.initiatorType || 'unknown',
            size: entry.transferSize || 0,
            duration: Math.round(entry.duration || 0),
            startTime: Math.round(entry.startTime),
            endTime: Math.round(entry.startTime + (entry.duration || 0))
          };
          
          loadingTimeTracker.recordActivity('resource', resourceDetails);
          notifiedCount++;
          
          // Remove from pending when complete
          setTimeout(() => {
            loadingTimeTracker.pendingResources.delete(entry.name);
          }, 50);
        }
      });
      
      if (notifiedCount > 0) {
        console.log(`[Optima ViewScopedCollector] 🎯 Notified loading time tracker about ${notifiedCount} existing resources`);
      } else {
        console.log(`[Optima ViewScopedCollector] ⏰ No existing resources met baseline criteria for loading time tracking`);
      }
    }

    /**
     * Helper method to truncate URLs for logging
     * @param {string} url - URL to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated URL
     */
    truncateUrl(url, maxLength = 50) {
      if (!url || url.length <= maxLength) return url;
      return url.substring(0, maxLength - 3) + '...';
    }

    /**
     * Calculate filter time for route changes - now aligned with loading time baseline
     * @param {Object} currentView - Current view object
     * @returns {number} Filter time in performance.now() format
     */
    calculateRouteChangeFilterTime(currentView) {
      // FIXED: Use the same baseline logic as loading time tracker
      const routeTriggerTime = currentView.routeTriggerTime;
      const interactionBaseline = currentView.interactionBaseline;
      
      console.group('🎯 Resource Filter Time Calculation');
      
      if (routeTriggerTime && typeof routeTriggerTime === 'number') {
        // Use precise route trigger time - ALIGNED with loading time baseline
        console.log(`✅ Using route trigger time: ${routeTriggerTime.toFixed(2)}ms`);
        console.log(`🎯 Filter baseline aligned with loading time baseline`);
        console.groupEnd();
        return routeTriggerTime;
      } else if (interactionBaseline && typeof interactionBaseline === 'number') {
        // Fallback to interaction baseline if available
        console.log(`🔄 Using interaction baseline: ${interactionBaseline.toFixed(2)}ms`);
        console.log(`⚠️ Route trigger time not available, using interaction fallback`);
        console.groupEnd();
        return interactionBaseline;
            } else {
        // Final fallback to view start time
        console.warn(`⚠️ No route trigger or interaction time available, using view start time: ${currentView.startTime.toFixed(2)}ms`);
        console.log(`🚨 Filter baseline NOT aligned with loading time baseline`);
        console.groupEnd();
        return currentView.startTime;
      }
    }

    /**
     * Process a single resource entry and return resource data
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @param {Object} currentView - Current view object
     * @returns {Object|null} Resource data object or null if should not be processed
     */
    processResourceEntry(entry, currentView) {
      try {
        // Skip if already processed
        if (this.processedUrls.has(entry.name)) {
          return null;
        }
        
        // Skip if we shouldn't collect this resource
        if (!this.shouldCollectResource(entry)) {
          return null;
        }
        
        // FIXED: For initial loads, don't filter by time - collect ALL resources
        // For route changes, use proper filter time
        const isInitialLoad = currentView.type === 'initial';
        let filterTime = 0; // Default for initial load
        
        if (!isInitialLoad) {
          // Only calculate filter time for route changes
          filterTime = this.calculateRouteChangeFilterTime(currentView);
        }
        
        // Extract full resource data with correct filter time
        const resourceData = this.extractFullResourceData(entry, filterTime, isInitialLoad);
        
        // Mark as processed
        this.processedUrls.add(entry.name);
        
        return resourceData;
        
      } catch (error) {
        console.error('[Optima ViewScopedCollector] ❌ Error processing single resource:', entry.name, error);
        return null;
      }
    }

    /**
     * Process resource entries and add to current view
     * @param {Array} entries - Performance resource entries
     */
    processResourceEntries(entries) {
      if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) {
        console.warn('[Optima ViewScopedCollector] ⚠️ No active view to process resources for');
        return;
      }
      
      const currentView = this.viewManager.currentView;
      const isInitialLoad = currentView.type === 'initial';
      
      // FIXED: For initial loads, use 0 as filter time to collect ALL resources
      // For route changes, calculate proper filter time
      let filterTime = 0; // Default for initial load
      
      if (!isInitialLoad) {
        // Only calculate filter time for route changes
        if (currentView.interactionBaseline) {
          filterTime = currentView.interactionBaseline;
          console.log(`[Optima ViewScopedCollector] 🎯 Using interaction baseline for filtering: ${this.safeToFixed(filterTime)}ms`);
        } else {
          filterTime = currentView.routeTriggerTime || currentView.startTime;
          console.log(`[Optima ViewScopedCollector] 🎯 Using route trigger time for filtering: ${this.safeToFixed(filterTime)}ms`);
        }
      } else {
        console.log(`[Optima ViewScopedCollector] 🎯 Initial load: collecting ALL resources from time 0`);
      }
      
      let processedCount = 0;
      
      
      entries.forEach((entry, index) => {
        const url = entry.name;
        url.toLowerCase().includes('.js');
        url.includes('bundle') || url.includes('chunk');
        
        // DETAILED LIFECYCLE TRACKING for releases.bundle.js in processResourceEntries
        if (url.includes('releases.bundle.js')) {
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js in processResourceEntries - Entry ${index + 1}/${entries.length}`);
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - Processing checks begin:`, {
            url: url,
            startTime: this.safeToFixed(entry.startTime),
            filterTime: this.safeToFixed(filterTime),
            isInitialLoad: isInitialLoad,
            viewType: currentView.type
          });
        }
        
        // Skip if already processed
        if (this.processedUrls.has(entry.name)) {
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE END - releases.bundle.js SKIPPED: already processed`);
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - processedUrls contains:`, Array.from(this.processedUrls).filter(u => u.includes('releases.bundle')));
          }
          return;
        }

        if (url.includes('releases.bundle.js')) {
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js passed alreadyProcessed check`);
        }
        
        // FIXED: For initial loads, collect ALL resources (no timing check)
        // For route changes, skip if started before filter time
        if (!isInitialLoad && entry.startTime < filterTime) {
          if (url.includes('releases.bundle.js')) {
            const timeType = currentView.routeTriggerTime ? 'route trigger' : 'view start';
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE END - releases.bundle.js SKIPPED: timing check failed`);
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - Timing details:`, {
              resourceStartTime: this.safeToFixed(entry.startTime),
              filterTime: this.safeToFixed(filterTime),
              timeType: timeType,
              timeDifference: this.safeToFixed(entry.startTime - filterTime),
              condition: `${this.safeToFixed(entry.startTime)} < ${this.safeToFixed(filterTime)}`,
              result: 'FAILED - resource started before filter time'
            });
          }
          return;
        }
        
        if (url.includes('releases.bundle.js')) {
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js passed timing check`);
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - Timing validation:`, {
            condition: isInitialLoad ? 'initial load (no timing check)' : `${this.safeToFixed(entry.startTime)} >= ${this.safeToFixed(filterTime)}`,
            result: 'PASSED'
          });
        }
        
        // Skip if we shouldn't collect this resource
        if (!this.shouldCollectResource(entry)) {
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE END - releases.bundle.js SKIPPED: shouldCollectResource returned false`);
          }
          return;
        }
        
        if (url.includes('releases.bundle.js')) {
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js passed shouldCollectResource check`);
          console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - Proceeding to extract resource data and add to view`);
        }
        
        try {
          // Extract full resource data maintaining existing structure
          const resourceData = this.extractFullResourceData(entry, filterTime, isInitialLoad);
          
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js resource data extracted:`, {
              name: resourceData.name,
              type: resourceData.type,
              size: resourceData.transfer_size,
              startTime: resourceData.start_time,
              duration: resourceData.duration,
              viewId: resourceData.viewId.substring(0, 8)
            });
          }
          
          // Add to current view
          this.viewManager.addResource(resourceData);
          
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js added to ViewManager`);
          }
          
          // Check if this is an AJAX request and extract it
          if (this.isAjaxRequest(entry)) {
            const ajaxData = this.convertToAjaxData(resourceData, entry);
            this.viewManager.addAjaxRequest(ajaxData);
            
            if (url.includes('releases.bundle.js')) {
              console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - releases.bundle.js also processed as AJAX request`);
            }
          }
          
          this.processedUrls.add(entry.name);
          processedCount++;
          
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE SUCCESS - releases.bundle.js processing completed successfully`);
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE - Added to processedUrls, total processed: ${processedCount}`);
          }
          
        } catch (error) {
          console.error('[Optima ViewScopedCollector] ❌ Error processing resource:', entry.name, error);
          if (url.includes('releases.bundle.js')) {
            console.log(`[Optima ViewScopedCollector] 🎯 LIFECYCLE ERROR - releases.bundle.js processing failed:`, error);
          }
        }
      });
    }

    /**
     * Extract full resource data maintaining existing structure
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @param {number} filterTime - Filter time for relative calculations
     * @param {boolean} isInitialLoad - Whether this is an initial load
     * @returns {Object} Resource data object
     */
    extractFullResourceData(entry, filterTime, isInitialLoad) {
      this.viewManager.currentView;
      
      // FIXED: For initial load, use absolute timing from navigation start
      // For route changes, use relative timing from filter time
      let viewRelativeStartTime;
      
      if (isInitialLoad) {
        // For initial loads, use absolute timing from navigation start (entry.startTime is already relative to navigation start)
        viewRelativeStartTime = entry.startTime;
      } else {
        // For route changes, use relative timing from filter time
        viewRelativeStartTime = entry.startTime - filterTime;
      }
      
      // Calculate all timing values
      const dnsTime = Math.round(entry.domainLookupEnd - entry.domainLookupStart);
      const tlsTime = entry.secureConnectionStart ? 
        Math.round(entry.connectEnd - entry.secureConnectionStart) : 0;
      const connectionTime = Math.round(entry.connectEnd - entry.connectStart);
      const requestTime = Math.round(entry.responseStart - entry.requestStart);
      const responseTime = Math.round(entry.responseEnd - entry.responseStart);
      const duration = Math.round(entry.duration);
      
      // Determine resource type
      const resourceType = this.getResourceType(entry);
      
      // Determine cache status
      const cacheStatus = this.getCacheStatus(entry);
      
      // Build resource data object (maintaining existing structure)
      const resourceData = {
        // Basic resource info
        name: entry.name,
        size: entry.transferSize || 0,
        ttfb: requestTime,
        type: resourceType,
        
        // Timing object (existing structure)
        timing: {
          dns: dnsTime,
          tls: tlsTime,
          request: requestTime,
          response: responseTime,
          connection: connectionTime
        },
        
        // Individual timing fields (existing structure)
        dnsTime: dnsTime,
        tlsTime: tlsTime,
        dns_time: dnsTime,
        tls_time: tlsTime,
        duration: duration,
        downloadTime: responseTime,
        download_time: responseTime,
        connectionTime: connectionTime,
        connection_time: connectionTime,
        
        // View-relative timing - FIXED to use correct calculation
        start_time: Math.round(viewRelativeStartTime),
        
        // Cache and transfer info
        cacheStatus: cacheStatus,
        cache_status: cacheStatus,
        decoded_size: entry.decodedBodySize || 0,
        encoded_size: entry.encodedBodySize || 0,
        transfer_size: entry.transferSize || 0,
        
        // Performance timing details
        connect_end: Math.round(entry.connectEnd),
        connect_start: Math.round(entry.connectStart),
        fetch_start: Math.round(entry.fetchStart),
        response_end: Math.round(entry.responseEnd),
        response_start: Math.round(entry.responseStart),
        request_start: Math.round(entry.requestStart),
        domain_lookup_end: Math.round(entry.domainLookupEnd),
        domain_lookup_start: Math.round(entry.domainLookupStart),
        secure_connection_start: Math.round(entry.secureConnectionStart || 0),
        
        // Protocol info
        next_hop_protocol: entry.nextHopProtocol || 'unknown',
        initiator_type: entry.initiatorType || 'other',
        
        // View metadata
        viewId: this.viewManager.currentView.id,
        viewType: this.viewManager.currentView.type,
        view_relative_timing: true,
        
        // Debug info
        debug_info: {
          original_start_time: entry.startTime,
          filter_time: filterTime,
          is_initial_load: isInitialLoad,
          calculation_method: isInitialLoad ? 'absolute_from_navigation' : 'relative_from_filter'
        }
      };
      
      return resourceData;
    }

    /**
     * Determine if resource entry is an AJAX request
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @returns {boolean} True if AJAX request
     */
    isAjaxRequest(entry) {
      // Check initiator type first (most reliable)
      if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
        return true;
      }
      
      // Check if it's marked as AJAX in our system
      if (entry.is_ajax === true) {
        return true;
      }
      
      // Additional heuristics for AJAX detection
      const url = entry.name.toLowerCase();
      
      // Skip common static resource types
      if (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || 
          url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || 
          url.endsWith('.svg') || url.endsWith('.woff') || url.endsWith('.woff2') || 
          url.endsWith('.ttf') || url.endsWith('.ico')) {
        return false;
      }
      
      // Check for API-like URLs
      if (url.includes('/api/') || url.includes('/ajax/') || url.includes('/graphql')) {
        return true;
      }
      
      return false;
    }

    /**
     * Convert resource data to AJAX data format
     * @param {Object} resourceData - Resource data object
     * @param {PerformanceResourceTiming} entry - Original performance entry
     * @returns {Object} AJAX data object
     */
    convertToAjaxData(resourceData, entry) {
      return {
        type: entry.initiatorType === 'xmlhttprequest' ? 'xhr' : 'fetch',
        method: 'GET', // Default, as we can't determine from Performance API
        method_inferred: true,
        url: resourceData.name,
        status: 200, // Default, as we can't determine from Performance API
        statusText: 'OK',
        startTime: resourceData.start_time,
        duration: resourceData.duration,
        async: true,
        requestPayloadSize: 0, // Not available from Performance API
        responseSize: resourceData.transfer_size,
        aborted: false,
        errored: false,
        timedOut: false,
        timestamp: Date.now(),
        resourceTiming: {
          startTime: resourceData.start_time,
          duration: resourceData.duration,
          domainLookupTime: resourceData.dnsTime,
          connectTime: resourceData.connectionTime,
          tlsTime: resourceData.tlsTime,
          requestStartTime: resourceData.request_start,
          ttfb: resourceData.ttfb,
          downloadTime: resourceData.downloadTime,
          entryType: 'resource',
          initiatorType: entry.initiatorType
        },
        requestHeaders: {
          'content-type': 'unknown',
          'content-length': 'unknown'
        },
        responseHeaders: {
          'content-type': 'unknown',
          'content-length': resourceData.transfer_size.toString(),
          'cache-control': 'unknown'
        },
        
        // View metadata
        viewId: this.viewManager.currentView.id,
        viewType: this.viewManager.currentView.type
      };
    }

    /**
     * Determine resource type from performance entry
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @returns {string} Resource type
     */
    getResourceType(entry) {
      const url = entry.name.toLowerCase();
      
      // FIXED: Check for JavaScript files first, regardless of initiatorType
      // This handles cases where JS files are loaded via <link> tags (modulepreload, prefetch, etc.)
      // which would have initiatorType='link' but are actually JavaScript files
      if (url.endsWith('.js')) return 'script';
      
      // Check by initiator type for non-JS files
      if (entry.initiatorType === 'img') return 'image';
      if (entry.initiatorType === 'script') return 'script';
      if (entry.initiatorType === 'link') return 'stylesheet';
      if (entry.initiatorType === 'xmlhttprequest') return 'xhr';
      if (entry.initiatorType === 'fetch') return 'fetch';
      
      // Fallback to URL-based detection for other file types
      if (url.endsWith('.css')) return 'stylesheet';
      if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || 
          url.endsWith('.gif') || url.endsWith('.svg') || url.endsWith('.webp')) return 'image';
      if (url.endsWith('.woff') || url.endsWith('.woff2') || url.endsWith('.ttf')) return 'font';
      if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) return 'media';
      
      return 'other';
    }

    /**
     * Determine cache status from performance entry
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @returns {string} Cache status
     */
    getCacheStatus(entry) {
      // If transfer size is 0 but encoded size > 0, likely from cache
      if (entry.transferSize === 0 && entry.encodedBodySize > 0) {
        return 'cache';
      }
      
      // If transfer size > 0, came from network
      if (entry.transferSize > 0) {
        return 'network';
      }
      
      // If both are 0, might be cached or failed
      if (entry.transferSize === 0 && entry.encodedBodySize === 0) {
        return 'unknown';
      }
      
      return 'network';
    }

    /**
     * Determine if we should collect this resource
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     * @returns {boolean} True if should collect
     */
    shouldCollectResource(entry) {
      const url = entry.name;

      // Get SDK config for exclusion list
      const sdkConfig = this.viewManager.sdk?.config || {};

      // Use the unified exclusion list for consistency across all SDK components
      if (isInExclusionList(url, sdkConfig)) {
        return false;
      }

      // Skip data URLs
      if (url.startsWith('data:')) {
        return false;
      }
      
      // Skip blob URLs
      if (url.startsWith('blob:')) {
        return false;
      }
      
      return true;
    }

    /**
     * Get processed URLs count for debugging
     * @returns {number} Number of processed URLs
     */
    getProcessedCount() {
      return this.processedUrls.size;
    }

    /**
     * Reset collector state
     */
    reset() {  
      this.processedUrls.clear();
      
      if (this.resourceObserver && this.isObserving) {
        this.resourceObserver.disconnect();
        this.isObserving = false;
      }
    }

    /**
     * Get debug information about resource collection
     */
    getDebugInfo() {
      const allResources = performance.getEntriesByType('resource');
      return {
        totalDetected: allResources.length,
        totalProcessed: this.processedUrls.size,
        jsFiles: allResources.filter(entry => entry.name.toLowerCase().includes('.js')).length,
        bundleFiles: allResources.filter(entry => entry.name.includes('bundle') || entry.name.includes('chunk')).length,
        processedUrls: Array.from(this.processedUrls)
      };
    }
  }

  /**
   * Layout Shift Analysis Utilities
   * Functions for analyzing layout shifts and identifying their sources
   */

  /**
   * Extract information about the largest layout shift source
   * @param {PerformanceEntry} entry - The layout-shift performance entry
   * @returns {Object|null} Detailed information about the shift source or null if no sources
   */
  function getLargestShiftSource(entry) {
    // Safety check - if no entry, sources, or empty sources array, return null
    if (!entry || !entry.sources || entry.sources.length === 0) {
      return null;
    }
    
    try {
      // Find the source with the largest impact
      const largestSource = entry.sources.reduce((largest, source) => {
        try {
          // Some browsers provide impactValue, otherwise we estimate from node and geometry
          const currentImpact = source.impactValue || calculateImpactValue(source);
          const largestImpact = largest.impactValue || calculateImpactValue(largest);
          
          return currentImpact > largestImpact ? source : largest;
        } catch (err) {
          // If there's an error calculating impact, use the current largest
          return largest;
        }
      }, entry.sources[0]);
      
      // Safety check - if no largest source found
      if (!largestSource) {
        return null;
      }
      
      // Get the DOM node or element that shifted
      const node = largestSource.node;
      
      // If no node is available, return position data only
      if (!node) {
        return {
          previousRect: formatRect(largestSource.previousRect),
          currentRect: formatRect(largestSource.currentRect),
          impactValue: largestSource.impactValue || calculateImpactValue(largestSource),
          nodeLost: true,
          shiftType: determineShiftType(largestSource)
        };
      }
      
      // Get more detailed information about the element
      return {
        // Element identification - with safety checks
        tagName: node.tagName || 'UNKNOWN',
        id: node.id || null,
        className: typeof node.className === 'string' ? node.className : null,
        cssPath: generateCSSPath(node),
        domPath: generateDOMPath(node),
        
        // Element content
        textContent: getNodeText(node),
        
        // Element attributes useful for debugging
        attributes: getElementAttributes(node),
        
        // Position data
        previousRect: formatRect(largestSource.previousRect),
        currentRect: formatRect(largestSource.currentRect),
        impactValue: largestSource.impactValue || calculateImpactValue(largestSource),
        
        // Shift metadata
        shiftType: determineShiftType(largestSource),
        isAnimating: isNodeAnimating(node),
        isImage: node.tagName === 'IMG',
        isIframe: node.tagName === 'IFRAME',
        isVideo: node.tagName === 'VIDEO'
      };
    } catch (error) {
      // If there's an error processing the layout shift, log it and return null
      return null;
    }
  }

  /**
   * Calculate visual impact value of a shift source when not directly provided
   * @param {Object} source - The layout shift source
   * @returns {number} Estimated impact value
   */
  function calculateImpactValue(source) {
    // No source or rects
    if (!source || !source.previousRect || !source.currentRect) {
      return 0;
    }
    
    // We can estimate impact from the displacement distance and size of element
    const prev = source.previousRect;
    const curr = source.currentRect;
    
    // Distance moved
    const dx = Math.abs(prev.x - curr.x);
    const dy = Math.abs(prev.y - curr.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Size of element
    const area = Math.max(
      prev.width * prev.height,
      curr.width * curr.height
    );
    
    // Simple impact estimate: area × distance normalized to viewport
    const viewportArea = window.innerWidth * window.innerHeight;
    
    return distance * (area / viewportArea);
  }

  /**
   * Format a DOMRectReadOnly for easier display and analysis
   * @param {DOMRectReadOnly} rect - The DOM rect object
   * @returns {Object} Formatted rect with rounded values
   */
  function formatRect(rect) {
    if (!rect) return null;
    
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left)
    };
  }

  /**
   * Generate a CSS selector path for an element
   * @param {Element} element - The DOM element
   * @returns {string} CSS path for the element
   */
  function generateCSSPath(element) {
    if (!element) return null;
    
    const path = [];
    let currentElement = element;
    
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let selector = currentElement.tagName.toLowerCase();
      
      // Add ID if present (most specific)
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
        path.unshift(selector);
        break; // ID is unique, no need to go further up the tree
      }
      
      // Add classes if present
      if (currentElement.className && typeof currentElement.className === 'string') {
        const classes = currentElement.className.trim().split(/\s+/);
        if (classes.length > 0 && classes[0] !== '') {
          selector += `.${classes.join('.')}`;
        }
      }
      
      // Try to add :nth-child for more specificity
      let sibling = currentElement;
      let nthChild = 1;
      
      while (sibling = sibling.previousElementSibling) {
        nthChild++;
      }
      
      if (nthChild > 1) {
        selector += `:nth-child(${nthChild})`;
      }
      
      path.unshift(selector);
      
      // Stop if we've reached the body or if path is getting too long
      if (currentElement.tagName.toLowerCase() === 'body' || path.length >= 5) {
        break;
      }
      
      currentElement = currentElement.parentNode;
    }
    
    return path.join(' > ');
  }

  /**
   * Generate a DOM path for an element
   * @param {Element} element - The DOM element
   * @returns {string} DOM path
   */
  function generateDOMPath(element) {
    if (!element) return null;
    
    const path = [];
    let currentElement = element;
    
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let selector = currentElement.tagName.toLowerCase();
      
      // Add ID if present (most specific)
      if (currentElement.id) {
        selector = `${selector}#${currentElement.id}`;
      }
      
      path.unshift(selector);
      
      // Stop if we've reached the body or if path is getting too long
      if (currentElement.tagName.toLowerCase() === 'body' || path.length >= 5) {
        break;
      }
      
      currentElement = currentElement.parentNode;
    }
    
    return path.join(' > ');
  }

  /**
   * Get trimmed text content from a node
   * @param {Node} node - The DOM node
   * @returns {string|null} Trimmed text content
   */
  function getNodeText(node) {
    if (!node || !node.textContent) return null;
    
    // Trim and normalize whitespace
    const text = node.textContent.trim().replace(/\s+/g, ' ');
    
    // Limit length for efficiency
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  }

  /**
   * Get key attributes from an element
   * @param {Element} element - The DOM element
   * @returns {Object} Map of relevant attributes
   */
  function getElementAttributes(element) {
    if (!element || !element.attributes) return {};
    
    const relevantAttrs = {};
    const importantAttrs = ['src', 'href', 'alt', 'title', 'aria-label', 'role', 'data-testid'];
    
    // Extract specific attributes we care about
    importantAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        relevantAttrs[attr] = element.getAttribute(attr);
      }
    });
    
    // Add any data-* attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('data-') && !importantAttrs.includes(attr.name)) {
        relevantAttrs[attr.name] = attr.value;
      }
    }
    
    return relevantAttrs;
  }

  /**
   * Determine what kind of shift occurred
   * @param {Object} source - The layout shift source
   * @returns {string} The type of shift that occurred
   */
  function determineShiftType(source) {
    if (!source || !source.previousRect || !source.currentRect) {
      return 'unknown';
    }
    
    const prev = source.previousRect;
    const curr = source.currentRect;
    
    // Check if element appeared
    if (prev.width === 0 && prev.height === 0 && (curr.width > 0 || curr.height > 0)) {
      return 'appeared';
    }
    
    // Check if element disappeared
    if (curr.width === 0 && curr.height === 0 && (prev.width > 0 || prev.height > 0)) {
      return 'disappeared';
    }
    
    // Check resize vs move
    const sizeChanged = Math.abs(prev.width - curr.width) > 1 || Math.abs(prev.height - curr.height) > 1;
    const positionChanged = Math.abs(prev.x - curr.x) > 1 || Math.abs(prev.y - curr.y) > 1;
    
    if (sizeChanged && positionChanged) {
      return 'resize-and-move';
    }
    
    if (sizeChanged) {
      return 'resize';
    }
    
    if (positionChanged) {
      return 'move';
    }
    
    return 'unknown';
  }

  /**
   * Check if a node is likely involved in an animation
   * @param {Element} node - The DOM node
   * @returns {boolean} Whether the node appears to be animating
   */
  function isNodeAnimating(node) {
    if (!node || !window.getComputedStyle) {
      return false;
    }
    
    try {
      const style = window.getComputedStyle(node);
      
      // Check for CSS transitions or animations
      return (
        style.transitionDuration !== '0s' ||
        style.animationName !== 'none' ||
        node.classList.contains('animate') ||
        node.classList.contains('fade') ||
        node.classList.contains('slide')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * View-Scoped Web Vitals for Optima SDK
   * Handles web vitals collection with proper view isolation
   */


  /**
   * ViewScopedWebVitals - Manages web vitals collection per view
   */
  class ViewScopedWebVitals {
    constructor(viewManager) {
      this.viewManager = viewManager;
      this.observers = new Map();
      this.continuousMetrics = ['CLS', 'INP']; // Metrics that continue after route change
      this.initialOnlyMetrics = ['LCP', 'FID', 'FCP', 'TTFB']; // Metrics only for initial load
      this.isSetup = false;
      this.loadingTimeTracker = null; // Track active loading time tracker
      
      console.log('[Optima ViewScopedWebVitals] 📊 Web vitals collector initialized');
    }

    /**
     * Start collecting web vitals for current view
     * @param {string} viewType - 'initial' or 'route_change'
     */
    startCollecting(viewType) {
      if (!this.viewManager.currentView) {
        console.warn('[Optima ViewScopedWebVitals] ⚠️ No active view to collect web vitals for');
        return;
      }
      
      console.log(`[Optima ViewScopedWebVitals] 🚀 Starting web vitals collection for ${viewType} view`);
      
      // Clear existing observers
      this.clearObservers();
      
      if (viewType === 'initial') {
        this.setupAllMetrics();
      } else {
        this.setupRouteChangeMetrics();
      }
      
      this.isSetup = true;
    }

    /**
     * Setup all metrics for initial page load
     */
    setupAllMetrics() {
      console.log('[Optima ViewScopedWebVitals] 🔧 Setting up all metrics for initial load');
      
      // Initial load gets all metrics
      this.setupLCP();
      this.setupFID();
      this.setupFCP();
      this.setupTTFB();
      this.setupCLS();
      this.setupINP();
      this.setupLoadingTime();
    }

    /**
     * Setup only continuous metrics for route changes
     */
    setupRouteChangeMetrics() {
      console.log('[Optima ViewScopedWebVitals] 🔧 Setting up continuous metrics for route change');
      
      // Route changes get continuous metrics + loading time
      this.setupCLS();
      this.setupINP();
      this.setupLoadingTime(); // Loading time is also relevant for route changes
    }

    /**
     * Setup Largest Contentful Paint (LCP) - Initial load only
     */
    setupLCP() {
      if (!('PerformanceObserver' in window)) {
        console.warn('[Optima ViewScopedWebVitals] ⚠️ PerformanceObserver not supported - skipping LCP');
        return;
      }
      
      const currentView = this.viewManager.currentView;
      
      // LCP is ONLY applicable for initial page load, not route changes
      if (currentView.type !== 'initial') {
        console.log('[Optima ViewScopedWebVitals] 🎯 Skipping LCP setup - only applicable for initial page load');
        return;
      }
      
      console.log('[Optima ViewScopedWebVitals] 🎯 Setting up LCP tracking for initial page load');
      
      try {
        const viewStartTime = this.viewManager.currentView.startTime;
        const currentView = this.viewManager.currentView;
        let lastLCPValue = 0;
        
        console.log(`[Optima ViewScopedWebVitals] 🎯 LCP setup - viewStartTime: ${viewStartTime}, viewType: ${currentView.type}`);
        
        const lcpObserver = new PerformanceObserver((list) => {
          if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) {
            console.log('[Optima ViewScopedWebVitals] 🎯 LCP observer fired but no active view');
            return;
          }
          
          const entries = list.getEntries();
          console.log(`[Optima ViewScopedWebVitals] 🎯 LCP observer fired with ${entries.length} entries`);
          
          if (entries.length === 0) return;
          
          const lastEntry = entries[entries.length - 1];
          console.log(`[Optima ViewScopedWebVitals] 🎯 LCP entry - startTime: ${lastEntry.startTime}, size: ${lastEntry.size}`);
          
          // For initial page load, accept all LCP entries from the buffer
          // For route changes, only accept entries after view start
          const isInitialLoad = currentView.type === 'initial';
          if (!isInitialLoad && lastEntry.startTime < viewStartTime) {
            console.log(`[Optima ViewScopedWebVitals] 🎯 LCP entry filtered out - occurred before view start (${lastEntry.startTime} < ${viewStartTime})`);
            return;
          }
          
          // For initial load, always accept buffered entries
          if (isInitialLoad) {
            console.log(`[Optima ViewScopedWebVitals] 🎯 LCP entry accepted for initial load - startTime: ${lastEntry.startTime}`);
          }
          
          // Calculate view-relative timing
          let viewRelativeTime;
          if (isInitialLoad) {
            // For initial load, use absolute time
            viewRelativeTime = lastEntry.startTime;
          } else {
            // For route changes, use relative time
            viewRelativeTime = lastEntry.startTime - viewStartTime;
          }
          
          // Only send event if it's a new, larger value
          if (lastEntry.startTime > lastLCPValue) {
            lastLCPValue = lastEntry.startTime;
            
            // Extract LCP element information
            const elementInfo = this.extractLCPElementInfo(lastEntry);
            
            // Calculate LCP attribution
            const attribution = this.calculateLCPAttribution(lastEntry, viewStartTime);
            
            // Update view's web vital
            this.viewManager.updateWebVital('LCP', viewRelativeTime, {
              absoluteTime: lastEntry.startTime,
              element: elementInfo,
              attribution: attribution,
              entry: {
                id: lastEntry.id,
                size: lastEntry.size,
                loadTime: lastEntry.loadTime,
                renderTime: lastEntry.renderTime
              }
            });
            
            console.log(`[Optima ViewScopedWebVitals] 🎯 LCP updated: ${viewRelativeTime}ms (absolute: ${lastEntry.startTime}ms)`);
          } else {
            console.log(`[Optima ViewScopedWebVitals] 🎯 LCP entry ignored - not larger than previous (${lastEntry.startTime} <= ${lastLCPValue})`);
          }
        });
        
        // Use buffered: true for initial load to capture metrics before SDK init
        // Use buffered: false for route changes to avoid contamination from previous view
        const shouldUseBuffer = currentView.type === 'initial';
        console.log(`[Optima ViewScopedWebVitals] 🎯 LCP observer buffered: ${shouldUseBuffer} (viewType: ${currentView.type})`);
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: shouldUseBuffer });
        this.observers.set('LCP', lcpObserver);
        
        // Also check if LCP has already been determined (fallback)
        setTimeout(() => {
          if (lastLCPValue === 0) {
            console.log('[Optima ViewScopedWebVitals] 🎯 No LCP detected via observer, checking performance entries directly');
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            console.log(`[Optima ViewScopedWebVitals] 🎯 Found ${lcpEntries.length} LCP entries in performance buffer`);
            
            if (lcpEntries.length > 0) {
              const lastLCPEntry = lcpEntries[lcpEntries.length - 1];
              console.log(`[Optima ViewScopedWebVitals] 🎯 Latest LCP from buffer: ${lastLCPEntry.startTime}ms, size: ${lastLCPEntry.size}`);
              
              // Process the entry manually
              const isInitialLoad = currentView.type === 'initial';
              let viewRelativeTime;
              if (isInitialLoad) {
                viewRelativeTime = lastLCPEntry.startTime;
              } else {
                viewRelativeTime = Math.max(0, lastLCPEntry.startTime - viewStartTime);
              }
              
              if (viewRelativeTime >= 0) {
                const elementInfo = this.extractLCPElementInfo(lastLCPEntry);
                const attribution = this.calculateLCPAttribution(lastLCPEntry, viewStartTime);
                
                this.viewManager.updateWebVital('LCP', viewRelativeTime, {
                  absoluteTime: lastLCPEntry.startTime,
                  element: elementInfo,
                  attribution: attribution,
                  entry: {
                    id: lastLCPEntry.id,
                    size: lastLCPEntry.size,
                    loadTime: lastLCPEntry.loadTime,
                    renderTime: lastLCPEntry.renderTime
                  },
                  source: 'fallback'
                });
                
                console.log(`[Optima ViewScopedWebVitals] 🎯 LCP recorded via fallback: ${viewRelativeTime}ms`);
              }
            }
          }
        }, 100);
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up LCP:', error);
      }
    }

    /**
     * Setup First Input Delay (FID) - Initial load only
     */
    setupFID() {
      if (!('PerformanceObserver' in window)) return;
      
      const currentView = this.viewManager.currentView;
      
      // FID is ONLY applicable for initial page load, not route changes
      if (currentView.type !== 'initial') {
        console.log('[Optima ViewScopedWebVitals] ⚡ Skipping FID setup - only applicable for initial page load');
        return;
      }
      
      console.log('[Optima ViewScopedWebVitals] ⚡ Setting up FID tracking for initial page load');
      
      try {
        const viewStartTime = this.viewManager.currentView.startTime;
        let fidRecorded = false;
        
        console.log(`[Optima ViewScopedWebVitals] ⚡ FID setup - viewStartTime: ${viewStartTime}, viewType: ${currentView.type}`);
        
        const fidObserver = new PerformanceObserver((list) => {
          if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) return;
          
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (fidRecorded) return; // Only record the first FID
            
            console.log(`[Optima ViewScopedWebVitals] ⚡ FID entry found - startTime: ${entry.startTime}`);
            
            // For initial page load, accept all FID entries from the buffer (use absolute timing)
            const viewRelativeTime = entry.startTime;
            const processingTime = entry.processingEnd - entry.processingStart;
            const fidValue = entry.processingStart - entry.startTime;
            
            // Update view's web vital
            this.viewManager.updateWebVital('FID', fidValue, {
              absoluteTime: entry.startTime,
              viewRelativeTime: viewRelativeTime,
              processingTime: processingTime,
              interactionType: entry.name,
              target: entry.target ? this.getElementInfo(entry.target) : null
            });
            
            fidRecorded = true;
            console.log(`[Optima ViewScopedWebVitals] ⚡ FID recorded: ${fidValue}ms (absolute: ${entry.startTime}ms)`);
          });
        });
        
        // Use buffered: true for initial load to capture metrics before SDK init
        // Use buffered: false for route changes to avoid contamination from previous view
        const shouldUseBuffer = currentView.type === 'initial';
        console.log(`[Optima ViewScopedWebVitals] ⚡ FID observer buffered: ${shouldUseBuffer} (viewType: ${currentView.type})`);
        
        fidObserver.observe({ type: 'first-input', buffered: shouldUseBuffer });
        this.observers.set('FID', fidObserver);
        
        // Also check if FID has already been determined (fallback)
        setTimeout(() => {
          if (!fidRecorded) {
            console.log('[Optima ViewScopedWebVitals] ⚡ No FID detected via observer, checking performance entries directly');
            const fidEntries = performance.getEntriesByType('first-input');
            
            if (fidEntries.length > 0) {
              const fidEntry = fidEntries[0]; // First input is the first one
              console.log(`[Optima ViewScopedWebVitals] ⚡ FID found in buffer: ${fidEntry.startTime}ms`);
              
              // For initial page load, use absolute timing
              const viewRelativeTime = fidEntry.startTime;
              const processingTime = fidEntry.processingEnd - fidEntry.processingStart;
              const fidValue = fidEntry.processingStart - fidEntry.startTime;
              
              this.viewManager.updateWebVital('FID', fidValue, {
                absoluteTime: fidEntry.startTime,
                viewRelativeTime: viewRelativeTime,
                processingTime: processingTime,
                interactionType: fidEntry.name,
                target: fidEntry.target ? this.getElementInfo(fidEntry.target) : null,
                source: 'fallback'
              });
              
              fidRecorded = true;
              console.log(`[Optima ViewScopedWebVitals] ⚡ FID recorded via fallback: ${fidValue}ms`);
            } else {
              console.log('[Optima ViewScopedWebVitals] ⚡ No FID entry found in performance buffer');
            }
          }
        }, 1000); // Wait 1 second for buffered entries
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up FID:', error);
      }
    }

    /**
     * Setup First Contentful Paint (FCP) - Initial load only
     */
    setupFCP() {
      if (!('PerformanceObserver' in window)) return;
      
      const currentView = this.viewManager.currentView;
      
      // FCP is ONLY applicable for initial page load, not route changes
      if (currentView.type !== 'initial') {
        console.log('[Optima ViewScopedWebVitals] 🎨 Skipping FCP setup - only applicable for initial page load');
        return;
      }
      
      console.log('[Optima ViewScopedWebVitals] 🎨 Setting up FCP tracking for initial page load');
      
      try {
        const viewStartTime = this.viewManager.currentView.startTime;
        let fcpRecorded = false;
        
        console.log(`[Optima ViewScopedWebVitals] 🎨 FCP setup - viewStartTime: ${viewStartTime}, viewType: ${currentView.type}`);
        
        const fcpObserver = new PerformanceObserver((list) => {
          if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) return;
          
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          
          if (fcpEntry && !fcpRecorded) {
            console.log(`[Optima ViewScopedWebVitals] 🎨 FCP entry found - startTime: ${fcpEntry.startTime}`);
            
            // For initial page load, accept all FCP entries from the buffer (use absolute timing)
            const viewRelativeTime = fcpEntry.startTime;
            
            this.viewManager.updateWebVital('FCP', viewRelativeTime, {
              absoluteTime: fcpEntry.startTime
            });
            
            fcpRecorded = true;
            console.log(`[Optima ViewScopedWebVitals] 🎨 FCP recorded: ${viewRelativeTime}ms (absolute: ${fcpEntry.startTime}ms)`);
          }
        });
        
        // Use buffered: true for initial load to capture metrics before SDK init
        // Use buffered: false for route changes to avoid contamination from previous view
        const shouldUseBuffer = currentView.type === 'initial';
        console.log(`[Optima ViewScopedWebVitals] 🎨 FCP observer buffered: ${shouldUseBuffer} (viewType: ${currentView.type})`);
        
        fcpObserver.observe({ type: 'paint', buffered: shouldUseBuffer });
        this.observers.set('FCP', fcpObserver);
        
        // Also check if FCP has already been determined (fallback)
        setTimeout(() => {
          if (!fcpRecorded) {
            console.log('[Optima ViewScopedWebVitals] 🎨 No FCP detected via observer, checking performance entries directly');
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            
            if (fcpEntry) {
              console.log(`[Optima ViewScopedWebVitals] 🎨 FCP found in buffer: ${fcpEntry.startTime}ms`);
              
              // For initial page load, use absolute timing
              const viewRelativeTime = fcpEntry.startTime;
              
              this.viewManager.updateWebVital('FCP', viewRelativeTime, {
                absoluteTime: fcpEntry.startTime,
                source: 'fallback'
              });
              
              fcpRecorded = true;
              console.log(`[Optima ViewScopedWebVitals] 🎨 FCP recorded via fallback: ${viewRelativeTime}ms`);
            } else {
              console.log('[Optima ViewScopedWebVitals] 🎨 No FCP entry found in performance buffer');
            }
          }
        }, 1000); // Wait 1 second for buffered entries
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up FCP:', error);
      }
    }

    /**
     * Setup Time to First Byte (TTFB) - Initial load only
     */
    setupTTFB() {
      const currentView = this.viewManager.currentView;
      
      // TTFB is ONLY applicable for initial page load, not route changes
      if (currentView.type !== 'initial') {
        console.log('[Optima ViewScopedWebVitals] 🌐 Skipping TTFB setup - only applicable for initial page load');
        return;
      }
      
      console.log('[Optima ViewScopedWebVitals] 🌐 Setting up TTFB tracking for initial page load');
      
      try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (!navEntry) return;
        
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        
        this.viewManager.updateWebVital('TTFB', ttfb, {
          domainLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          connection: navEntry.connectEnd - navEntry.connectStart,
          request: navEntry.responseStart - navEntry.requestStart,
          tls: navEntry.secureConnectionStart ? navEntry.connectEnd - navEntry.secureConnectionStart : 0
        });
        
        console.log(`[Optima ViewScopedWebVitals] 🌐 TTFB recorded: ${ttfb}ms`);
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up TTFB:', error);
      }
    }

    /**
     * Setup Cumulative Layout Shift (CLS) - Continuous metric
     */
    setupCLS() {
      if (!('PerformanceObserver' in window)) return;
      
      console.log('[Optima ViewScopedWebVitals] 📐 Setting up CLS tracking');
      
      try {
        const viewStartTime = this.viewManager.currentView.startTime;
        let clsValue = 0;
        
        const clsObserver = new PerformanceObserver((list) => {
          if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) return;
          
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            // Only count shifts that happened after view start
            if (entry.startTime >= viewStartTime && !entry.hadRecentInput) {
              clsValue += entry.value;
              
              // Get shift source information
              const shiftSource = getLargestShiftSource(entry);
              
              // Update view's web vital
              this.viewManager.updateWebVital('CLS', clsValue, {
                lastShiftTime: entry.startTime - viewStartTime,
                lastShiftValue: entry.value,
                shiftSource: shiftSource,
                hadRecentInput: entry.hadRecentInput
              });
            }
          });
        });
        
        // For CLS: Use buffered: true for initial load to include layout shifts from page load
        // Use buffered: false for route changes to only track shifts after route change
        const currentView = this.viewManager.currentView;
        const shouldUseBuffer = currentView.type === 'initial';
        console.log(`[Optima ViewScopedWebVitals] 📐 CLS observer buffered: ${shouldUseBuffer} (viewType: ${currentView.type})`);
        
        clsObserver.observe({ type: 'layout-shift', buffered: shouldUseBuffer });
        this.observers.set('CLS', clsObserver);
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up CLS:', error);
      }
    }

    /**
     * Setup Interaction to Next Paint (INP) - Continuous metric
     */
    setupINP() {
      console.log('[Optima ViewScopedWebVitals] 🖱️ Setting up INP tracking');
      
      try {
        const viewStartTime = this.viewManager.currentView.startTime;
        let maxINP = 0;
        
        // Track interactions with event listeners
        const eventTypes = ['click', 'keydown', 'pointerdown'];
        
        eventTypes.forEach(type => {
          document.addEventListener(type, (event) => {
            if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) return;
            
            const eventTime = performance.now();
            
            // Only track interactions within current view
            if (eventTime < viewStartTime) return;
            
            // Measure interaction timing
            this.measureInteraction(event, eventTime - viewStartTime);
          }, { passive: true, capture: true });
        });
        
        // Also use PerformanceObserver for event entries if available
        if ('PerformanceObserver' in window && 
            PerformanceObserver.supportedEntryTypes?.includes('event')) {
          
          const inpObserver = new PerformanceObserver((list) => {
            if (!this.viewManager.currentView || !this.viewManager.currentView.isActive) return;
            
            const entries = list.getEntries();
            
                      entries.forEach((entry) => {
              if (entry.startTime >= viewStartTime) {
                const duration = entry.processingEnd - entry.startTime;
                const elementInfo = entry.target ? this.getElementInfo(entry.target) : null;
                
                console.log(`[Optima ViewScopedWebVitals] 🖱️ INP entry detected:`, {
                  duration: duration,
                  interactionType: entry.name,
                  startTime: entry.startTime,
                  processingStart: entry.processingStart,
                  processingEnd: entry.processingEnd,
                  elementInfo: elementInfo,
                  currentMaxINP: maxINP
                });
                
                if (duration > maxINP) {
                  maxINP = duration;
                  
                  this.viewManager.updateWebVital('INP', duration, {
                    viewRelativeTime: entry.startTime - viewStartTime,
                    interactionType: entry.name,
                    target: elementInfo,
                    processingTime: entry.processingEnd - entry.processingStart,
                    inputDelay: entry.processingStart - entry.startTime
                  });
                  
                  console.log(`[Optima ViewScopedWebVitals] 🖱️ INP updated: ${duration}ms (element: ${elementInfo?.tagName}#${elementInfo?.id || 'no-id'})`);
                } else {
                  console.log(`[Optima ViewScopedWebVitals] 🖱️ INP entry ignored (${duration}ms <= ${maxINP}ms)`);
                }
              } else {
                console.log(`[Optima ViewScopedWebVitals] 🖱️ INP entry ignored (before view start: ${entry.startTime} < ${viewStartTime})`);
              }
            });
          });
          
          // For INP: Use buffered: true for initial load to include interactions from page load
          // Use buffered: false for route changes to only track interactions after route change
          const currentView = this.viewManager.currentView;
          const shouldUseBuffer = currentView.type === 'initial';
          console.log(`[Optima ViewScopedWebVitals] 🖱️ INP observer buffered: ${shouldUseBuffer} (viewType: ${currentView.type})`);
          
          inpObserver.observe({ type: 'event', buffered: shouldUseBuffer });
          this.observers.set('INP', inpObserver);
        }
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up INP:', error);
      }
    }

    /**
     * Setup loading time tracking - For both initial load and route changes
     */
    setupLoadingTime() {
      console.log('[Optima ViewScopedWebVitals] ⏱️ Setting up loading time tracking');
      
      try {
        // Cleanup any existing tracker
        if (this.loadingTimeTracker) {
          this.loadingTimeTracker.cleanup();
        }
        
        // Create and start new tracker
        this.loadingTimeTracker = new ViewScopedLoadingTimeTracker(this.viewManager);
        this.loadingTimeTracker.start();
        
      } catch (error) {
        console.error('[Optima ViewScopedWebVitals] ❌ Error setting up loading time:', error);
      }
    }

    /**
     * Measure interaction timing manually
     * @param {Event} event - The interaction event
     * @param {number} viewRelativeTime - Time relative to view start
     */
    measureInteraction(event, viewRelativeTime) {
      const startTime = performance.now();
      const elementInfo = this.getElementInfo(event.target);
      
      console.log(`[Optima ViewScopedWebVitals] 🖱️ Manual interaction detected:`, {
        eventType: event.type,
        elementInfo: elementInfo,
        viewRelativeTime: viewRelativeTime,
        startTime: startTime
      });
      
      // Use requestAnimationFrame to measure when the next paint happens
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update INP if this interaction is slower
        const currentINP = this.viewManager.currentView?.webVitals?.INP?.value || 0;
        
        console.log(`[Optima ViewScopedWebVitals] 🖱️ Manual interaction measured:`, {
          duration: duration,
          currentINP: currentINP,
          willUpdate: duration > currentINP,
          elementInfo: elementInfo
        });
        
        if (duration > currentINP) {
          this.viewManager.updateWebVital('INP', duration, {
            viewRelativeTime: viewRelativeTime,
            interactionType: event.type,
            target: elementInfo,
            manual: true
          });
          
          console.log(`[Optima ViewScopedWebVitals] 🖱️ Manual INP recorded: ${duration}ms (element: ${elementInfo?.tagName}#${elementInfo?.id || 'no-id'})`);
        } else {
          console.log(`[Optima ViewScopedWebVitals] 🖱️ Manual interaction ignored (${duration}ms <= ${currentINP}ms)`);
        }
      });
    }

    /**
     * Extract LCP element information
     * @param {PerformanceEntry} lcpEntry - LCP performance entry
     * @returns {Object} Element information
     */
    extractLCPElementInfo(lcpEntry) {
      try {
        if (!lcpEntry.element) return null;
        
        return {
          tagName: lcpEntry.element.tagName,
          id: lcpEntry.element.id || null,
          className: lcpEntry.element.className || null,
          src: lcpEntry.element.src || lcpEntry.element.currentSrc || null,
          url: lcpEntry.url || null,
          size: lcpEntry.size || 0
        };
      } catch (error) {
        return null;
      }
    }

    /**
     * Calculate LCP attribution breakdown
     * @param {PerformanceEntry} lcpEntry - LCP performance entry
     * @param {number} viewStartTime - View start time
     * @returns {Object} Attribution breakdown
     */
    calculateLCPAttribution(lcpEntry, viewStartTime) {
      try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (!navEntry) return null;
        
        return {
          ttfb: Math.round(navEntry.responseStart - navEntry.requestStart),
          resourceLoadDelay: Math.round(Math.max(0, lcpEntry.loadTime - navEntry.responseStart)),
          resourceLoadDuration: Math.round(Math.max(0, lcpEntry.loadTime - lcpEntry.startTime)),
          elementRenderDelay: Math.round(lcpEntry.startTime - viewStartTime)
        };
      } catch (error) {
        return null;
      }
    }

    /**
     * Get element information for interactions
     * @param {Element} element - DOM element
     * @returns {Object} Element information
     */
    getElementInfo(element) {
      if (!element) return null;
      
      try {
        const info = {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          textContent: element.textContent?.substring(0, 100) || null,
          type: element.type || null,
          name: element.name || null,
          href: element.href || null,
          role: element.getAttribute('role') || null
        };
        
        // Add more context for debugging
        if (element.closest) {
          const parentButton = element.closest('button');
          const parentLink = element.closest('a');
          const parentForm = element.closest('form');
          
          if (parentButton && parentButton !== element) {
            info.parentButton = {
              id: parentButton.id || null,
              className: parentButton.className || null,
              textContent: parentButton.textContent?.substring(0, 50) || null
            };
          }
          
          if (parentLink && parentLink !== element) {
            info.parentLink = {
              href: parentLink.href || null,
              textContent: parentLink.textContent?.substring(0, 50) || null
            };
          }
          
          if (parentForm && parentForm !== element) {
            info.parentForm = {
              id: parentForm.id || null,
              name: parentForm.name || null,
              action: parentForm.action || null
            };
          }
        }
        
        return info;
      } catch (error) {
        console.warn('[Optima ViewScopedWebVitals] ⚠️ Error getting element info:', error);
        return { error: error.message };
      }
    }

    /**
     * Clear all observers
     */
    clearObservers() {
      console.log('[Optima ViewScopedWebVitals] 🧹 Clearing web vitals observers');
      
      this.observers.forEach((observer, metric) => {
        try {
          observer.disconnect();
        } catch (error) {
          console.error(`[Optima ViewScopedWebVitals] ❌ Error disconnecting ${metric} observer:`, error);
        }
      });
      
      this.observers.clear();
    }

    /**
     * Stop collecting and cleanup
     */
    stopCollecting() {
      console.log('[Optima ViewScopedWebVitals] 🛑 Stopping web vitals collection');
      
      this.clearObservers();
      
      // Cleanup loading time tracker
      if (this.loadingTimeTracker) {
        this.loadingTimeTracker.cleanup();
        this.loadingTimeTracker = null;
      }
      
      this.isSetup = false;
    }

    /**
     * Reset for new view
     */
    reset() {
      console.log('[Optima ViewScopedWebVitals] 🔄 Resetting web vitals collector');
      
      this.stopCollecting();
    }
  }

  /**
   * View-Scoped Loading Time Tracker
   * Adapted from legacy SDK's sophisticated activity-based tracking
   */
  class ViewScopedLoadingTimeTracker {
    constructor(viewManager) {
      this.viewManager = viewManager;
      this.startTime = null;
      this.lastActivityTime = null;
      this.isComplete = false;
      this.isTracking = false;
      this.activitySources = new Set();
      this.detailedActivities = []; // New: Array to store detailed activity information
      this.quietPeriod = 200; // 200ms quiet period
      this.maxWaitTime = 20000; // 20 seconds maximum
      this.checkInterval = null;
      this.observers = [];
      this.pendingRequests = new Set();
      this.pendingResources = new Set();
      this.viewType = null;
      this.baselineTime = null;
      
      // Store original methods for cleanup
      this.originalXHROpen = null;
      this.originalXHRSend = null;
      this.originalFetch = null;
    }

    start() {
      if (!this.viewManager.currentView) return;
      
      const currentView = this.viewManager.currentView;
      this.viewType = currentView.type;
      this.isTracking = true;
      
      // ENHANCED BASELINE TIME CALCULATION WITH COMPREHENSIVE LOGGING
      console.group(`🎯 Loading Time Baseline Calculation - ${this.viewType.toUpperCase()} VIEW`);
      
      if (this.viewType === 'initial') {
        // For initial page load, use navigation fetchStart time (when actual request began)
        try {
          const navEntry = performance.getEntriesByType('navigation')[0];
          if (navEntry) {
            // FIXED: Use fetchStart instead of startTime (which is always 0)
            this.baselineTime = performance.timeOrigin + navEntry.fetchStart;
            
            console.log('📊 Navigation Timing Details:');
            console.table({
              'Navigation Start': `${navEntry.startTime}ms (always 0)`,
              'Fetch Start': `${navEntry.fetchStart}ms ✅ USING THIS`,
              'DOM Content Loaded': `${navEntry.domContentLoadedEventEnd}ms`,
              'Load Event End': `${navEntry.loadEventEnd}ms`,
              'Performance Origin': new Date(performance.timeOrigin).toISOString()
            });
            
            console.log(`✅ Initial load baseline: ${this.baselineTime} (performance.timeOrigin + ${navEntry.fetchStart}ms)`);
          } else {
            this.baselineTime = performance.timeOrigin;
            console.warn('⚠️ No navigation entry found, using performance.timeOrigin as fallback');
          }
        } catch (e) {
          this.baselineTime = performance.timeOrigin;
          console.error('❌ Error getting navigation timing, using performance.timeOrigin as fallback:', e);
        }
      } else {
        // For route changes, use the precise route trigger time if available
        const routeTriggerTime = currentView.routeTriggerTime;
        const interactionBaseline = currentView.interactionBaseline;
        
        console.log('📊 Route Change Timing Details:');
        console.table({
          'View Start Time': `${currentView.startTime.toFixed(2)}ms`,
          'Route Trigger Time': routeTriggerTime ? `${routeTriggerTime.toFixed(2)}ms ✅ USING THIS` : 'Not available',
          'Interaction Baseline': interactionBaseline ? `${interactionBaseline.toFixed(2)}ms (alternative)` : 'Not available',
          'Current Time': `${performance.now().toFixed(2)}ms`,
          'View Creation Delay': routeTriggerTime ? `${(currentView.startTime - routeTriggerTime).toFixed(2)}ms` : 'N/A'
        });
        
        if (routeTriggerTime && typeof routeTriggerTime === 'number') {
          // FIXED: Use precise route trigger time instead of current time
          this.baselineTime = performance.timeOrigin + routeTriggerTime;
          console.log(`✅ Route change baseline: ${this.baselineTime} (performance.timeOrigin + ${routeTriggerTime.toFixed(2)}ms)`);
          console.log(`⚡ Precision advantage: ${((performance.timeOrigin + performance.now()) - this.baselineTime).toFixed(2)}ms earlier than current time`);
        } else {
          // Fallback to current time if route trigger time is not available
          this.baselineTime = performance.timeOrigin + performance.now();
          console.warn('⚠️ No route trigger time available, using current time as fallback');
          console.log(`🔄 Fallback baseline: ${this.baselineTime} (performance.timeOrigin + ${performance.now().toFixed(2)}ms)`);
        }
      }
      
      this.startTime = this.baselineTime;
      this.lastActivityTime = this.baselineTime;
      
      console.log(`🎯 FINAL BASELINE: ${this.baselineTime}`);
      console.log(`📅 Baseline Date: ${new Date(this.baselineTime).toISOString()}`);
      console.log(`⏱️ Time since baseline: ${((performance.timeOrigin + performance.now()) - this.baselineTime).toFixed(2)}ms`);
      console.groupEnd();
      
      // Enhanced loading time tracking start log
      console.group(
        `%c🚀 Loading Time Tracking Started %c${this.viewType.toUpperCase()}`,
        'color: #10b981; font-weight: bold; font-size: 14px;',
        'color: #3b82f6; font-weight: bold; font-size: 12px; background: #eff6ff; padding: 2px 6px; border-radius: 4px;'
      );
      
      console.log('%c📊 Tracking Configuration:', 'color: #6b7280; font-weight: bold;');
      console.table({
        'View Type': this.viewType,
        'Baseline Time': new Date(this.baselineTime).toISOString(),
        'Quiet Period': `${this.quietPeriod}ms`,
        'Max Wait Time': `${this.viewType === 'initial' ? this.maxWaitTime : 20000}ms`,
        'Activity Sources': 'resource, xhr, fetch, dom_mutation'
      });
      
      console.groupEnd();
      
      // Setup activity monitoring
      this.setupResourceObserver();
      this.setupXHRMonitoring();
      this.setupFetchMonitoring();
      this.setupMutationObserver();
      
      // Start checking for completion
      this.startCompletionCheck();
      
      // Maximum timeout - shorter for route changes
      const timeout = this.viewType === 'initial' ? this.maxWaitTime : 20000; // 20s for route changes
      setTimeout(() => {
        if (!this.isComplete) {
          this.complete('timeout');
        }
      }, timeout);
    }

    recordActivity(source, details = null) {
      if (this.isComplete || !this.isTracking) return;
      
      const currentTime = performance.timeOrigin + performance.now();
      const timeSinceBaseline = currentTime - this.baselineTime;
      const timeSinceLastActivity = currentTime - this.lastActivityTime;
      
      this.lastActivityTime = currentTime;
      this.activitySources.add(source);
      
      // Store detailed activity information
      if (details) {
        const activityRecord = {
          type: source,
          timestamp: currentTime,
          timeSinceBaseline: Math.round(timeSinceBaseline),
          ...details
        };
        this.detailedActivities.push(activityRecord);
        
        // Limit detailed activities to prevent memory bloat (keep last 50)
        if (this.detailedActivities.length > 50) {
          this.detailedActivities = this.detailedActivities.slice(-50);
        }
      }
      
      // Enhanced activity logging with context
      console.log(
        `%c📊 Activity Detected %c${source.toUpperCase()}`,
        'color: #f59e0b; font-weight: bold;',
        'color: #ffffff; background: #f59e0b; padding: 1px 4px; border-radius: 3px; font-size: 11px;'
      );
      console.log(`⏱️ Time since baseline: ${timeSinceBaseline.toFixed(2)}ms`);
      console.log(`⏰ Time since last activity: ${timeSinceLastActivity.toFixed(2)}ms`);
      if (details) {
        console.log(`🔍 Activity details:`, details);
      }
      console.log(`📈 Active sources: [${Array.from(this.activitySources).join(', ')}]`);
      console.log(`🔄 Pending: ${this.pendingRequests.size} requests, ${this.pendingResources.size} resources`);
      
      // Reset completion check
      if (this.checkInterval) {
        clearTimeout(this.checkInterval);
      }
      this.startCompletionCheck();
    }

    setupResourceObserver() {
      if (!window.PerformanceObserver || 
          !window.PerformanceObserver.supportedEntryTypes ||
          !window.PerformanceObserver.supportedEntryTypes.includes('resource')) {
        return;
      }

      try {
        const observer = new PerformanceObserver((list) => {
          if (this.isComplete || !this.isTracking) return;
          
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            const resourceStartTime = performance.timeOrigin + entry.startTime;
            
            // For initial load: consider all resources after navigation start
            // For route changes: consider resources after baseline (route change time)
            if (resourceStartTime >= this.baselineTime) {
              this.pendingResources.add(entry.name);
              
              // Create detailed activity information for this resource
              const resourceDetails = {
                url: entry.name,
                type: entry.initiatorType || 'unknown',
                size: entry.transferSize || 0,
                duration: Math.round(entry.duration || 0),
                startTime: Math.round(entry.startTime),
                endTime: Math.round(entry.startTime + (entry.duration || 0))
              };
              
              this.recordActivity('resource', resourceDetails);
              
              // Remove from pending when complete
              setTimeout(() => {
                this.pendingResources.delete(entry.name);
              }, 50);
            }
          });
        });

        observer.observe({ type: 'resource', buffered: false });
        this.observers.push(observer);
        
      } catch (e) {
        console.error('[Optima LoadingTimeTracker] ❌ Resource observer failed:', e);
      }
    }

    setupXHRMonitoring() {
      if (!window.XMLHttpRequest) return;
      
      // Store original methods
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
      
      const self = this;

      XMLHttpRequest.prototype.open = function(method, url, async) {
        this._optimaUrl = url;
        this._optimaMethod = method;
        this._optimaStartTime = performance.now();
        return self.originalXHROpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function(data) {
        if (self.isComplete || !self.isTracking) {
          return self.originalXHRSend.apply(this, arguments);
        }

        // Get SDK config for exclusion list
        const sdkConfig = self.viewManager.sdk?.config || {};

        // Check if this URL should be excluded from loading time tracking
        if (isInExclusionList(this._optimaUrl, sdkConfig)) {
          return self.originalXHRSend.apply(this, arguments);
        }

        const requestId = `xhr_${this._optimaUrl}_${this._optimaStartTime}`;
        self.pendingRequests.add(requestId);
        
        // Create detailed activity information for this XHR request
        const xhrDetails = {
          url: this._optimaUrl,
          method: this._optimaMethod || 'GET',
          startTime: Math.round(this._optimaStartTime),
          requestType: 'XMLHttpRequest'
        };
        
        self.recordActivity('xhr', xhrDetails);

        const cleanup = () => {
          self.pendingRequests.delete(requestId);
        };

        this.addEventListener('loadend', cleanup);
        this.addEventListener('error', cleanup);
        this.addEventListener('abort', cleanup);

        return self.originalXHRSend.apply(this, arguments);
      };
    }

    setupFetchMonitoring() {
      if (!window.fetch) return;

      // Store original fetch
      this.originalFetch = window.fetch;
      const self = this;

      window.fetch = function(input, init) {
        if (self.isComplete || !self.isTracking) {
          return self.originalFetch.apply(this, arguments);
        }

        const url = typeof input === 'string' ? input : input.url;
        
        // Get SDK config for exclusion list
        const sdkConfig = self.viewManager.sdk?.config || {};
        
        // Check if this URL should be excluded from loading time tracking
        if (isInExclusionList(url, sdkConfig)) {
          return self.originalFetch.apply(this, arguments);
        }

        const method = init?.method || 'GET';
        const requestId = `fetch_${url}_${performance.now()}`;
        
        self.pendingRequests.add(requestId);
        
        // Create detailed activity information for this Fetch request
        const fetchDetails = {
          url: url,
          method: method,
          startTime: Math.round(performance.now()),
          requestType: 'fetch'
        };
        
        self.recordActivity('fetch', fetchDetails);

        return self.originalFetch.apply(this, arguments)
          .finally(() => {
            self.pendingRequests.delete(requestId);
          });
      };
    }

    setupMutationObserver() {
      if (!window.MutationObserver) return;

      try {
        const observer = new MutationObserver((mutations) => {
          if (this.isComplete || !this.isTracking) return;

          // Only count significant mutations
          const significantMutations = mutations.filter(mutation => {
            // Skip style changes and minor attribute changes
            if (mutation.type === 'attributes' && 
                ['style', 'class'].includes(mutation.attributeName)) {
              return false;
            }
            
            // Count node additions/removals
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
              return true;
            }

            return false;
          });

          if (significantMutations.length > 0) {
            // Create detailed activity information for DOM mutations
            const mutationDetails = {
              mutationCount: significantMutations.length,
              addedNodes: significantMutations.reduce((sum, m) => sum + m.addedNodes.length, 0),
              removedNodes: significantMutations.reduce((sum, m) => sum + m.removedNodes.length, 0),
              attributeChanges: significantMutations.filter(m => m.type === 'attributes').length,
              targets: significantMutations.map(m => m.target.tagName || 'unknown').slice(0, 5) // Limit to first 5 targets
            };
            
            this.recordActivity('dom_mutation', mutationDetails);
          }
        });

        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src', 'href', 'data-src']
        });

        this.observers.push(observer);
        
      } catch (e) {
        console.error('[Optima LoadingTimeTracker] ❌ Mutation observer failed:', e);
      }
    }

    setupLoadEventFallback() {
      // Only for initial page load
      if (this.viewType !== 'initial') return;
      
      if (document.readyState === 'complete') {
        // Page already loaded - complete quickly for initial load
        setTimeout(() => {
          if (!this.isComplete) {
            this.complete('load_event_already_complete');
          }
        }, 100); // Much shorter delay
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => {
            if (!this.isComplete) {
              this.complete('load_event');
            }
          }, 200); // Shorter delay after load event
        });
      }
    }

    startCompletionCheck() {
      this.checkInterval = setTimeout(() => {
        this.checkForCompletion();
      }, this.quietPeriod);
    }

    checkForCompletion() {
      if (this.isComplete || !this.isTracking) return;

      const now = performance.timeOrigin + performance.now();
      const timeSinceLastActivity = now - this.lastActivityTime;
      const totalTime = now - this.baselineTime;

      // Check if we have any pending requests or resources
      const hasPendingActivity = this.pendingRequests.size > 0 || this.pendingResources.size > 0;

      // Enhanced completion check logging
      console.group(`🔍 Loading Time Completion Check - ${this.viewType.toUpperCase()}`);
      console.log('%c📊 Current Status:', 'color: #6b7280; font-weight: bold;');
      console.table({
        'Time Since Last Activity': `${Math.round(timeSinceLastActivity)}ms`,
        'Total Time Since Baseline': `${Math.round(totalTime)}ms`,
        'Quiet Period Threshold': `${this.quietPeriod}ms`,
        'Pending Requests': this.pendingRequests.size,
        'Pending Resources': this.pendingResources.size,
        'Has Pending Activity': hasPendingActivity,
        'Activity Sources': Array.from(this.activitySources).join(', ') || 'none'
      });

      // Different completion logic for initial vs route change
      if (this.viewType === 'initial') {
        const maxTimeReached = totalTime >= 20000;
        const quietPeriodMet = timeSinceLastActivity >= this.quietPeriod && !hasPendingActivity;
        
        console.log('%c🎯 Initial Load Completion Logic:', 'color: #3b82f6; font-weight: bold;');
        console.table({
          'Quiet Period Met': quietPeriodMet,
          'Max Time Reached (20s)': maxTimeReached,
          'Will Complete': quietPeriodMet || maxTimeReached,
          'Completion Reason': maxTimeReached ? 'max_time_reached' : (quietPeriodMet ? 'activity_quiet' : 'continue_tracking')
        });
        
        // For initial load: wait for quiet period or reasonable time limit
        if (quietPeriodMet || maxTimeReached) {
          const reason = maxTimeReached ? 'max_time_reached' : 'activity_quiet';
          console.log(`✅ Completing initial load: ${reason}`);
          console.groupEnd();
          this.complete(reason);
          return;
        }
      } else {
        const quietPeriodMet = timeSinceLastActivity >= this.quietPeriod && !hasPendingActivity;
        const maxTimeReached = totalTime >= 20000;
        
        console.log('%c🎯 Route Change Completion Logic:', 'color: #8b5cf6; font-weight: bold;');
        console.table({
          'Quiet Period Met': quietPeriodMet,
          'Max Time Reached (20s)': maxTimeReached,
          'Will Complete': quietPeriodMet || maxTimeReached,
          'Completion Reason': maxTimeReached ? 'route_change_timeout' : (quietPeriodMet ? 'activity_quiet' : 'continue_tracking')
        });
        
        // For route changes: be more aggressive about completion
        if (quietPeriodMet) {
          console.log(`✅ Completing route change: activity_quiet`);
          console.groupEnd();
          this.complete('activity_quiet');
          return;
        }
        
        // For route changes, if we've been tracking for more than 10 seconds, complete
        if (maxTimeReached) {
          console.log(`✅ Completing route change: route_change_timeout`);
          console.groupEnd();
          this.complete('route_change_timeout');
          return;
        }
      }
      
      console.log(`🔄 Continuing tracking - next check in ${this.quietPeriod}ms`);
      console.groupEnd();
      
      // Continue checking
      this.startCompletionCheck();
    }

    complete(reason) {
      if (this.isComplete) return;

      this.isComplete = true;
      this.isTracking = false;
      
      // Calculate loading time
      const endTime = this.lastActivityTime;
      const loadingTime = Math.round(endTime - this.baselineTime);
      
      // FIXED: Capture activity sources and detailed activities BEFORE cleanup (which clears them)
      const activityList = Array.from(this.activitySources).join(', ') || 'none';
      const detectedActivities = Array.from(this.activitySources);
      const detailedActivitiesCopy = [...this.detailedActivities]; // Copy detailed activities
      
      // Cleanup observers and restore original methods
      this.cleanup();

      // Update view's web vital
      this.viewManager.updateWebVital('loading_time', loadingTime, {
        reason: reason,
        activitySources: detectedActivities, // Use captured activities
        detailedActivities: detailedActivitiesCopy, // Include detailed activities
        viewType: this.viewType,
        baselineTime: this.baselineTime,
        endTime: endTime,
        pendingRequestsCount: this.pendingRequests.size,
        pendingResourcesCount: this.pendingResources.size
      });

      // Enhanced logging (similar to legacy SDK)
      console.group(
        `%c🚀 View Loading Time Complete! %c${loadingTime}ms`,
        'color: #10b981; font-weight: bold; font-size: 14px;',
        'color: #3b82f6; font-weight: bold; font-size: 16px; background: #eff6ff; padding: 2px 6px; border-radius: 4px;'
      );
      
      console.log('%c📊 Performance Details:', 'color: #6b7280; font-weight: bold;');
      console.table({
        'Loading Time': `${loadingTime}ms`,
        'View Type': this.viewType,
        'Completion Reason': reason,
        'Activity Sources': activityList,
        'Baseline Time': new Date(this.baselineTime).toISOString(),
        'Completion Time': new Date(endTime).toISOString()
      });
      
      if (detectedActivities.length > 0) {
        console.log('%c🔍 Detected Activities:', 'color: #6b7280; font-weight: bold;', detectedActivities);
      }
      
      console.log('%c⚡ Ready for analysis in Optima Dashboard', 'color: #8b5cf6; font-style: italic;');
      console.groupEnd();
    }

    cleanup() {
      // Clear check interval
      if (this.checkInterval) {
        clearTimeout(this.checkInterval);
        this.checkInterval = null;
      }

      // Disconnect observers
      this.observers.forEach(observer => {
        if (observer.disconnect) {
          observer.disconnect();
        }
      });
      this.observers = [];

      // Restore original XHR methods (important for view isolation)
      if (this.originalXHROpen) {
        XMLHttpRequest.prototype.open = this.originalXHROpen;
      }
      if (this.originalXHRSend) {
        XMLHttpRequest.prototype.send = this.originalXHRSend;
      }
      
      // Restore original fetch
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
      }
      
      // Clear pending tracking
      this.pendingRequests.clear();
      this.pendingResources.clear();
      this.activitySources.clear();
    }
  }

  /**
   * Error collection module for Optima SDK
   */

  /**
   * Set up error monitoring
   * @param {Object} sdk - Reference to the Optima SDK instance
   */
  function setupErrorMonitoring(sdk) {
    // Initialize buffer for errors - handle both unified and view-based SDK
    if (!sdk.buffer) {
      sdk.buffer = {};
    }
    if (!sdk.buffer.errors) {
      sdk.buffer.errors = [];
    }
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      captureErrorEvent(sdk, event);
    }, true); // Use capture to get all errors
    
    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      capturePromiseRejection(sdk, event);
    });
    
    patchConsoleError(sdk);
  }

  /**
   * Generate an error ID based on error properties
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {string} source - Error source
   * @param {string} stack - Error stack trace
   * @returns {string} A hash ID for the error
   */
  function generateErrorId(type, message, source, stack) {
    // Create a string by combining essential error properties
    const errorString = `${type}:${message}:${source}:${stack ? stack.substring(0, 150) : ''}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < errorString.length; i++) {
      const char = errorString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Return a string version of the hash
    return 'err_' + Math.abs(hash).toString(16);
  }

  /**
   * Capture error events
   * @param {Object} sdk - Reference to the Optima SDK instance
   * @param {ErrorEvent} event - Error event to capture
   */
  function captureErrorEvent(sdk, event) {
    if (!event) return;
    
    try {
      const error = event.error || new Error(event.message || 'Unknown error');
      const message = error.message || event.message || 'Unknown error';
      const source = event.filename || event.srcElement?.src || window.location.href;
      const stack = error.stack || null;
      const type = 'error';
      
      const errorData = {
        type,
        message,
        source,
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack,
        timestamp: Date.now(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_id: generateErrorId(type, message, source, stack)
      };
      
      // Add to the errors buffer
      storeErrorData(sdk, errorData);
      
      // Flush errors immediately for uncaught errors
      flushErrors(sdk);
      
      // Also send as event for backward compatibility
      sdk.sendEvent('error', {
        error_type: 'uncaught_error',
        message: errorData.message,
        source: errorData.source,
        lineno: errorData.lineno,
        colno: errorData.colno
      });
    } catch (e) {
      // Don't crash if error processing fails
    }
  }

  /**
   * Capture unhandled promise rejections
   * @param {Object} sdk - Reference to the Optima SDK instance
   * @param {PromiseRejectionEvent} event - Promise rejection event to capture
   */
  function capturePromiseRejection(sdk, event) {
    if (!event || !event.reason) return;
    
    try {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : null;
      const type = 'unhandled_rejection';
      const source = 'Promise';
      
      const errorData = {
        type,
        message,
        source,
        stack,
        timestamp: Date.now(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_id: generateErrorId(type, message, source, stack)
      };
      
      // Add to the errors buffer
      storeErrorData(sdk, errorData);
      
      // Flush errors immediately for unhandled rejections
      flushErrors(sdk);
      
      // Also send as event for backward compatibility
      sdk.sendEvent('error', {
        error_type: 'unhandled_rejection',
        message: errorData.message
      });
    } catch (e) {
      // Don't crash if error processing fails
    }
  }

  /**
   * @param {Object} sdk - Reference to the Optima SDK instance
   */
  function patchConsoleError(sdk) {
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      const source = 'console.error';
      
      try {
        // Capture the call stack trace
        const stackTrace = new Error().stack || '';
        
        // Format the message - join args as strings
        const message = args.map(arg => {
          if (arg instanceof Error) {
            return arg.message;
          } else if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return String(arg);
            }
          } else {
            return String(arg);
          }
        }).join(' ');
        
        const type = 'console_error';
        
        const errorData = {
          type,
          message,
          source,
          stack: stackTrace,
          timestamp: Date.now(),
          url: window.location.href,
          user_agent: navigator.userAgent,
          error_id: generateErrorId(type, message, source, stackTrace)
        };
        
        // Add to the errors buffer
        storeErrorData(sdk, errorData);
      } catch (e) {
      }
      
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Store error data in the buffer and potentially flush immediately
   * @param {Object} sdk - Reference to the Optima SDK instance
   * @param {Object} errorData - Error data to store
   */
  function storeErrorData(sdk, errorData) {
    // Check if we should sample this error (avoid flooding with same errors)
    if (shouldSampleError(sdk, errorData)) {
      // Add to errors buffer (unified SDK compatibility)
      sdk.buffer.errors.push(errorData);
      
      // For View-Based SDK, also add to current view
      if (sdk.viewManager && sdk.viewManager.currentView) {
        sdk.viewManager.addError(errorData);
      }
      
      // If buffer gets large, consolidate immediately
      if (sdk.buffer.errors.length >= 5) {
        // Immediately flush errors for critical issues
        flushErrors(sdk);
      }
    }
  }

  /**
   * Decide if we should record this error (for sampling/deduplication)
   * @param {Object} sdk - Reference to the Optima SDK instance
   * @param {Object} errorData - Error data to check
   * @returns {boolean} Whether to sample this error
   */
  function shouldSampleError(sdk, errorData) {
    // Always record if there are few errors
    if (sdk.buffer.errors.length < 5) {
      return true;
    }
    
    // Check for exact duplicate errors by error_id
    const isDuplicate = sdk.buffer.errors.some(error => {
      // If we have error_id, use it for exact matching
      if (error.error_id && errorData.error_id) {
        return error.error_id === errorData.error_id;
      }
      
      // Fallback to property comparison for older errors without IDs
      return error.type === errorData.type &&
             error.message === errorData.message && 
             error.source === errorData.source &&
             error.stack === errorData.stack;
    });
    
    // If it's an exact duplicate, don't record it
    if (isDuplicate) {
      return false;
    }
    
    // Check for similar errors in the last few entries (to prevent flooding)
    const recentErrors = sdk.buffer.errors.slice(-5);
    const isSimilar = recentErrors.some(error => {
      return error.message === errorData.message && 
             error.source === errorData.source &&
             // Only consider it a duplicate if it happened recently (within 5 seconds)
             errorData.timestamp - error.timestamp < 100;
    });
    
    return !isSimilar;
  }

  /**
   * Flush errors to the server immediately
   * @param {Object} sdk - Reference to the Optima SDK instance
   */
  function flushErrors(sdk) {
    // Skip if no errors to flush
    if (!sdk.buffer.errors || sdk.buffer.errors.length === 0) {
      return;
    }
    
    // Handle View-Based SDK
    if (sdk.viewManager && sdk.dataSender) {
      // For View-Based SDK, errors are already added to current view
      // Just clear the buffer since errors are sent with view data
      sdk.buffer.errors = [];
      return;
    }
    
    // Handle Unified SDK (backward compatibility)
    if (sdk.unifiedDataModel) {
      // Move errors to unified data model
      if (!sdk.unifiedDataModel.errors) {
        sdk.unifiedDataModel.errors = [];
      }
      
      // Add errors to unified model
      sdk.unifiedDataModel.errors = [
        ...sdk.unifiedDataModel.errors,
        ...sdk.buffer.errors
      ];
      
      // Clear buffer
      sdk.buffer.errors = [];
      
      // Send unified data with errors
      if (sdk._sendUnifiedData) {
        sdk._sendUnifiedData(false);
      }
    } else {
      // Clear buffer if no unified model
      sdk.buffer.errors = [];
    }
  }

  /**
   * View-Based Optima Performance Monitoring SDK
   * Enhanced version with view-based data collection and route change support
   */


  /**
   * ViewBasedOptima - Enhanced SDK with view-based architecture
   */
  const ViewBasedOptima = {
    // Core properties
    sessionId: null,
    apiKey: null,
    disabled: false,
    version: '2.0.0-view-based',
    
    // View-based components
    viewManager: null,
    routeDetector: null,
    dataSender: null,
    continuousMetrics: null,
    resourceCollector: null,
    webVitalsCollector: null,
    
    // State management
    isInitialized: false,
    initializationTime: null,
    visibilityChangeCount: 0,
    
    // Configuration - Full compatibility with old SDK
    config: {
      // Core settings (same as old SDK)
      apiKey: null,
      endpoint: null,
      sampleRate: 100,
      
      // Batch configuration (same as old SDK)
      flushInterval: 5000,
      webVitalsBatchDelay: 2000,
      batchBeforeSend: true,
      maxEventsPerBatch: 50,
      maxResourcesPerBatch: 50,
      maxWebVitalsPerBatch: 20,
      maxAjaxCallsPerBatch: 50,
      payloadCompressionThreshold: 10 * 1024, // 10KB
      
      // View-based specific settings
      enableRouteChangeTracking: true,
      enableContinuousMetrics: true,
      batchSize: 3,
      batchTimeout: 5000,
      continuousMetricsInterval: 10000,
      
      // Exclusion configuration
      exclusionList: null, // Array of URL patterns to exclude from performance tracking (overrides default third-party exclusions)
      
      // Additional settings
      debug: false,
      disabled: false
    },

    /**
     * Initialize the view-based SDK
     * @param {Object} options - Configuration options
     */
    init: function(options = {}) {
      if (this.isInitialized) {
        console.warn('[ViewBasedOptima] ⚠️ SDK already initialized');
        return;
      }

      console.log('1. [ViewBasedOptima] 🚀 Initializing View-Based Optima SDK v' + this.version);
      
      // Store initialization time
      this.initializationTime = Date.now();
      
      // Apply configuration
      this.applyConfiguration(options);
      
      // Validate required options
      if (!this.config.apiKey) {
        console.error('[ViewBasedOptima] ❌ API key is required');
        this.disabled = true;
        return;
      }
      
      // Check if SDK is disabled due to sampling
      if (this.config.disabled) {
        console.log('[ViewBasedOptima] ⏸️ SDK disabled due to sampling');
        this.disabled = true;
        return;
      }
      
      // Function to complete initialization
      const completeInit = () => {
        console.log('2. [ViewBasedOptima] 🚀 Initializing View-Based Optima SDK v' + this.version);
        // Initialize session
        this.initializeSession();
        
        // Initialize view-based architecture
        this.initializeViewBasedArchitecture();
        
        // Setup error monitoring (existing functionality)
        this.setupErrorMonitoring();
        
        // Setup page lifecycle events
        this.setupPageLifecycleEvents();
        
        // Start initial view
        this.startInitialView();
        
        this.isInitialized = true;
        
        console.log('[ViewBasedOptima] ✅ SDK initialization complete');
        
        // Send initialization event
        this.sendEvent('sdk_initialized', {
          version: this.version,
          architecture: 'view_based',
          config: this.config
        });
      };

      // Check document readiness
      if (document.readyState === 'loading') {
        // Wait for DOMContentLoaded if document is not ready
        document.addEventListener('DOMContentLoaded', completeInit);
        console.log('[ViewBasedOptima] 🔄 Waiting for DOMContentLoaded before completing initialization');
      } else {
        // Complete initialization immediately if document is already ready
        completeInit();
      }
    },

    /**
     * Apply configuration options
     * @param {Object} options - Configuration options
     */
    applyConfiguration: function(options) {
      // Merge with default config
      this.config = {
        ...this.config,
        ...options
      };
      
      // Validate and normalize sampleRate (same as old SDK)
      if (typeof this.config.sampleRate === 'number') {
        this.config.sampleRate = Math.min(Math.max(this.config.sampleRate, 1), 100);
      }
      
      // Store core settings for compatibility
      this.apiKey = this.config.apiKey;
      this.endpoint = this.config.endpoint;
      this.sampleRate = this.config.sampleRate;
      
      // Enable debug logging if requested
      if (this.config.debug) {
        console.log('[ViewBasedOptima] 🐛 Debug mode enabled');
        console.log(`[ViewBasedOptima] 🔧 SDK Config - Endpoint: ${this.endpoint}, API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET'}, Sample Rate: ${this.sampleRate}%`);
      }
      
      // Check if tracking should be disabled based on sample rate
      if (!this.shouldTrackSession(this.config.sampleRate)) {
        console.log(`[ViewBasedOptima] 🎲 Session not tracked (sample rate: ${this.config.sampleRate}%)`);
        this.config.disabled = true;
      }
    },

    /**
     * Initialize session
     */
    initializeSession: function() {
      this.sessionId = generateUUID();
      
      console.log(`[ViewBasedOptima] 🆔 Session initialized: ${this.sessionId.substring(0, 8)}...`);
    },

    /**
     * Initialize view-based architecture components
     */
    initializeViewBasedArchitecture: function() {
      console.log('[ViewBasedOptima] 🏗️ Initializing view-based architecture');
      
      // Initialize ViewManager
      this.viewManager = new ViewManager(this);
      
      // Initialize RouteChangeDetector
      if (this.config.enableRouteChangeTracking) {
        this.routeDetector = new RouteChangeDetector(this.viewManager);
        this.routeDetector.setupRouteDetection();
      }
      
      // Initialize DataSender
      this.dataSender = new ViewBasedDataSender(this);
      
      // Configure DataSender with all batch settings
      this.dataSender.updateConfig({ 
        maxBatchSize: this.config.batchSize,
        batchTimeout: this.config.batchTimeout,
        flushInterval: this.config.flushInterval,
        webVitalsBatchDelay: this.config.webVitalsBatchDelay,
        batchBeforeSend: this.config.batchBeforeSend,
        maxEventsPerBatch: this.config.maxEventsPerBatch,
        maxResourcesPerBatch: this.config.maxResourcesPerBatch,
        maxWebVitalsPerBatch: this.config.maxWebVitalsPerBatch,
        maxAjaxCallsPerBatch: this.config.maxAjaxCallsPerBatch,
        payloadCompressionThreshold: this.config.payloadCompressionThreshold
      });
      
      // Initialize ContinuousMetricsManager
      if (this.config.enableContinuousMetrics) {
        this.continuousMetrics = new ContinuousMetricsManager(this.viewManager, this.dataSender);
        if (this.config.continuousMetricsInterval && this.continuousMetrics.updateInterval) {
          this.continuousMetrics.updateInterval(this.config.continuousMetricsInterval);
        }
      }
      
      // Initialize collectors
      this.resourceCollector = new ViewScopedResourceCollector(this.viewManager);
      this.webVitalsCollector = new ViewScopedWebVitals(this.viewManager);
      
      // CRITICAL FIX: Assign webVitalsCollector to viewManager so resource collector can access it
      this.viewManager.webVitalsCollector = this.webVitalsCollector;
      
      console.log('[ViewBasedOptima] ✅ View-based architecture initialized');
    },

    /**
     * Determine if session should be tracked based on sample rate
     * @param {number} sampleRate - Percentage of sessions to track (1-100)
     * @returns {boolean} - Whether to track this session
     */
    shouldTrackSession: function(sampleRate) {
      // Always track if sample rate is 100 or higher
      if (sampleRate >= 100) return true;
      
      // Never track if sample rate is 0 or lower
      if (sampleRate <= 1) return Math.random() < 0.01;
      
      // Use random sampling for rates between 1-100
      return Math.random() * 100 < sampleRate;
    },

    /**
     * Setup error monitoring
     */
    setupErrorMonitoring: function() {
      try {
        setupErrorMonitoring(this);
      } catch (error) {
        console.error('[ViewBasedOptima] ❌ Error setting up error monitoring:', error);
      }
    },

    /**
     * Setup page lifecycle events
     */
    setupPageLifecycleEvents: function() {
      // Page visibility changes
      document.addEventListener('visibilitychange', () => {
        this.visibilityChangeCount++;
        
        if (document.visibilityState === 'hidden') {
          this.handlePageHidden();
        } else if (document.visibilityState === 'visible') {
          this.handlePageVisible();
        }
      });
      
      // Page unload
      window.addEventListener('beforeunload', () => {
        this.handlePageUnload();
      });
      
      // Page focus/blur
      window.addEventListener('blur', () => {
        this.sendEvent('page_blur', { timestamp: Date.now() });
      });
      
      window.addEventListener('focus', () => {
        this.sendEvent('page_focus', { timestamp: Date.now() });
      });
    },

    /**
     * Start initial view
     */
    startInitialView: function() {
      console.log('[ViewBasedOptima] 🎬 Starting initial view');
      
      // Start initial view
      this.viewManager.startNewView('initial', window.location.href);
      
      // NOTE: Removed duplicate startCollectorsForView call - already called by ViewManager.startNewView
      // This was causing two separate loading time trackers to be created
      
      // Start continuous metrics tracking
      if (this.continuousMetrics) {
        this.continuousMetrics.startContinuousTracking();
      }
      
      // Set up view completion callback
      this._onViewCompleted = (view, reason) => {
        this.handleViewCompleted(view, reason);
      };
    },

    /**
     * Start collectors for current view
     * @param {string} viewType - Type of view ('initial' or 'route_change')
     */
    startCollectorsForView: function(viewType) {
      console.log(`[ViewBasedOptima] 🔧 Starting collectors for ${viewType} view`);
      
      // Start resource collection
      this.resourceCollector.startCollecting();
      
      // Start web vitals collection
      this.webVitalsCollector.startCollecting(viewType);
    },

    /**
     * Handle view completion
     * @param {Object} view - Completed view
     * @param {string} reason - Completion reason
     */
    handleViewCompleted: function(view, reason) {
      console.log(`[ViewBasedOptima] 🏁 View completed: ${view.id.substring(0, 8)}... (${reason})`);
      
      // Send view data
      this.dataSender.sendViewData(view, reason);
      
      // Mark view as completed in data sender
      this.dataSender.markViewCompleted(view.id);
      
      // NOTE: Collector startup moved to handleRouteChange to avoid race condition
      // where collectors start before new view is fully created
    },

    /**
     * Handle page hidden event
     */
    handlePageHidden: function() {
      console.log('[ViewBasedOptima] 👁️ Page hidden');
      
      this.sendEvent('page_hidden', { timestamp: Date.now() }, { immediate: true });
      
      // Complete current view
      if (this.viewManager.currentView && !this.viewManager.currentView.isCompleted) {
        this.viewManager.completeView('page_hidden');
      }
      
      // Force flush any pending data
      if (this.dataSender) {
        this.dataSender.forceFlush();
      }
    },

    /**
     * Handle page visible event
     */
    handlePageVisible: function() {
      console.log('[ViewBasedOptima] 👁️ Page visible');
      
      this.sendEvent('page_visible', { timestamp: Date.now() });
    },

    /**
     * Handle page unload event
     */
    handlePageUnload: function() {
      console.log('[ViewBasedOptima] 📤 Page unloading');
      
      // Complete current view
      if (this.viewManager.currentView && !this.viewManager.currentView.isCompleted) {
        this.viewManager.completeView('page_unload');
      }
      
      // Force flush all data
      if (this.dataSender) {
        this.dataSender.forceFlush();
      }
      
      // Stop continuous metrics
      if (this.continuousMetrics) {
        this.continuousMetrics.stopContinuousTracking();
      }
    },

    /**
     * Send event (compatible with existing API)
     * @param {string} eventName - Event name
     * @param {Object} eventData - Event data
     * @param {Object} options - Send options
     */
    sendEvent: function(eventName, eventData = {}, options = {}) {
      if (this.disabled || !this.sessionId) return;
      
      const event = {
        name: eventName,
        data: eventData,
        timestamp: Date.now(),
        session_id: this.sessionId,
        url: window.location.href
      };
      
      // Add to current view if available
      if (this.viewManager?.currentView) {
        this.viewManager.addEvent(event);
      }
      
      // For immediate events, send directly
      if (options.immediate) {
        this._sendToServer('/api/optima/events', event, { sync: true });
      }
    },

    /**
     * Identify user for current session
     * @param {Object} userIdentity - User identity data (email, name, plan, etc.)
     * @returns {Promise} - Promise that resolves when identity is sent
     */
    identify: function(userIdentity) {
      return new Promise((resolve, reject) => {
        // Validate inputs
        if (this.disabled) {
          console.warn('[ViewBasedOptima] ⚠️ SDK is disabled, identity not sent');
          reject(new Error('SDK is disabled'));
          return;
        }
        
        if (!this.sessionId) {
          console.warn('[ViewBasedOptima] ⚠️ No active session, identity not sent');
          reject(new Error('No active session'));
          return;
        }
        
        if (!userIdentity || typeof userIdentity !== 'object' || Array.isArray(userIdentity)) {
          console.error('[ViewBasedOptima] ❌ Identity must be a valid object');
          reject(new Error('Identity must be a valid object'));
          return;
        }
        
        if (Object.keys(userIdentity).length === 0) {
          console.warn('[ViewBasedOptima] ⚠️ Identity object is empty');
          reject(new Error('Identity object cannot be empty'));
          return;
        }
        
        console.log('[ViewBasedOptima] 🆔 Sending user identity for session:', this.sessionId.substring(0, 8) + '...');
        
        // Prepare identity payload
        const identityPayload = {
          session_id: this.sessionId,
          identity: userIdentity,
          timestamp: Date.now(),
          url: window.location.href
        };
        
        // Send to server immediately
        this._sendIdentityToServer(identityPayload)
          .then(() => {
            console.log('[ViewBasedOptima] ✅ User identity sent successfully');
            resolve();
          })
          .catch((error) => {
            console.error('[ViewBasedOptima] ❌ Failed to send user identity:', error);
            reject(error);
          });
      });
    },

    /**
     * Send identity data to server (internal method)
     * @param {Object} identityPayload - Identity payload to send
     * @returns {Promise} - Promise that resolves when sent
     */
    _sendIdentityToServer: function(identityPayload) {
      return new Promise((resolve, reject) => {
        if (this.disabled) {
          reject(new Error('SDK is disabled'));
          return;
        }
        
        try {
          // Use configured endpoint
          const baseUrl = this.endpoint || this.config.endpoint || 'https://api.optima.com';
          const url = `${baseUrl}/api/optima/identify`;
          
          // Add API key to payload
          identityPayload.api_key = this.apiKey;
          
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey
            },
            body: JSON.stringify(identityPayload)
          })
          .then(response => {
            if (this.config.debug) {
              console.log(`[ViewBasedOptima] 🆔 Identity API response: ${response.status} ${response.statusText}`);
            }
            
            if (response.ok) {
              resolve(response);
            } else {
              reject(new Error(`Identity API failed: ${response.status} ${response.statusText}`));
            }
          })
          .catch(error => {
            reject(error);
          });
          
        } catch (error) {
          reject(error);
        }
      });
    },

    /**
     * Manual route change trigger (for programmatic use)
     * @param {string} newUrl - New URL
     */
    triggerRouteChange: function(newUrl) {
      if (this.routeDetector) {
        this.routeDetector.triggerRouteChange(newUrl, 'manual');
      }
    },

    /**
     * Get current view data (for debugging)
     * @returns {Object} Current view data
     */
    getCurrentView: function() {
      return this.viewManager?.getCurrentViewData() || null;
    },

    /**
     * Get view history (for debugging)
     * @returns {Array} View history
     */
    getViewHistory: function() {
      return this.viewManager?.getViewHistory() || [];
    },

    /**
     * Get SDK status (for debugging)
     * @returns {Object} SDK status
     */
    getStatus: function() {
      return {
        isInitialized: this.isInitialized,
        sessionId: this.sessionId,
        version: this.version,
        disabled: this.disabled,
        currentView: this.getCurrentView(),
        viewHistory: this.getViewHistory(),
        config: this.config,
        components: {
          viewManager: !!this.viewManager,
          routeDetector: !!this.routeDetector,
          dataSender: !!this.dataSender,
          continuousMetrics: !!this.continuousMetrics,
          resourceCollector: !!this.resourceCollector,
          webVitalsCollector: !!this.webVitalsCollector
        }
      };
    },

    /**
     * Update configuration at runtime
     * @param {Object} newConfig - New configuration
     */
    updateConfig: function(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      // Apply config changes to components
      if (this.dataSender && (newConfig.batchSize || newConfig.batchTimeout)) {
        this.dataSender.updateConfig({
          maxBatchSize: newConfig.batchSize,
          batchTimeout: newConfig.batchTimeout
        });
      }
      
      if (this.continuousMetrics && newConfig.continuousMetricsInterval) {
        this.continuousMetrics.updateInterval(newConfig.continuousMetricsInterval);
      }
      
      console.log('[ViewBasedOptima] ⚙️ Configuration updated:', this.config);
    },

    /**
     * Debug resource collection (for browser console debugging)
     */
    debugResources: function() {
      console.log('[ViewBasedOptima] 🔍 RESOURCE COLLECTION DEBUG');
      console.log('=====================================');
      
      if (this.viewManager) {      
        const debugInfo = this.viewManager.getResourceCollectionDebug();
        if (debugInfo) {
          console.log('[ViewBasedOptima] 📊 Resource Collection Stats:', debugInfo);
        }
        
        const currentView = this.viewManager.getCurrentViewData();
        if (currentView) {
          console.log('[ViewBasedOptima] 📋 Current View:', {
            id: currentView.id.substring(0, 8),
            type: currentView.type,
            url: currentView.url,
            resourceCount: currentView.resources.length,
            ajaxCount: currentView.ajaxRequests.length
          });
        }
      } else {
        console.log('[ViewBasedOptima] ❌ ViewManager not available');
      }
      
      // Also log all resources currently in browser
      const allResources = performance.getEntriesByType('resource');
      const jsFiles = allResources.filter(entry => entry.name.toLowerCase().includes('.js'));
      const bundleFiles = allResources.filter(entry => entry.name.includes('bundle') || entry.name.includes('chunk'));
      
      console.log('[ViewBasedOptima] 🌐 Browser Resource Summary:', {
        total: allResources.length,
        jsFiles: jsFiles.length,
        bundleFiles: bundleFiles.length
      });
      
      if (bundleFiles.length > 0) {
        console.log('[ViewBasedOptima] 📦 Bundle Files in Browser:', 
          bundleFiles.map(entry => ({
            url: entry.name,
            startTime: entry.startTime.toFixed(2),
            initiatorType: entry.initiatorType,
            transferSize: entry.transferSize
          }))
        );
      }
    },

    /**
     * Reset performance observers (called by ViewManager during view transitions)
     * This ensures old observers are properly cleared before new view starts
     */
    _resetPerformanceObservers: function() {
      console.log('[ViewBasedOptima] 🧹 Resetting performance observers for view transition');
      
      // Clear web vitals observers
      if (this.webVitalsCollector) {
        this.webVitalsCollector.clearObservers();
      }
      
      // Clear resource collector observers
      if (this.resourceCollector && typeof this.resourceCollector.clearObservers === 'function') {
        this.resourceCollector.clearObservers();
      }
      
      console.log('[ViewBasedOptima] ✅ Performance observers cleared');
    },

    /**
     * Send data to server (internal method)
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send
     * @param {Object} options - Send options
     */
    _sendToServer: function(endpoint, data, options = {}) {
      if (this.disabled) return;
      
      // Add common fields
      data.api_key = this.apiKey;
      data.timestamp = data.timestamp || Date.now();
      data.user_agent = navigator.userAgent;
      
      try {
        // Use configured endpoint (same as old SDK)
        const baseUrl = this.endpoint || this.config.endpoint || 'https://api.optima.com';
        const url = `${baseUrl}${endpoint}`;
        
        if (options.sync && navigator.sendBeacon) {
          // Use sendBeacon for synchronous sends (with API key in URL)
          const beaconUrl = new URL(url);
          beaconUrl.searchParams.set('api_key', this.apiKey);
          
          const success = navigator.sendBeacon(beaconUrl.toString(), JSON.stringify(data));
          if (this.config.debug) {
            console.log(`[ViewBasedOptima] 🚨 BeaconAPI send ${success ? 'SUCCESS' : 'FAILED'} to ${endpoint}`);
          }
          
          if (!success) {
            // Fallback to fetch if beacon fails
            this._sendViaFetch(url, data, { ...options, sync: true });
          }
        } else {
          // Use fetch for regular sends
          this._sendViaFetch(url, data, options);
        }
        
      } catch (error) {
        if (this.config.debug) {
          console.error('[ViewBasedOptima] ❌ Send error:', error);
        }
      }
    },

    /**
     * Send data via fetch (internal helper)
     * @param {string} url - Full URL
     * @param {Object} data - Data to send
     * @param {Object} options - Send options
     */
    _sendViaFetch: function(url, data, options = {}) {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(data),
        keepalive: options.sync
      }).then(response => {
        if (this.config.debug) {
          console.log(`[ViewBasedOptima] ✅ Fetch ${response.ok ? 'SUCCESS' : 'ERROR'} to ${url}`);
        }
        return response;
      }).catch(error => {
        if (this.config.debug) {
          console.error('[ViewBasedOptima] ❌ Fetch failed:', error);
        }
      });
    },

    /**
     * Cleanup SDK (for testing or shutdown)
     */
    cleanup: function() {
      console.log('[ViewBasedOptima] 🧹 Cleaning up SDK');
      
      // Complete current view
      if (this.viewManager?.currentView && !this.viewManager.currentView.isCompleted) {
        this.viewManager.completeView('sdk_cleanup');
      }
      
      // Cleanup components
      if (this.dataSender) this.dataSender.cleanup();
      if (this.continuousMetrics) this.continuousMetrics.cleanup();
      if (this.resourceCollector) this.resourceCollector.reset();
      if (this.webVitalsCollector) this.webVitalsCollector.reset();
      if (this.routeDetector) this.routeDetector.cleanup();
      
      // Reset state
      this.isInitialized = false;
      this.sessionId = null;
    },

    /**
     * Generate comprehensive metadata (same as legacy SDK)
     * @returns {Object} Complete metadata object
     */
    generateMetadata: function() {
      // Get navigation entry for HTTP protocol information
      const navEntry = performance.getEntriesByType('navigation')[0];
      
      return {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        title: document.title,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        connection_type: navigator.connection ? navigator.connection.effectiveType : null,
        connection_downlink: navigator.connection ? navigator.connection.downlink : null,
        connection_rtt: navigator.connection ? navigator.connection.rtt : null,
        device_memory: navigator.deviceMemory,
        device_speed: navigator.hardwareConcurrency,
        device_type: this._detectDeviceType(),
        page_visibility: document.visibilityState,
        visibility_changes: this.visibilityChangeCount || 0,
        timestamp: Date.now(),
        browser: this._detectBrowser(),
        os: this._detectOS(),
        navigation_type: navEntry?.type || null,
        http_version: navEntry?.nextHopProtocol || null,
        sdk_version: this.version,
        lastUpdated: Date.now(),
        // Additional geolocation info (will be populated server-side)
        city: "Unknown",
        region: "Unknown", 
        country: "Unknown",
        countryCode: "XX",
        clientIP: null,
        isLocalIP: null
      };
    },

    /**
     * Detect browser from user agent
     * @returns {string} Browser name
     */
    _detectBrowser: function() {
      const userAgent = navigator.userAgent;
      
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        return 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        return 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return 'Safari';
      } else if (userAgent.includes('Edg')) {
        return 'Edge';
      } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        return 'Opera';
      } else {
        return 'Unknown';
      }
    },

    // Helper methods for session creation
    _detectDeviceType: function() {
      const userAgent = navigator.userAgent;
      
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'mobile';
      }
      
      if (/android/i.test(userAgent)) {
        return 'mobile';
      }
      
      if (/Tablet|iPad/i.test(userAgent)) {
        return 'tablet';
      }
      
      return 'desktop';
    },

    /**
     * Detect operating system from user agent
     * @returns {string} OS name
     */
    _detectOS: function() {
      const userAgent = navigator.userAgent;
      
      if (userAgent.includes('Windows')) {
        return 'Windows';
      } else if (userAgent.includes('Mac OS') || userAgent.includes('Macintosh')) {
        return 'Mac OS';
      } else if (userAgent.includes('Linux')) {
        return 'Linux';
      } else if (userAgent.includes('Android')) {
        return 'Android';
      } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'iOS';
      } else {
        return 'Unknown';
      }
    },
  };

  // Auto-initialize if window.OptimaConfig exists
  if (typeof window !== 'undefined' && window.OptimaConfig) {
    ViewBasedOptima.init(window.OptimaConfig);
  }

  // Handle async loader pattern (like Google Analytics)
  if (typeof window !== 'undefined') {
    // Store reference to existing queue if it exists
    const existingQueue = window.optima && window.optima.q ? [...window.optima.q] : [];
    
    // Create the optima function that handles queued calls
    window.optima = function() {
      const args = Array.prototype.slice.call(arguments);
      const command = args[0];
      
      console.log('[ViewBasedOptima] 🔧 Processing command:', command, args);
      
      if (command === 'init') {
        // Handle both old format (apiKey, config) and new format (config)
        if (typeof args[1] === 'string') {
          // Old format: optima('init', 'apiKey', {config})
          const apiKey = args[1];
          const config = args[2] || {};
          config.apiKey = apiKey;
          console.log('[ViewBasedOptima] 🔧 Initializing with old format');
          ViewBasedOptima.init(config);
        } else {
          // New format: optima('init', {config})
          console.log('[ViewBasedOptima] 🔧 Initializing with new format');
          ViewBasedOptima.init(args[1] || {});
        }
      } else if (command === 'track') {
        ViewBasedOptima.sendEvent(args[1], args[2], args[3]);
      } else if (command === 'identify') {
        return ViewBasedOptima.identify(args[1]);
      } else if (command === 'getStatus') {
        return ViewBasedOptima.getStatus();
      } else if (command === 'updateConfig') {
        ViewBasedOptima.updateConfig(args[1]);
      } else {
        console.warn('[ViewBasedOptima] Unknown command:', command);
      }
    };
    
    // Expose ViewBasedOptima globally for debugging
    window.ViewBasedOptima = ViewBasedOptima;
    
    // Process any queued calls from async loader
    if (existingQueue.length > 0) {
      console.log('[ViewBasedOptima] 🔄 Processing queued calls:', existingQueue.length);
      
      // Process each queued call
      existingQueue.forEach(args => {
        try {
          console.log('[ViewBasedOptima] 🔄 Processing queued call:', args[0]);
          window.optima.apply(window, args);
        } catch (error) {
          console.error('[ViewBasedOptima] ❌ Error processing queued call:', error, args);
        }
      });
    } else {
      console.log('[ViewBasedOptima] 📭 No queued calls to process');
    }
  }

  exports.ViewBasedOptima = ViewBasedOptima;
  exports.default = ViewBasedOptima;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
