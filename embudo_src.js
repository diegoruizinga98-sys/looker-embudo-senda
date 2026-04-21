var dscc = require('@google/dscc');

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.backgroundColor = '#ffffff';
  document.body.style.overflow = 'hidden';

  var row = data.tables.DEFAULT.rows[0];
  var headers = data.tables.DEFAULT.headers;
  if (!row) { document.body.innerHTML = '<p>Sin datos</p>'; return; }

  var counts = [], names = [];
  for (var i = 0; i < 5; i++) {
    if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
      counts.push(Number(row[i]));
      names.push(headers[i].name.replace('Etapa - ', ''));
    }
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

  var colors = ['#3d1f7a', '#7e5cc2', '#c4b3e0', '#e8e0f2', '#f5f0ff'];

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  counts.forEach(function(count, i) {
    var y      = i * (rowH + gapH);
    var yBot   = y + rowH;

    var topRatio    = Math.max(0.15, count / counts[0]);
    var nextCount   = counts[i + 1];
    var bottomRatio = nextCount ? Math.max(0.12, nextCount / counts[0]) : topRatio * 0.45;

    var topW    = funnelW * topRatio;
    var bottomW = funnelW * bottomRatio;
    var topL    = (funnelW - topW)    / 2;
    var topR    = topL + topW;
    var botL    = (funnelW - bottomW) / 2;
    var botR    = botL + bottomW;
    var cx      = funnelW / 2;

    // Curva superior cóncava (control point hacia ARRIBA = y - bulge)
    var topBulge = Math.max(6, topW * 0.07);
    // Curva inferior convexa (control point hacia ABAJO = yBot + bulge)
    var botBulge = Math.max(10, bottomW * 0.18);

    //  M topL,y           — punto superior izquierdo
    //  Q cx,(y-topBulge)  — arco cóncavo hacia arriba
    //  topR,y             — punto superior derecho
    //  L botR,yBot        — lado derecho recto
    //  Q cx,(yBot+botBulge) — arco convexo hacia abajo
    //  botL,yBot          — punto inferior izquierdo
    //  Z
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
    var numColor = (i >= 2) ? '#1f2937' : '#ffffff';

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

    // Círculo verde de ratio (solo entre etapas, a la izquierda)
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

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
