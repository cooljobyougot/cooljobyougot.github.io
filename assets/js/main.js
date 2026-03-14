(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  var THEME_KEY = "lc_theme";
  var CONSENT_KEY = "lc_cookie_consent";

  var themeToggle = doc.getElementById("themeToggle");
  var navToggle = doc.getElementById("navToggle");
  var navClose = doc.getElementById("navClose");
  var mobileNav = doc.getElementById("mobileNav");

  var cookieBanner = doc.getElementById("cookieBanner");
  var cookieAccept = doc.getElementById("cookieAccept");
  var cookieReject = doc.getElementById("cookieReject");
  var cookieSettings = doc.getElementById("cookieSettings");

  var yearNode = doc.getElementById("y");
  var showreelTriggers = doc.querySelectorAll("[data-showreel-trigger]");
  var showreelFrames = doc.querySelectorAll("[data-showreel-frame]");

  var focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  }

  function prefersDarkMode() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch (e) {
      return true;
    }
  }

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  function getCurrentTheme() {
    return root.getAttribute("data-theme") || "dark";
  }

  function applyTheme(theme) {
    var next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    safeSet(THEME_KEY, next);
  }

  function initializeTheme() {
    var stored = safeGet(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      applyTheme(stored);
      return;
    }
    applyTheme(prefersDarkMode() ? "dark" : "light");
  }

  function syncThemeWithSystem(event) {
    var stored = safeGet(THEME_KEY);
    if (stored === "light" || stored === "dark") return;
    applyTheme(event.matches ? "dark" : "light");
  }

  function setupThemeToggle() {
    if (!themeToggle) return;

    themeToggle.addEventListener("click", function () {
      var current = getCurrentTheme();
      applyTheme(current === "dark" ? "light" : "dark");
    });

    try {
      if (window.matchMedia) {
        var query = window.matchMedia("(prefers-color-scheme: dark)");
        if (typeof query.addEventListener === "function") {
          query.addEventListener("change", syncThemeWithSystem);
        } else if (typeof query.addListener === "function") {
          query.addListener(syncThemeWithSystem);
        }
      }
    } catch (e) {}
  }

  function getHashTarget(hash) {
    if (!hash || hash.charAt(0) !== "#") return null;
    try {
      return doc.querySelector(hash);
    } catch (e) {
      return null;
    }
  }

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");

    var firstFocusable = mobileNav.querySelector(focusableSelector);
    if (firstFocusable) {
      window.requestAnimationFrame(function () {
        firstFocusable.focus();
      });
    }
  }

  function toggleMobileNav(forceOpen) {
    if (!mobileNav) return;
    var shouldOpen = typeof forceOpen === "boolean"
      ? forceOpen
      : !mobileNav.classList.contains("open");

    if (shouldOpen) {
      openMobileNav();
    } else {
      closeMobileNav();
      if (navToggle) navToggle.focus();
    }
  }

  function trapFocusInMobileNav(event) {
    if (!mobileNav || !mobileNav.classList.contains("open")) return;
    if (event.key !== "Tab") return;

    var focusable = mobileNav.querySelectorAll(focusableSelector);
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupMobileNav() {
    if (navToggle) {
      navToggle.addEventListener("click", function () {
        toggleMobileNav();
      });
    }

    if (navClose) {
      navClose.addEventListener("click", function () {
        toggleMobileNav(false);
      });
    }

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileNav && mobileNav.classList.contains("open")) {
        toggleMobileNav(false);
      }
      trapFocusInMobileNav(event);
    });

    if (mobileNav) {
      mobileNav.addEventListener("click", function (event) {
        if (event.target === mobileNav) {
          toggleMobileNav(false);
        }
      });
    }
  }

  function smoothScrollToTarget(target, hash, updateHistory) {
    if (!target) return;

    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });

    if (updateHistory && hash) {
      try {
        window.history.pushState(null, "", hash);
      } catch (e) {
        window.location.hash = hash;
      }
    }
  }

  function setupScrollLinks() {
    doc.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-scroll]");
      if (!link) return;

      var href = link.getAttribute("href") || "";
      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      var hash = href.slice(hashIndex);
      var target = getHashTarget(hash);
      if (!target) return;

      event.preventDefault();
      closeMobileNav();
      smoothScrollToTarget(target, hash, true);
    });

    if (window.location.hash) {
      window.addEventListener("load", function () {
        var initialTarget = getHashTarget(window.location.hash);
        if (!initialTarget) return;
        setTimeout(function () {
          smoothScrollToTarget(initialTarget, null, false);
        }, 40);
      });
    }
  }

  function getConsent() {
    return safeGet(CONSENT_KEY);
  }

  function setConsent(value) {
    safeSet(CONSENT_KEY, value);
  }

  function showCookieBanner() {
    if (cookieBanner) cookieBanner.style.display = "block";
  }

  function hideCookieBanner() {
    if (cookieBanner) cookieBanner.style.display = "none";
  }

  function setupCookieConsent() {
    if (!cookieBanner) return;

    if (!getConsent()) {
      showCookieBanner();
    } else {
      hideCookieBanner();
    }

    if (cookieAccept) {
      cookieAccept.addEventListener("click", function () {
        setConsent("accepted");
        hideCookieBanner();
      });
    }

    if (cookieReject) {
      cookieReject.addEventListener("click", function () {
        setConsent("rejected");
        hideCookieBanner();
      });
    }

    if (cookieSettings) {
      cookieSettings.addEventListener("click", function (event) {
        event.preventDefault();
        showCookieBanner();
      });
    }
  }

  function setupYear() {
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  }

  function toArray(nodes) {
    return Array.prototype.slice.call(nodes || []);
  }

  function getRevealGroup(node) {
    return node.closest(".product-grid, .reveal-grid, .statement-block, .contact-grid, [data-reveal-group]");
  }

  function getRevealDelay(node) {
    var group = getRevealGroup(node);
    if (!group) return 0;

    var grouped = toArray(group.querySelectorAll(".reveal, .lift"));
    var index = grouped.indexOf(node);
    if (index === -1) return 0;

    var baseStep = parseFloat(group.getAttribute("data-reveal-step") || "70");
    var maxDelay = parseFloat(group.getAttribute("data-reveal-max") || "280");
    return Math.min(index * baseStep, maxDelay);
  }

  function setupRevealObserver() {
    var revealNodes = toArray(doc.querySelectorAll(".reveal, .lift"));

    if (!revealNodes.length) return;

    revealNodes.forEach(function (node) {
      var delay = getRevealDelay(node);
      if (delay > 0) {
        node.style.transitionDelay = delay + "ms";
      }
    });

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      revealNodes.forEach(function (node) {
        node.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, io) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.14
      }
    );

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function getShowreelVideoPath() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/products/") !== -1) return "../assets/video/hero-showreel.mp4";
    return "./assets/video/hero-showreel.mp4";
  }

  function createShowreelVideo(mediaBox, trigger) {
    if (!mediaBox) return null;

    var existingVideo = mediaBox.querySelector("video");
    if (existingVideo) return existingVideo;

    var poster = mediaBox.querySelector("img");
    var video = doc.createElement("video");

    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("preload", "auto");
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.poster = poster ? poster.getAttribute("src") || "" : "";
    video.src = getShowreelVideoPath();
    video.setAttribute("aria-label", "Showreel агентства");

    video.addEventListener("loadeddata", function () {
      if (poster) poster.style.display = "none";
    });

    video.addEventListener("error", function () {
      if (poster) poster.style.display = "";
    });

    mediaBox.insertBefore(video, mediaBox.firstChild);

    if (trigger) {
      trigger.setAttribute("aria-pressed", "true");
    }

    return video;
  }

  function tryPlay(video) {
    if (!video) return;

    var playPromise;
    try {
      playPromise = video.play();
    } catch (e) {
      return;
    }

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // muted autoplay should usually work; if browser blocks, user can click play button
      });
    }
  }

  function setupShowreel() {
    if (!showreelTriggers.length) return;

    showreelTriggers.forEach(function (trigger) {
      var media = trigger.closest(".showreel-stage__media, .showreel-media");
      var video = createShowreelVideo(media, trigger);

      if (video) {
        tryPlay(video);
      }

      trigger.addEventListener("click", function () {
        var localMedia = trigger.closest(".showreel-stage__media, .showreel-media");
        var localVideo = createShowreelVideo(localMedia, trigger);
        if (!localVideo) return;

        localVideo.controls = true;
        localVideo.muted = false;
        tryPlay(localVideo);
      });
    });
  }

  function setupShowreelStageZoom() {
    if (!showreelFrames.length) return;
    if (prefersReducedMotion()) return;

    function updateFrame(frame) {
      var section = frame.closest(".showreel-stage");
      if (!section) return;

      var rect = section.getBoundingClientRect();
      var viewportH = window.innerHeight || doc.documentElement.clientHeight;
      var scrollable = Math.max(section.offsetHeight - viewportH, 1);
      var passed = Math.min(Math.max(-rect.top, 0), scrollable);
      var progress = passed / scrollable;

      var startScale = 1;
      var endScale = 2.9;
      var scale = startScale + (endScale - startScale) * progress;

      var startRadius = 28;
      var endRadius = 0;
      var radius = Math.max(endRadius, startRadius - (startRadius * progress));

      frame.style.transform = "scale(" + scale.toFixed(4) + ")";
      frame.style.borderRadius = radius.toFixed(2) + "px";
    }

    function onScroll() {
      showreelFrames.forEach(updateFrame);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
  }

  function setupPointerFx() {
    if (prefersReducedMotion()) return;

    var targets = toArray(doc.querySelectorAll("[data-pointer-fx]"));
    if (!targets.length) return;

    targets.forEach(function (target) {
      var glow = doc.createElement("span");
      glow.setAttribute("aria-hidden", "true");
      glow.className = "pointer-fx-glow";
      glow.style.position = "absolute";
      glow.style.left = "0";
      glow.style.top = "0";
      glow.style.width = "220px";
      glow.style.height = "220px";
      glow.style.pointerEvents = "none";
      glow.style.borderRadius = "999px";
      glow.style.opacity = "0";
      glow.style.transform = "translate3d(-50%, -50%, 0) scale(.86)";
      glow.style.transition = "opacity 220ms ease, transform 260ms ease";
      glow.style.mixBlendMode = target.getAttribute("data-pointer-blend") || "screen";
      glow.style.filter = "blur(26px) saturate(120%)";
      glow.style.background = target.getAttribute("data-pointer-gradient") || "radial-gradient(circle at center, rgba(112,140,255,.32) 0%, rgba(255,126,80,.22) 36%, rgba(255,255,255,0) 72%)";
      glow.style.zIndex = "2";

      var targetStyle = window.getComputedStyle(target);
      if (targetStyle.position === "static") {
        target.style.position = "relative";
      }
      if (targetStyle.overflow === "visible") {
        target.style.overflow = "hidden";
      }
      if (!target.querySelector(":scope > .pointer-fx-glow")) {
        target.appendChild(glow);
      }

      var media = null;
      var mediaSelector = target.getAttribute("data-pointer-media");
      if (mediaSelector) {
        media = target.querySelector(mediaSelector);
      }
      if (!media) {
        media = target.querySelector("img, video, picture img");
      }

      var rafId = 0;
      var lastX = 0;
      var lastY = 0;
      var hovering = false;

      function paint() {
        rafId = 0;
        glow.style.left = lastX + "px";
        glow.style.top = lastY + "px";
        if (hovering) {
          glow.style.opacity = target.getAttribute("data-pointer-opacity") || ".92";
          glow.style.transform = "translate3d(-50%, -50%, 0) scale(1)";
        }

        if (media) {
          var rect = target.getBoundingClientRect();
          var nx = rect.width ? (lastX / rect.width) : 0.5;
          var ny = rect.height ? (lastY / rect.height) : 0.5;
          var rx = ((ny - 0.5) * -4).toFixed(2);
          var ry = ((nx - 0.5) * 5).toFixed(2);
          var hue = (((nx - 0.5) * 12) + ((0.5 - ny) * 8)).toFixed(2);
          media.style.transform = "scale(1.02) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
          media.style.filter = "saturate(1.05) hue-rotate(" + hue + "deg)";
          media.style.willChange = "transform, filter";
          media.style.transformOrigin = "center center";
          media.style.transition = "transform 180ms ease, filter 180ms ease";
        }
      }

      function requestPaint() {
        if (rafId) return;
        rafId = window.requestAnimationFrame(paint);
      }

      target.addEventListener("pointerenter", function (event) {
        hovering = true;
        var rect = target.getBoundingClientRect();
        lastX = event.clientX - rect.left;
        lastY = event.clientY - rect.top;
        requestPaint();
      }, { passive: true });

      target.addEventListener("pointermove", function (event) {
        var rect = target.getBoundingClientRect();
        lastX = event.clientX - rect.left;
        lastY = event.clientY - rect.top;
        requestPaint();
      }, { passive: true });

      target.addEventListener("pointerleave", function () {
        hovering = false;
        glow.style.opacity = "0";
        glow.style.transform = "translate3d(-50%, -50%, 0) scale(.86)";
        if (media) {
          media.style.transform = "";
          media.style.filter = "";
          media.style.willChange = "";
        }
      }, { passive: true });
    });
  }

  function setupAutoCloseOnResize() {
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 960) {
        closeMobileNav();
      }
    });
  }

  function setup() {
    initializeTheme();
    setupThemeToggle();
    setupMobileNav();
    setupScrollLinks();
    setupCookieConsent();
    setupYear();
    setupRevealObserver();
    setupShowreel();
    setupShowreelStageZoom();
    setupPointerFx();
    setupAutoCloseOnResize();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
