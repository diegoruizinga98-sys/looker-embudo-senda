var dscc = require('@google/dscc');

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.backgroundColor = '#f5f5f5';
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
  var rowH = height / (n + (n-1) * 0.3);
  var gapH = rowH * 0.3;
  var funnelW = width * 0.55;
  var labelX = funnelW + 10;
  var labelW = width - funnelW - 15;
  var colors = ['#7DC143', '#8BC34A', '#9CCC65', '#4A7C20', '#1a1a1a'];

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  // Fondo gris para etiquetas
  counts.forEach(function(count, i) {
    var y = i * (rowH + gapH);
    var topRatio = count / counts[0];
    var nextCount = counts[i+1];
    var bottomRatio = nextCount ? nextCount / counts[0] : topRatio * 0.4;
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
    poly.setAttribute('fill', colors[i] || '#7DC143');
    svg.appendChild(poly);

    // Número grande centrado en trapecio
    var cx = funnelW / 2;
    var cy = y + rowH / 2;
    var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', cx);
    txt.setAttribute('y', cy + rowH * 0.15);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', 'white');
    txt.setAttribute('font-size', Math.min(rowH * 0.5, 32));
    txt.setAttribute('font-weight', 'bold');
    txt.setAttribute('font-family', 'Arial, sans-serif');
    txt.textContent = count.toLocaleString();
    svg.appendChild(txt);

    // Etiqueta gris derecha
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', labelX);
    rect.setAttribute('y', y + rowH * 0.2);
    rect.setAttribute('width', labelW);
    rect.setAttribute('height', rowH * 0.6);
    rect.setAttribute('fill', '#e0e0e0');
    rect.setAttribute('rx', '4');
    svg.appendChild(rect);

    var ltxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ltxt.setAttribute('x', labelX + labelW / 2);
    ltxt.setAttribute('y', y + rowH * 0.58);
    ltxt.setAttribute('text-anchor', 'middle');
    ltxt.setAttribute('fill', '#333');
    ltxt.setAttribute('font-size', Math.min(rowH * 0.28, 14));
    ltxt.setAttribute('font-family', 'Arial, sans-serif');
    ltxt.textContent = names[i];
    svg.appendChild(ltxt);

    // Círculo ratio entre etapas
    if (i > 0) {
      var pct = Math.round((count / counts[i-1]) * 100);
      var circleY = y - gapH / 2;
      var circleX = funnelW * 0.08;
      var r = Math.min(gapH * 0.9, rowH * 0.4);

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', circleX);
      circle.setAttribute('cy', circleY);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', '#7DC143');
      svg.appendChild(circle);

      var ratioLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ratioLabel.setAttribute('x', circleX);
      ratioLabel.setAttribute('y', circleY - r * 0.1);
      ratioLabel.setAttribute('text-anchor', 'middle');
      ratioLabel.setAttribute('fill', 'white');
      ratioLabel.setAttribute('font-size', Math.min(r * 0.4, 10));
      ratioLabel.setAttribute('font-weight', 'bold');
      ratioLabel.setAttribute('font-family', 'Arial, sans-serif');
      ratioLabel.textContent = 'Ratio ' + names[i];
      svg.appendChild(ratioLabel);

      var ratioNum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ratioNum.setAttribute('x', circleX);
      ratioNum.setAttribute('y', circleY + r * 0.45);
      ratioNum.setAttribute('text-anchor', 'middle');
      ratioNum.setAttribute('fill', 'white');
      ratioNum.setAttribute('font-size', Math.min(r * 0.55, 13));
      ratioNum.setAttribute('font-weight', 'bold');
      ratioNum.setAttribute('font-family', 'Arial, sans-serif');
      ratioNum.textContent = pct + '%';
      svg.appendChild(ratioNum);
    }
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
