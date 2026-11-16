/* 별오름 출석체크 공통 기능: 서버 연결, QR 그리기, 저장, 배경 별 */
(function () {
  const CFG = window.BYEOLOREUM || {};

  /** Apps Script 서버 함수 호출 */
  function api(fn, ...args) {
    if (!CFG.API_URL || CFG.API_URL.indexOf('여기에') !== -1) {
      return Promise.reject(new Error('config.js에 서버 주소가 아직 설정되지 않았어요.'));
    }
    return fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 이 형식이어야 구글 서버가 바로 받아줌
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: 'follow'
    })
      .then((r) => {
        if (!r.ok) throw new Error('서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return r.json();
      }, () => { throw new Error('인터넷 연결을 확인하고 다시 시도해 주세요.'); })
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || '알 수 없는 오류가 났어요.');
        return d.result;
      });
  }

  /** QR 이미지를 폰에서 바로 그린다 (외부 사이트에 요청하지 않음) */
  function qrDataUrl(text) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createDataURL(10, 2);
  }

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function clean(e) {
    return String(e && e.message ? e.message : e).replace(/^(Error|Exception):\s*/i, '');
  }

  /** 한국 날짜 'yyyy-MM-dd' */
  function todayKST() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  }

  /** 폰 이름표 (같은 폰 여러 명 체크인 확인용, 개인정보 없음) */
  function deviceId() {
    let d = store.get('byeoloreum_device');
    if (!d) {
      d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      store.set('byeoloreum_device', d);
    }
    return d;
  }

  function makeSky(el, count, topMin, sparks) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      s.className = 'dot';
      const size = Math.random() < 0.12 ? 3 : (Math.random() < 0.5 ? 2 : 1);
      s.style.width = s.style.height = size + 'px';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (topMin + Math.random() * (100 - topMin)) + '%';
      s.style.setProperty('--d', (2 + Math.random() * 4).toFixed(1) + 's');
      s.style.setProperty('--t', (-Math.random() * 5).toFixed(1) + 's');
      if (Math.random() < 0.1) s.style.background = '#FFD98C';
      el.appendChild(s);
    }
    (sparks || []).forEach(([x, y], k) => {
      const d = document.createElement('div');
      d.className = 'spark';
      d.style.left = x + '%'; d.style.top = y + '%';
      d.style.setProperty('--d', (3 + k * 0.6).toFixed(1) + 's');
      d.style.setProperty('--t', (-k * 0.8).toFixed(1) + 's');
      d.innerHTML = '<svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8Z" fill="#FFD98C"/></svg>';
      el.appendChild(d);
    });
  }

  function loadLogo(box) {
    api('apiConfig').then((cfg) => {
      if (cfg && cfg.logo) {
        const img = new Image();
        img.alt = '별오름 로고';
        img.onload = () => { box.appendChild(img); box.classList.remove('hidden'); };
        img.src = cfg.logo;
      }
    }).catch(() => {});
  }

  window.App = { api, qrDataUrl, store, esc, clean, todayKST, deviceId, makeSky, loadLogo };
})();
