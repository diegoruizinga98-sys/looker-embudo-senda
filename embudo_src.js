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

  var width = dscc.getWidth();
  var height = dscc.getHeight();
  var n = counts.length;
  var circleR = height * 0.06;
  var gapH = circleR * 2.2;
  var totalGaps = (n - 1) * gapH;
  var rowH = (height - totalGaps) / n;
  var funnelW = width * 0.5;
  var labelX = funnelW + 12;
  var labelW = width - funnelW - 20;

  // Colores verde claro a negro
  var colors = ['#7DC143', '#5a9e2f', '#3d7a1e', '#4A7C20', '#1a1a1a'];

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  counts.forEach(function(count, i) {
    var y = i * (rowH + gapH);

    // Calcular ancho del trapecio — mínimo 15% del ancho
    var topRatio = Math.max(0.15, count / counts[0]);
    var nextCount = counts[i + 1];
    var bottomRatio = nextCount ? Math.max(0.12, nextCount / counts[0]) : topRatio * 0.5;

    var topW = funnelW * topRatio;
    var bottomW = funnelW * bottomRatio;
    var topX = (funnelW - topW) / 2;
    var bottomX = (funnelW - bottomW) / 2;

    // Trapecio
    var pts = [
      topX + ',' + y,
      (topX + topW) + ',' + y,
      (bottomX + bottomW) + ',' + (y + rowH),
      bottomX + ',' + (y + rowH)
    ].join(' ');

    var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', colors[i] || '#1a1a1a');
    svg.appendChild(poly);

    // Número grande centrado
    var numTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numTxt.setAttribute('x', funnelW / 2);
    numTxt.setAttribute('y', y + rowH * 0.62);
    numTxt.setAttribute('text-anchor', 'middle');
    numTxt.setAttribute('fill', 'white');
    numTxt.setAttribute('font-size', Math.min(rowH * 0.55, 28));
    numTxt.setAttribute('font-weight', 'bold');
    numTxt.setAttribute('font-family', 'Arial, sans-serif');
    numTxt.textContent = count.toLocaleString();
    svg.appendChild(numTxt);

    // Etiqueta gris derecha
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', labelX);
    rect.setAttribute('y', y + rowH * 0.15);
    rect.setAttribute('width', labelW);
    rect.setAttribute('height', rowH * 0.7);
    rect.setAttribute('fill', '#e0e0e0');
    rect.setAttribute('rx', '6');
    svg.appendChild(rect);

    var ltxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ltxt.setAttribute('x', labelX + labelW / 2);
    ltxt.setAttribute('y', y + rowH * 0.6);
    ltxt.setAttribute('text-anchor', 'middle');
    ltxt.setAttribute('fill', '#333');
    ltxt.setAttribute('font-size', Math.min(rowH * 0.3, 13));
    ltxt.setAttribute('font-family', 'Arial, sans-serif');
    ltxt.textContent = names[i];
    svg.appendChild(ltxt);

    // Círculo ratio entre etapas
    if (i > 0) {
      var pct = Math.round((count / counts[i - 1]) * 100);
      var circleY = y - gapH / 2;
      var circleX = circleR * 1.5;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', circleX);
      circle.setAttribute('cy', circleY);
      circle.setAttribute('r', circleR);
      circle.setAttribute('fill', '#7DC143');
      svg.appendChild(circle);

      // "Ratio Visitas" en dos líneas
      var rLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rLine1.setAttribute('x', circleX);
      rLine1.setAttribute('y', circleY - circleR * 0.25);
      rLine1.setAttribute('text-anchor', 'middle');
      rLine1.setAttribute('fill', 'white');
      rLine1.setAttribute('font-size', Math.min(circleR * 0.38, 9));
      rLine1.setAttribute('font-family', 'Arial, sans-serif');
      rLine1.textContent = 'Ratio ' + names[i];
      svg.appendChild(rLine1);

      var rLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rLine2.setAttribute('x', circleX);
      rLine2.setAttribute('y', circleY + circleR * 0.5);
      rLine2.setAttribute('text-anchor', 'middle');
      rLine2.setAttribute('fill', 'white');
      rLine2.setAttribute('font-size', Math.min(circleR * 0.55, 12));
      rLine2.setAttribute('font-weight', 'bold');
      rLine2.setAttribute('font-family', 'Arial, sans-serif');
      rLine2.textContent = pct + '%';
      svg.appendChild(rLine2);
    }
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
