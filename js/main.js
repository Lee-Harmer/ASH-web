/* ============================================================
   IN-TENTS LIGHTING — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── NAV SCROLL BEHAVIOUR ─────────────────────────────────── */
  const nav = document.querySelector('.nav');

  if (nav && nav.classList.contains('nav--hero')) {
    const onScroll = () => {
      if (window.scrollY > 80) {
        nav.classList.remove('nav--hero');
        nav.classList.add('nav--solid');
      } else {
        nav.classList.remove('nav--solid');
        nav.classList.add('nav--hero');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── MOBILE HAMBURGER ─────────────────────────────────────── */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on any mobile nav link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── HERO ENTRANCE ANIMATION ─────────────────────────────── */
  const hero = document.querySelector('.hero');
  if (hero) {
    // Trigger immediately in case fonts/images already loaded
    requestAnimationFrame(() => hero.classList.add('loaded'));
    window.addEventListener('load', () => hero.classList.add('loaded'));
  }

  /* ── SCROLL REVEAL ───────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  } else {
    // Fallback: reveal everything immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
  }

  /* ── LIGHTBOX ────────────────────────────────────────────── */
  const lightbox    = document.querySelector('.lightbox');
  const lbImg       = lightbox?.querySelector('.lightbox-img');
  const lbClose     = lightbox?.querySelector('.lightbox-close');
  const lbPrev      = lightbox?.querySelector('.lightbox-prev');
  const lbNext      = lightbox?.querySelector('.lightbox-next');
  const lbCounter   = lightbox?.querySelector('.lightbox-counter');

  let lbImages  = [];
  let lbCurrent = 0;

  function openLightbox(images, index) {
    lbImages  = images;
    lbCurrent = index;
    renderLbImage();
    lightbox?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderLbImage() {
    if (!lbImg || !lbImages.length) return;
    lbImg.src = lbImages[lbCurrent];
    lbImg.alt = `Event photo ${lbCurrent + 1} of ${lbImages.length}`;
    if (lbCounter) lbCounter.textContent = `${lbCurrent + 1} / ${lbImages.length}`;
  }

  function lbStep(dir) {
    lbCurrent = (lbCurrent + dir + lbImages.length) % lbImages.length;
    renderLbImage();
  }

  if (lightbox) {
    lbClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    lbPrev?.addEventListener('click', () => lbStep(-1));
    lbNext?.addEventListener('click', () => lbStep(1));

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   lbStep(-1);
      if (e.key === 'ArrowRight')  lbStep(1);
    });
  }

  // Wire masonry gallery items
  const masonryItems = document.querySelectorAll('.gallery-masonry-item');
  if (masonryItems.length && lightbox) {
    const imgs = Array.from(masonryItems).map(el => el.querySelector('img')?.src).filter(Boolean);
    masonryItems.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(imgs, i));
    });
  }

  // Wire filterable gallery items
  const gridItems = document.querySelectorAll('.gallery-grid-item');
  if (gridItems.length && lightbox) {
    function rebuildLbFromVisible() {
      const visible = Array.from(gridItems).filter(el => !el.classList.contains('hidden'));
      visible.forEach((item, i) => {
        item.onclick = () => {
          const imgs = visible.map(el => el.querySelector('img')?.src).filter(Boolean);
          openLightbox(imgs, i);
        };
      });
    }
    rebuildLbFromVisible();

    // Re-bind after filter changes
    window.addEventListener('galleryfiltered', rebuildLbFromVisible);
  }

  // Wire photo-grid items on event pages
  const photoGridItems = document.querySelectorAll('.photo-grid-item');
  if (photoGridItems.length && lightbox) {
    const imgs = Array.from(photoGridItems).map(el => el.querySelector('img')?.src).filter(Boolean);
    photoGridItems.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(imgs, i));
    });
  }

  /* ── GALLERY FILTERS ─────────────────────────────────────── */
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const galleryGrid = document.querySelector('.gallery-grid');

  if (filterBtns.length && galleryGrid) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        galleryGrid.querySelectorAll('.gallery-grid-item').forEach(item => {
          const match = filter === 'all' || item.dataset.category === filter;
          item.classList.toggle('hidden', !match);
        });

        // Notify lightbox to rebuild
        window.dispatchEvent(new Event('galleryfiltered'));
      });
    });
  }

  /* ── HORIZONTAL SCROLL DRAG ──────────────────────────────── */
  document.querySelectorAll('.gallery-strip').forEach(strip => {
    let isDragging = false;
    let startX, startScrollLeft;

    strip.addEventListener('mousedown', e => {
      isDragging    = true;
      startX        = e.pageX - strip.offsetLeft;
      startScrollLeft = strip.scrollLeft;
      strip.classList.add('grabbing');
    });

    const stopDrag = () => {
      isDragging = false;
      strip.classList.remove('grabbing');
    };

    strip.addEventListener('mouseleave', stopDrag);
    strip.addEventListener('mouseup',    stopDrag);

    strip.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const x    = e.pageX - strip.offsetLeft;
      const walk = (x - startX) * 1.6;
      strip.scrollLeft = startScrollLeft - walk;
    });
  });

  /* ── SMOOTH ACTIVE NAV LINK ──────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-dropdown-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.style.color = 'var(--c-gold)';
    }
  });

})();
