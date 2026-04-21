/**
 * Embudo de Ventas - Looker Studio Community Visualization
 * Proyecto: Senda (gs://looker-embudo-senda/embudo.js)
 */

(function () {
  'use strict';

  var TOKENS = {
    font: "Arial, sans-serif",
    funnelColors: ['#3d1f7a', '#7e5cc2', '#c4b3e0', '#e8e0f2'],
    defaultStages: ['Leads', 'Visitas', 'Separacion', 'Venta'],
    widthRatios: [1.00, 0.78, 0.55, 0.32, 0.18],
    pad: { top: 64, bottom: 48, left: 110, right: 220 },
    sectionGap: 6,
    bubble: { color: '#96e05b', darkText: '#1f3d0f', w: 86, h: 58, anchor: 0.85 },
    rightBar: { bg: '#dcdcdc', text: '#2b2b2b', gap: 18, padding: 18, height: 34 },
    header: { color: '#1f2937', size: 14, weight: 700 },
    footer: { color: '#6b7280', size: 12, weight: 500 }
  };

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('es-PE');
  }

  function formatCurrency(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(ratio) {
    if (!isFinite(ratio) || ratio < 0) return '0%';
    var pct = ratio * 100;
    if (Math.abs(pct - Math.round(pct)) < 0.05) return Math.round(pct) + '%';
    return pct.toFixed(1) + '%';
  }

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function textOn(hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#1f2937' : '#ffffff';
  }

  function extractData(data) {
    var rows = (data && data.tables && data.tables.DEFAULT) || [];
    var result = { investment: null, counts: [0, 0, 0, 0], stages: TOKENS.defaultStages.slice() };
    if (rows.length === 0) return result;
    if (rows.length === 1 && rows[0].count && rows[0].count.length >= 4) {
      var arr = rows[0].count.map(Number);
      if (arr.length >= 5) {
        result.investment = arr[0];
        for (var i = 0; i < 4; i++) result.counts[i] = arr[i + 1] || 0;
      } else {
        for (var i2 = 0; i2 < 4; i2++) result.counts[i2] = arr[i2] || 0;
      }
      return result;
    }
    if (rows.length >= 5) {
      result.investment = Number((rows[0].count && rows[0].count[0]) || 0);
      for (var j = 0; j < 4; j++) {
        var r = rows[j + 1] || {};
        result.counts[j] = Number((r.count && r.count[0]) || 0);
        if (r.stage && r.stage[0]) result.stages[j] = String(r.stage[0]);
      }
      return result;
    }
    var n = Math.min(rows.length, 4);
    for (var k = 0; k < n; k++) {
      var row = rows[k] || {};
      result.counts[k] = Number((row.count && row.count[0]) || 0);
      if (row.stage && row.stage[0]) result.stages[k] = String(row.stage[0]);
    }
    return result;
  }

  function extractStyle(data) {
    var style = (data && data.style) || {};
    var read = function(key, fallback) {
      var v = style[key];
      if (v == null) return fallback;
      if (typeof v === 'object') {
        if ('value' in v) return v.value != null && v.value !== '' ? v.value : fallback;
        if ('color' in v) return v.color || fallback;
      }
      return v !== '' ? v : fallback;
    };
    return {
      stages: [
        read('stage1Name', null) || TOKENS.defaultStages[0],
        read('stage2Name', null) || TOKENS.defaultStages[1],
        read('stage3Name', null) || TOKENS.defaultStages[2],
        read('stage4Name', null) || TOKENS.defaultStages[3]
      ],
      colors: [
        read('color1', null) || TOKENS.funnelColors[0],
        read('color2', null) || TOKENS.funnelColors[1],
        read('color3', null) || TOKENS.funnelColors[2],
        read('color4', null) || TOKENS.funnelColors[3]
      ],
      footerNote: read('footerNote', ''),
      showInvestment: read('showInvestment', true)
    };
  }

  function computeGeometry(width, height) {
    var pad = TOKENS.pad;
    var innerW = Math.max(240, width - pad.left - pad.right);
    var innerH = Math.max(220, height - pad.top - pad.bottom);
    var centerX = pad.left + innerW / 2;
    var halfMax = innerW / 2;
    var levels = TOKENS.widthRatios.map(function(ratio, idx) {
      return {
        y: pad.top + (innerH * idx) / (TOKENS.widthRatios.length - 1),
        halfWidth: halfMax * ratio
      };
    });
    return { centerX: centerX, levels: levels, innerW: innerW, innerH: innerH, width: width, height: height };
  }

  function sectionPath(centerX, top, bot, opts) {
    opts = opts || {};
    var topBulge = opts.topBulge != null ? opts.topBulge : 6;
    var botBulge = opts.botBulge != null ? opts.botBulge : 18;
    return 'M ' + (centerX - top.halfWidth) + ',' + top.y +
      ' Q ' + centerX + ',' + (top.y - topBulge) + ' ' + (centerX + top.halfWidth) + ',' + top.y +
      ' L ' + (centerX + bot.halfWidth) + ',' + bot.y +
      ' Q ' + centerX + ',' + (bot.y + botBulge) + ' ' + (centerX - bot.halfWidth) + ',' + bot.y +
      ' Z';
  }

  function buildSections(geom, counts, colors) {
    var centerX = geom.centerX, levels = geom.levels;
    var gap = TOKENS.sectionGap, out = '';
    for (var i = 0; i < 4; i++) {
      var top = { y: levels[i].y + (i === 0 ? 0 : gap / 2), halfWidth: levels[i].halfWidth };
      var bot = { y: levels[i + 1].y - (i === 3 ? 0 : gap / 2), halfWidth: levels[i + 1].halfWidth };
      var avgW = (top.halfWidth + bot.halfWidth) / 2;
      var d = sectionPath(centerX, top, bot, {
        topBulge: Math.max(4, Math.min(10, avgW * 0.05)),
        botBulge: Math.max(12, Math.min(26, avgW * 0.18))
      });
      out += '<path d="' + d + '" fill="' + colors[i] + '" />';
      var midY = (top.y + bot.y) / 2;
      var fontSize = Math.max(22, Math.min(44, avgW * 0.22));
      out += '<text x="' + centerX + '" y="' + (midY + fontSize * 0.35) + '"' +
        ' font-family="Arial, sans-serif" font-size="' + fontSize + '" font-weight="800"' +
        ' fill="' + textOn(colors[i]) + '" text-anchor="middle">' + formatNumber(counts[i]) + '</text>';
    }
    return out;
  }

  function buildBubbles(geom, counts, stages) {
    var centerX = geom.centerX, levels = geom.levels;
    var bubble = TOKENS.bubble, out = '';
    for (var i = 1; i < 4; i++) {
      var midY = (levels[i].y + levels[i + 1].y) / 2;
      var edgeHalf = Math.max(levels[i].halfWidth, (levels[i].halfWidth + levels[i + 1].halfWidth) / 2);
      var cxB = centerX - edgeHalf * bubble.anchor;
      var ratio = counts[i - 1] > 0 ? counts[i] / counts[i - 1] : 0;
      out += '<ellipse cx="' + cxB + '" cy="' + midY + '" rx="' + (bubble.w / 2) + '" ry="' + (bubble.h / 2) + '"' +
        ' fill="' + bubble.color + '" stroke="#ffffff" stroke-width="2" />';
      out += '<text x="' + cxB + '" y="' + (midY - 6) + '"' +
        ' font-family="Arial, sans-serif" font-size="10" font-weight="600"' +
        ' fill="' + bubble.darkText + '" text-anchor="middle">Ratio ' + escapeXml(stages[i]) + '</text>';
      out += '<text x="' + cxB + '" y="' + (midY + 12) + '"' +
        ' font-family="Arial, sans-serif" font-size="16" font-weight="800"' +
        ' fill="#ffffff" text-anchor="middle">' + formatPercent(ratio) + '</text>';
    }
    return out;
  }

  function buildRightLabels(geom, stages) {
    var centerX = geom.centerX, levels = geom.levels, width = geom.width;
    var bar = TOKENS.rightBar, out = '';
    for (var i = 0; i < 4; i++) {
      var midY = (levels[i].y + levels[i + 1].y) / 2;
      var barX = centerX + Math.max(levels[i].halfWidth, levels[i + 1].halfWidth) + bar.gap;
      var barW = Math.max(60, width - barX - 16);
      out += '<rect x="' + barX + '" y="' + (midY - bar.height / 2) + '" width="' + barW + '" height="' + bar.height + '"' +
        ' fill="' + bar.bg + '" rx="2" ry="2" />';
      out += '<text x="' + (barX + bar.padding) + '" y="' + (midY + 5) + '"' +
        ' font-family="Arial, sans-serif" font-size="15" font-weight="600"' +
        ' fill="' + bar.text + '" text-anchor="start">' + escapeXml(stages[i]) + '</text>';
    }
    return out;
  }

  function buildHeader(geom, investment, show) {
    if (!show || investment == null) return '';
    return '<text x="' + geom.centerX + '" y="28" font-family="Arial, sans-serif"' +
      ' font-size="' + TOKENS.header.size + '" font-weight="' + TOKENS.header.weight + '"' +
      ' fill="' + TOKENS.header.color + '" text-anchor="middle">Inversion: ' + escapeXml(formatCurrency(investment)) + '</text>';
  }

  function buildFooter(geom, note) {
    if (!note) return '';
    return '<text x="' + (geom.width - 16) + '" y="' + (geom.height - 14) + '" font-family="Arial, sans-serif"' +
      ' font-size="' + TOKENS.footer.size + '" font-weight="' + TOKENS.footer.weight + '"' +
      ' fill="' + TOKENS.footer.color + '" text-anchor="end">' + escapeXml(note) + '</text>';
  }

  function ensureContainer() {
    var el = document.getElementById('embudo-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'embudo-root';
      el.style.cssText = 'width:100%;height:100vh;margin:0;padding:0;background:#ffffff;overflow:hidden;';
      document.body.style.margin = '0';
      document.body.appendChild(el);
    }
    return el;
  }

  function render(data) {
    var container = ensureContainer();
    var width = container.clientWidth || window.innerWidth || 800;
    var height = container.clientHeight || window.innerHeight || 500;
    var extracted = extractData(data);
    var styled = extractStyle(data);
    var stages = extracted.stages.map(function(s, i) {
      return (s && s !== TOKENS.defaultStages[i]) ? s : (styled.stages[i] || TOKENS.defaultStages[i]);
    });
    var geom = computeGeometry(width, height);
    container.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"' +
      ' width="' + width + '" height="' + height + '"' +
      ' viewBox="0 0 ' + width + ' ' + height + '"' +
      ' preserveAspectRatio="xMidYMid meet" style="display:block;">' +
      buildHeader(geom, extracted.investment, styled.showInvestment) +
      buildRightLabels(geom, stages) +
      buildSections(geom, extracted.counts, styled.colors) +
      buildBubbles(geom, extracted.counts, stages) +
      buildFooter(geom, styled.footerNote) +
      '</svg>';
  }

  var resizeTimer = null, lastData = null;
  window.addEventListener('resize', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() { if (lastData) render(lastData); }, 120);
  });

  function onData(data) {
    lastData = data;
    try { render(data); }
    catch (err) {
      console.error('[embudo] render error:', err);
      ensureContainer().innerHTML = '<div style="padding:24px;color:#b91c1c;">Error: ' + escapeXml(err.message) + '</div>';
    }
  }

  if (typeof dscc !== 'undefined' && dscc && dscc.subscribeToData) {
    dscc.subscribeToData(onData, { transform: dscc.tableTransform });
  } else {
    window.__embudoRender = onData;
    if (window.__embudoMockData) onData(window.__embudoMockData);
  }
})();
