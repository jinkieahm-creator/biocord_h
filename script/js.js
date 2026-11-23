/* =====================================================
   BioCord  js.js  (v2)
   1. 헤더 : 스크롤 시 숨김/표시 + 모바일 메뉴
   2. Swiper : 스토리 / 최신소식 슬라이더 (반응형 breakpoints)
   3. 오늘의 미션 : 포인트 적립 인터랙션
   4. GSAP + ScrollTrigger : 등장·패럴랙스·카운트업 애니메이션
   ※ GSAP / Swiper 가 로드되지 않아도 페이지가 깨지지 않도록 처리
   ===================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const root = document.documentElement;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnimate = hasGsap && !reduceMotion;

  // 애니메이션을 못 쓰는 환경이면 히어로 초기 숨김 상태 해제
  if (!canAnimate) root.classList.remove('js');

  /* -----------------------------------------------------
     1. HEADER
  ----------------------------------------------------- */
  const header = $('.header');
  const bar = $('.header_bar');
  const toggle = $('.menu_toggle');
  const menu = $('#siteMenu');
  const mqDesktop = window.matchMedia('(min-width: 1025px)');

  function setMenu(open) {
    header.classList.toggle('menu_open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.classList.toggle('no_scroll', open);
    bar.classList.remove('is_hidden');

    if (open && canAnimate) {
      gsap.fromTo(
        $$('li', menu),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' }
      );
    }
  }

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu_open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('menu_open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  // PC 폭으로 바뀌면 메뉴 상태 초기화
  const onDesktopChange = (e) => { if (e.matches) setMenu(false); };
  mqDesktop.addEventListener ? mqDesktop.addEventListener('change', onDesktopChange) : mqDesktop.addListener(onDesktopChange);

  // 스크롤 : 아래로 내리면 헤더 숨김, 올리면 표시
  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    bar.classList.toggle('is_scrolled', y > 8);

    if (!header.classList.contains('menu_open') && !bar.matches(':focus-within')) {
      if (y > lastY + 4 && y > 160) bar.classList.add('is_hidden');
      else if (y < lastY - 4 || y <= 160) bar.classList.remove('is_hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* -----------------------------------------------------
     2. SWIPER  (스토리 / 최신소식)
  ----------------------------------------------------- */
  if (typeof window.Swiper !== 'undefined') {
    root.classList.add('swiper_ready');

    new Swiper('.story_slider', {
      slidesPerView: 1.2,
      spaceBetween: 14,
      speed: 500,
      grabCursor: true,
      navigation: { prevEl: '.story_prev', nextEl: '.story_next' },
      breakpoints: {
        600: { slidesPerView: 2.2, spaceBetween: 16 },
        900: { slidesPerView: 3.1, spaceBetween: 18 },
        1025: { slidesPerView: 4, spaceBetween: 20, allowTouchMove: false, grabCursor: false },
      },
    });

    new Swiper('.news_slider', {
      slidesPerView: 1.4,
      spaceBetween: 14,
      speed: 500,
      grabCursor: true,
      breakpoints: {
        600: { slidesPerView: 2.4, spaceBetween: 16 },
        900: { slidesPerView: 3.2, spaceBetween: 18 },
        1025: { slidesPerView: 4, spaceBetween: 20, allowTouchMove: false, grabCursor: false },
      },
    });
  }

  /* -----------------------------------------------------
     3. 오늘의 미션
  ----------------------------------------------------- */
  const bonusBar = $('#missionBar');
  const bonusScore = $('#missionScore');
  const bonusMsg = $('#missionMsg');
  const MAX_POINT = 100;
  let score = parseInt(bonusScore.textContent, 10) || 0;

  function renderScore(value, animate) {
    if (animate && canAnimate) {
      gsap.killTweensOf(bonusBar);
      const counter = { v: parseInt(bonusScore.textContent, 10) || 0 };
      gsap.to(bonusBar, { width: value + '%', duration: 0.8, ease: 'power2.out' });
      gsap.to(counter, {
        v: value,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => { bonusScore.textContent = Math.round(counter.v); },
      });
    } else {
      bonusBar.style.width = value + '%';
      bonusScore.textContent = value;
    }
  }

  function flyPoint(btn, point) {
    if (!canAnimate) return;
    const tag = document.createElement('span');
    tag.className = 'point_fly';
    tag.textContent = '+' + point + 'P';
    btn.appendChild(tag);
    gsap.fromTo(tag, { y: 0, opacity: 1 }, {
      y: -34, opacity: 0, duration: 0.9, ease: 'power2.out',
      onComplete: () => tag.remove(),
    });
  }

  $$('.mission_item').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is_done') || score >= MAX_POINT) return;

      const point = parseInt(btn.dataset.point, 10) || 0;
      btn.classList.add('is_done');
      btn.setAttribute('aria-pressed', 'true');
      $('small', btn).textContent = '완료 ✓';
      flyPoint(btn, point);

      score = Math.min(MAX_POINT, score + point);
      renderScore(score, true);

      if (score >= MAX_POINT) {
        bonusMsg.textContent = '🎉 100포인트 달성! 아이들에게 급식 1끼가 전달돼요.';
        if (canAnimate) {
          gsap.fromTo('.mission_reward img',
            { rotation: -10, scale: 1 },
            { rotation: 0, scale: 1.12, duration: 0.6, ease: 'elastic.out(1, 0.35)', yoyo: true, repeat: 1 }
          );
        }
      } else {
        bonusMsg.textContent = '+' + point + 'P 적립! 앞으로 ' + (MAX_POINT - score) + 'P 남았어요.';
      }
    });
  });

  /* -----------------------------------------------------
     4. GSAP / ScrollTrigger
  ----------------------------------------------------- */
  // 숫자 카운트업 (HTML 에는 최종값이 들어 있어서 JS 없이도 정상 표시)
  function countUp(el, startNow) {
    const end = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = (v) => prefix + Math.round(v).toLocaleString('ko-KR') + suffix;
    const obj = { v: 0 };
    el.textContent = fmt(0);

    const vars = {
      v: end,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = fmt(obj.v); },
      onComplete: () => { el.textContent = fmt(end); },
    };
    if (hasST && !startNow) {
      vars.scrollTrigger = { trigger: el, start: 'top 92%', once: true };
    }
    gsap.to(obj, vars);
  }

  if (canAnimate) {
    if (hasST) gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1025px)', () => {
      // PC 에서만 메뉴 항목 순차 등장 (모바일에서는 패널 안에 숨어 있음)
      gsap.from('.top_menu li', { y: -16, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity' });
    });

    // ----- 헤더 / 히어로 인트로 -----
    gsap.from('.top_logo, .header_actions', {
      y: -16, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity',
    });

    gsap.from('.hero_bg', { scale: 1.15, duration: 1.8, ease: 'power2.out' });

    // data-anim 요소는 CSS 에서 opacity:0 으로 시작 → 위로 떠오르며 등장
    // (clearProps 를 쓰지 않는 이유 : 지우면 CSS 의 opacity:0 으로 되돌아감)
    gsap.fromTo('[data-anim]',
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.25 }
    );

    // 오늘의 후원금 카운트업 (히어로에 바로 보이므로 즉시)
    $$('.today_fund [data-count]').forEach((el) => countUp(el, true));

    if (hasST) {
      // ----- 히어로 패럴랙스 -----
      gsap.to('.hero_bg', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });

      // ----- 투명공개 카드 -----
      gsap.set('.summary_card', { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: '.fund_summary',
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.to('.summary_card', {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity',
        }),
      });
      $$('.summary_card [data-count]').forEach((el) => countUp(el, false));

      // ----- 섹션 제목 -----
      $$('.section_heading, .story_heading').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 28, duration: 0.8, ease: 'power2.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // ----- 카드 묶음 : 한 줄씩 순차 등장 -----
      const batchReveal = (selector) => {
        const items = $$(selector);
        if (!items.length) return;
        gsap.set(items, { opacity: 0, y: 36 });
        ScrollTrigger.batch(items, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => gsap.to(batch, {
            opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out',
            overwrite: true, clearProps: 'transform,opacity',
          }),
        });
      };
      batchReveal('.support_card');
      batchReveal('.story_step');
      batchReveal('.mission_item');
      batchReveal('.news_card');

      // ----- 스토리 배경 패럴랙스 -----
      gsap.fromTo('.story_bg', { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: '.story_section', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      // ----- 미션 진행바 : 화면에 들어오면 차오름 -----
      const targetPercent = parseFloat(bonusBar.style.width) || 0;
      const targetScore = score;
      gsap.set(bonusBar, { width: 0 });
      bonusScore.textContent = '0';
      const barCounter = { v: 0 };
      const missionTl = gsap.timeline({
        paused: true,
        onComplete: () => { bonusBar.style.width = targetPercent + '%'; bonusScore.textContent = targetScore; },
      });
      missionTl.to(bonusBar, { width: targetPercent + '%', duration: 1.2, ease: 'power2.out' }, 0);
      missionTl.to(barCounter, {
        v: targetScore, duration: 1.2, ease: 'power2.out',
        onUpdate: () => { bonusScore.textContent = Math.round(barCounter.v); },
      }, 0);
      ScrollTrigger.create({
        trigger: '.mission_progress',
        start: 'top 90%',
        once: true,
        onEnter: () => missionTl.play(),
      });

      // ----- 푸터 -----
      gsap.from('.footer_inner > *', {
        opacity: 0, y: 24, duration: 0.7, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true },
      });

      // 이미지/폰트 로딩 후 위치 재계산
      window.addEventListener('load', () => ScrollTrigger.refresh());
    } else {
      // ScrollTrigger 가 없으면 숫자만 즉시 카운트업
      $$('.summary_card [data-count]').forEach((el) => countUp(el, true));
    }

    // 선물상자 : 은은하게 떠다니는 모션
    gsap.to('.mission_reward img', { y: -6, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
})();
