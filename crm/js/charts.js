/* Hand-rolled SVG charts — no chart library, works fully offline. */
const Charts = (() => {
  function donut(el, segments, opts) {
    opts = opts || {};
    const size = opts.size || 160;
    const stroke = opts.stroke || 20;
    const r = (size - stroke) / 2;
    const cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

    let offset = 0;
    const arcs = segments.map(seg => {
      const frac = seg.value / total;
      const len = frac * circumference;
      const dasharray = `${len} ${circumference - len}`;
      const dashoffset = -offset;
      offset += len;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}"
        stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"></circle>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${stroke}"></circle>
      ${arcs}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-total">${total}</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-label">${opts.centerLabel || 'tổng'}</text>
    </svg>`;
  }

  function bars(el, points, opts) {
    opts = opts || {};
    const w = opts.width || 480, h = opts.height || 180;
    const padL = 8, padR = 8, padB = 24, padT = 12;
    const innerW = w - padL - padR, innerH = h - padT - padB;
    const max = Math.max(1, ...points.map(p => p.value));
    const bw = innerW / points.length;

    const rects = points.map((p, i) => {
      const barH = (p.value / max) * innerH;
      const x = padL + i * bw + bw * 0.18;
      const y = padT + (innerH - barH);
      const bwReal = bw * 0.64;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bwReal.toFixed(1)}" height="${barH.toFixed(1)}" rx="4" fill="url(#barGrad)"></rect>
        <text x="${(x + bwReal / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle" class="bar-label">${p.label}</text>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9fb4ff"></stop>
          <stop offset="100%" stop-color="#5c6bff"></stop>
        </linearGradient>
      </defs>
      ${rects}
    </svg>`;
  }

  function hbars(el, items, opts) {
    opts = opts || {};
    const max = Math.max(1, ...items.map(i => i.value));
    el.innerHTML = items.map(item => {
      const pct = Math.round((item.value / max) * 100);
      return `<div class="hbar-row">
        <div class="hbar-label">${item.label}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${item.color || 'var(--accent)'}"></div></div>
        <div class="hbar-value">${item.value}</div>
      </div>`;
    }).join('');
  }

  return { donut, bars, hbars };
})();
