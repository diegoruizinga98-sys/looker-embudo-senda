var dscc = require('@google/dscc');

function extractData(data) {
  var rows = (data && data.tables && data.tables.DEFAULT) || [];
  var result = {
    investment: null,
    counts: [0, 0, 0, 0, 0],
    stages: ['Prospectos', 'Proformas', 'Visitas', 'Separaciones', 'Ventas']
  };
  if (rows.length === 0) return result;
  var r = rows[0];
  var keys = ['count', 'count2', 'count3', 'count4', 'count5'];
  keys.forEach(function(k, i) {
    if (r[k] && r[k][0] != null) result.counts[i] = Number(r[k][0]);
  });
  return result;
}

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.backgroundColor = '#ffffff';
  document.body.style.overflow = 'hidden';

  var extracted = extractData(data);
  var counts = extracted.counts;
  var names  = extracted.stages;

  // Filtrar etapas con valor 0 o null en cualquier posición
  var filtered = { counts: [], names: [] };
  counts.forEach(function(c, i) {
    if (c !== null && c !== 0) {
      filtered.counts.push(c);
      filtered.names.push(names[i]);
    }
  });
  counts = filtered.counts;
  names  = filtered.names;

  if (counts.length === 0) {
    document.body.innerHTML = '<p style="padding:16px">Sin datos</p>';
    return;
  }

  var width  = dscc.getWidth();
  var height = dscc.getHeight();
  var n      = counts.length;

  var circleR   = height * 0.055;
  var gapH      = circleR * 2.4;
  var totalGaps = (n - 1) * gapH;
  var rowH      = (height - totalGaps) / n;

  var funnelW = width * 0.52;
  var labelX  = funnelW + 14;
  var labelW  = width - funnelW - 20;

  var colors = ['#7DC143', '#5a9e2f', '#3d7a1e', '#285214', '#1a1a1a'];

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  counts.forEach(function(count, i) {
    var y    = i * (rowH + gapH);
    var yBot = y + rowH;

    var topRatio    = Math.max(0.15, count / counts[0]);
    var nextCount   = counts[i + 1];
    var bottomRatio = nextCount ? Math.max(0.12, nextCount / counts[0]) : topRatio * 0.45;

    var topW = funnelW * topRatio;
    var botW = funnelW * bottomRatio;
    var topL = (funnelW - topW) / 2;
    var topR = topL + topW;
    var botL = (funnelW - botW) / 2;
    var botR = botL + botW;
    var cx   = funnelW / 2;

    var topBulge = Math.max(6, topW * 0.07);
    var botBulge = Math.max(10, botW * 0.18);

    var d = 'M ' + topL + ',' + y +
            ' Q ' + cx + ',' + (y - topBulge) + ' ' + topR + ',' + y +
            ' L ' + botR + ',' + yBot +
            ' Q ' + cx  + ',' + (yBot + botBulge) + ' ' + botL + ',' + yBot +
            ' Z';

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',    d);
    path.setAttribute('fill', colors[i] || '#3d1f7a');
    svg.appendChild(path);

    // Número grande centrado
    var midY     = y + rowH / 2;
    var fontSize = Math.max(20, Math.min(38, rowH * 0.52));
    var numColor = '#ffffff';

    var numTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numTxt.setAttribute('x',           cx);
    numTxt.setAttribute('y',           midY + fontSize * 0.36);
    numTxt.setAttribute('text-anchor', 'middle');
    numTxt.setAttribute('fill',        numColor);
    numTxt.setAttribute('font-size',   fontSize);
    numTxt.setAttribute('font-weight', 'bold');
    numTxt.setAttribute('font-family', 'Arial, sans-serif');
    numTxt.textContent = count.toLocaleString();
    svg.appendChild(numTxt);

    // Etiqueta gris a la derecha
    var barH = rowH * 0.55;
    var barY = midY - barH / 2;

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x',      labelX);
    rect.setAttribute('y',      barY);
    rect.setAttribute('width',  labelW);
    rect.setAttribute('height', barH);
    rect.setAttribute('fill',   '#e0e0e0');
    rect.setAttribute('rx',     '5');
    svg.appendChild(rect);

    var ltxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ltxt.setAttribute('x',           labelX + labelW / 2);
    ltxt.setAttribute('y',           midY + 5);
    ltxt.setAttribute('text-anchor', 'middle');
    ltxt.setAttribute('fill',        '#333333');
    ltxt.setAttribute('font-size',   Math.min(rowH * 0.28, 14));
    ltxt.setAttribute('font-family', 'Arial, sans-serif');
    ltxt.textContent = names[i];
    svg.appendChild(ltxt);

    // Círculo verde de ratio entre etapas
    if (i > 0) {
      var pct     = Math.round((count / counts[i - 1]) * 100);
      var circleY = y - gapH / 2;
      var circleX = circleR * 1.6;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx',   circleX);
      circle.setAttribute('cy',   circleY);
      circle.setAttribute('r',    circleR);
      circle.setAttribute('fill', '#7DC143');
      svg.appendChild(circle);

      var rLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rLabel.setAttribute('x',           circleX);
      rLabel.setAttribute('y',           circleY - circleR * 0.18);
      rLabel.setAttribute('text-anchor', 'middle');
      rLabel.setAttribute('fill',        'white');
      rLabel.setAttribute('font-size',   Math.min(circleR * 0.36, 9));
      rLabel.setAttribute('font-family', 'Arial, sans-serif');
      rLabel.textContent = 'Ratio ' + names[i];
      svg.appendChild(rLabel);

      var rNum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rNum.setAttribute('x',           circleX);
      rNum.setAttribute('y',           circleY + circleR * 0.52);
      rNum.setAttribute('text-anchor', 'middle');
      rNum.setAttribute('fill',        'white');
      rNum.setAttribute('font-size',   Math.min(circleR * 0.52, 13));
      rNum.setAttribute('font-weight', 'bold');
      rNum.setAttribute('font-family', 'Arial, sans-serif');
      rNum.textContent = pct + '%';
      svg.appendChild(rNum);
    }
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
