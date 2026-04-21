var dscc = require('@google/dscc');

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.overflow = 'hidden';

  var row = data.tables.DEFAULT.rows[0];
  var headers = data.tables.DEFAULT.headers;

  if (!row) {
    document.body.innerHTML = '<p>Sin datos</p>';
    return;
  }

  // Primeros 5 son conteos, siguientes 5 son porcentajes
  var counts = [], pcts = [], names = [];
  for (var i = 0; i < 5; i++) {
    if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
      counts.push(Number(row[i]));
      names.push(headers[i].name);
    }
  }
  for (var j = 5; j < 10; j++) {
    pcts.push(row[j] !== null && row[j] !== undefined ? Number(row[j]) : null);
  }

  var total = counts[0];
  var colors = ['#7DC143', '#9AD65A', '#B8E47A', '#4A7C20', '#1a1a1a'];
  var width = dscc.getWidth();
  var height = dscc.getHeight();
  var rowHeight = height / counts.length;
  var leftWidth = width * 0.5;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  counts.forEach(function(count, i) {
    var prev = i === 0 ? null : counts[i - 1];
    // Usar % del campo si existe, sino calcular
    var pct;
    if (pcts[i] !== null && pcts[i] !== undefined) {
      pct = Math.round(pcts[i] * 100) + '%';
    } else {
      pct = i === 0 ? '100%' : Math.round((count / prev) * 100) + '%';
    }

    var topRatio = count / total;
    var nextCount = counts[i + 1];
    var bottomRatio = nextCount ? nextCount / total : topRatio * 0.3;

    var topW = leftWidth * topRatio;
    var bottomW = leftWidth * bottomRatio;
    var topX = (leftWidth - topW) / 2;
    var bottomX = (leftWidth - bottomW) / 2;
    var y = i * rowHeight;

    var points = [
      topX + ',' + y,
      (topX + topW) + ',' + y,
      (bottomX + bottomW) + ',' + (y + rowHeight - 2),
      bottomX + ',' + (y + rowHeight - 2)
    ].join(' ');

    var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', points);
    poly.setAttribute('fill', colors[i] || '#7DC143');
    svg.appendChild(poly);

    var labelX = leftWidth + 4;
    var labelW = width * 0.5 - 8;
    var labelH = rowHeight - 4;

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', labelX);
    rect.setAttribute('y', y + 2);
    rect.setAttribute('width', labelW);
    rect.setAttribute('height', labelH);
    rect.setAttribute('fill', colors[i] || '#7DC143');
    rect.setAttribute('rx', '4');
    svg.appendChild(rect);

    var text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text1.setAttribute('x', labelX + 8);
    text1.setAttribute('y', y + rowHeight * 0.42);
    text1.setAttribute('fill', 'white');
    text1.setAttribute('font-size', Math.min(14, rowHeight * 0.35));
    text1.setAttribute('font-weight', 'bold');
    text1.setAttribute('font-family', 'Arial, sans-serif');
    text1.textContent = pct + ' (' + count + ')';
    svg.appendChild(text1);

    var text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text2.setAttribute('x', labelX + 8);
    text2.setAttribute('y', y + rowHeight * 0.72);
    text2.setAttribute('fill', 'white');
    text2.setAttribute('font-size', Math.min(12, rowHeight * 0.28));
    text2.setAttribute('font-family', 'Arial, sans-serif');
    text2.textContent = names[i];
    svg.appendChild(text2);
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
