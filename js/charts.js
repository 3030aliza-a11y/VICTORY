// VICTORY - vẽ biểu đồ bằng SVG thuần, không phụ thuộc thư viện ngoài
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  // Biểu đồ đường (net worth theo thời gian)
  function lineChart(container, points, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const w = container.clientWidth || 500, h = opts.height || 180;
    const pad = 30;
    const svg = el('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    if (!points.length) {
      const t = el('text', { x: w / 2, y: h / 2, 'text-anchor': 'middle', class: 'chart-empty' });
      t.textContent = 'Chưa có dữ liệu';
      svg.appendChild(t);
      container.appendChild(svg);
      return;
    }
    const values = points.map(p => p.value);
    const min = Math.min(0, ...values);
    const max = Math.max(...values, 1);
    const xStep = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
    const yScale = v => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${yScale(p.value)}`).join(' ');
    svg.appendChild(el('path', { d: path, fill: 'none', stroke: opts.color || '#16a34a', 'stroke-width': 2.5 }));

    const areaPath = path + ` L ${pad + (points.length - 1) * xStep} ${h - pad} L ${pad} ${h - pad} Z`;
    svg.appendChild(el('path', { d: areaPath, fill: opts.color || '#16a34a', opacity: 0.08 }));

    points.forEach((p, i) => {
      svg.appendChild(el('circle', { cx: pad + i * xStep, cy: yScale(p.value), r: 3, fill: opts.color || '#16a34a' }));
    });
    container.appendChild(svg);
  }

  // Biểu đồ tròn / donut (phân bổ tài sản)
  function donutChart(container, segments, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const size = opts.size || 200;
    const cx = size / 2, cy = size / 2, r = size / 2 - 10, thickness = opts.thickness || 26;
    const total = segments.reduce((s, x) => s + x.value, 0);
    const svg = el('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` });
    if (total <= 0) {
      svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#e5e7eb', 'stroke-width': thickness }));
      container.appendChild(svg);
      return;
    }
    let start = -90;
    segments.forEach(seg => {
      if (seg.value <= 0) return;
      const angle = (seg.value / total) * 360;
      const end = start + angle;
      const large = angle > 180 ? 1 : 0;
      const x1 = cx + r * Math.cos(Math.PI * start / 180);
      const y1 = cy + r * Math.sin(Math.PI * start / 180);
      const x2 = cx + r * Math.cos(Math.PI * end / 180);
      const y2 = cy + r * Math.sin(Math.PI * end / 180);
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
      svg.appendChild(el('path', { d, fill: 'none', stroke: seg.color, 'stroke-width': thickness }));
      start = end;
    });
    container.appendChild(svg);
  }

  // Biểu đồ cột (ngân sách vs thực tế)
  function barChart(container, bars, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const w = container.clientWidth || 500, h = opts.height || 160;
    const pad = 24;
    const svg = el('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    if (!bars.length) { container.appendChild(svg); return; }
    const max = Math.max(...bars.map(b => Math.max(b.value, b.limit || 0)), 1);
    const bw = (w - pad * 2) / bars.length;
    bars.forEach((b, i) => {
      const x = pad + i * bw + bw * 0.2;
      const barW = bw * 0.6;
      const barH = (b.value / max) * (h - pad * 2);
      const over = b.limit && b.value > b.limit;
      svg.appendChild(el('rect', {
        x, y: h - pad - barH, width: barW, height: barH,
        fill: over ? '#dc2626' : (opts.color || '#16a34a'), rx: 4
      }));
      if (b.limit) {
        const limitY = h - pad - (b.limit / max) * (h - pad * 2);
        svg.appendChild(el('line', { x1: x - 4, x2: x + barW + 4, y1: limitY, y2: limitY, stroke: '#111827', 'stroke-dasharray': '4,3', 'stroke-width': 1.5 }));
      }
      const label = el('text', { x: x + barW / 2, y: h - pad + 14, 'text-anchor': 'middle', class: 'chart-label' });
      label.textContent = b.label;
      svg.appendChild(label);
    });
    container.appendChild(svg);
  }

  // Biểu đồ radar (VICTORY Score 7 trục)
  function radarChart(container, metrics, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const size = opts.size || 260;
    const cx = size / 2, cy = size / 2, r = size / 2 - 40;
    const n = metrics.length;
    const svg = el('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` });

    [0.25, 0.5, 0.75, 1].forEach(f => {
      const pts = metrics.map((_, i) => {
        const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${cx + r * f * Math.cos(ang)},${cy + r * f * Math.sin(ang)}`;
      }).join(' ');
      svg.appendChild(el('polygon', { points: pts, fill: 'none', stroke: '#e5e7eb', 'stroke-width': 1 }));
    });

    metrics.forEach((m, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x2 = cx + r * Math.cos(ang), y2 = cy + r * Math.sin(ang);
      svg.appendChild(el('line', { x1: cx, y1: cy, x2, y2, stroke: '#e5e7eb', 'stroke-width': 1 }));
      const lx = cx + (r + 22) * Math.cos(ang), ly = cy + (r + 22) * Math.sin(ang);
      const label = el('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'chart-label-sm' });
      label.textContent = m.label;
      svg.appendChild(label);
    });

    const dataPts = metrics.map((m, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      const f = clamp01(m.value / 100);
      return `${cx + r * f * Math.cos(ang)},${cy + r * f * Math.sin(ang)}`;
    }).join(' ');
    svg.appendChild(el('polygon', { points: dataPts, fill: '#16a34a', opacity: 0.25, stroke: '#16a34a', 'stroke-width': 2 }));

    container.appendChild(svg);
  }

  function clamp01(n) { return Math.max(0, Math.min(1, n)); }

  // Vòng tròn tiến độ (VD: % tự do tài chính), số lớn ở giữa
  function gaugeCircle(container, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const size = opts.size || 150;
    const thickness = opts.thickness || 12;
    const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2 - 2;
    const pct = clamp01((opts.percent || 0) / 100);
    const circumference = 2 * Math.PI * r;
    const svg = el('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` });

    svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: opts.trackColor || 'rgba(255,255,255,0.25)', 'stroke-width': thickness }));
    const arc = el('circle', {
      cx, cy, r, fill: 'none', stroke: opts.fillColor || '#f5c451', 'stroke-width': thickness,
      'stroke-linecap': 'round', 'stroke-dasharray': `${circumference * pct} ${circumference}`,
      transform: `rotate(-90 ${cx} ${cy})`
    });
    svg.appendChild(arc);

    if (opts.centerLabel) {
      const t = el('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: opts.centerClass || 'gauge-center-label' });
      t.textContent = opts.centerLabel;
      svg.appendChild(t);
    }
    container.appendChild(svg);
  }

  // Gauge hình cung nửa vòng (speedometer), 0-100, dùng cho điểm số
  function gaugeArc(container, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const size = opts.size || 200;
    const thickness = opts.thickness || 16;
    const cx = size / 2, cy = size / 2 + 4, r = size / 2 - thickness / 2 - 4;
    const pct = clamp01((opts.value || 0) / (opts.max || 100));
    const svg = el('svg', { width: size, height: size / 2 + thickness, viewBox: `0 0 ${size} ${size / 2 + thickness}` });

    const startAngle = 180, endAngle = 0;
    function pointAt(angleDeg, radius) {
      const a = Math.PI * angleDeg / 180;
      return [cx + radius * Math.cos(a), cy - radius * Math.sin(a)];
    }
    const [x1, y1] = pointAt(startAngle, r);
    const [x2, y2] = pointAt(endAngle, r);
    svg.appendChild(el('path', { d: `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`, fill: 'none', stroke: '#eef2ee', 'stroke-width': thickness, 'stroke-linecap': 'round' }));

    const valueAngle = startAngle - pct * 180;
    const [vx, vy] = pointAt(valueAngle, r);
    const largeArc = pct > 0.5 ? 1 : 0;
    const gradId = 'gaugeGrad' + Math.random().toString(36).slice(2, 8);
    const defs = el('defs', {});
    // gradientUnits tuyệt đối (userSpaceOnUse) trên toàn bộ chiều rộng gauge, để màu sắc
    // phản ánh đúng vị trí góc thực tế thay vì tô lại theo bounding box của đoạn cung đã vẽ
    const grad = el('linearGradient', { id: gradId, gradientUnits: 'userSpaceOnUse', x1: cx - r, y1: 0, x2: cx + r, y2: 0 });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': opts.colorStart || '#dc2626' }));
    grad.appendChild(el('stop', { offset: '50%', 'stop-color': opts.colorMid || '#f5c451' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': opts.colorEnd || '#16a34a' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    if (pct > 0) {
      svg.appendChild(el('path', { d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${vx} ${vy}`, fill: 'none', stroke: `url(#${gradId})`, 'stroke-width': thickness, 'stroke-linecap': 'round' }));
    }
    container.appendChild(svg);
  }

  window.Charts = { lineChart, donutChart, barChart, radarChart, gaugeCircle, gaugeArc };
})();
