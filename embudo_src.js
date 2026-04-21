var dscc = require('@google/dscc');

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.overflow = 'hidden';

  var rows = data.tables.DEFAULT.rows;
  if (!rows || rows.length === 0) {
    document.body.innerHTML = '<p>Sin datos</p>';
    return;
  }

  var colors = ['#7DC143', '#9AD65A', '#B8E47A', '#4A7C20', '#1a1a1a'];

  var stages = rows.map(function(row) {
    return { name: String(row[0]), value: Number(row[1]) };
  }).sort(function(a, b) {
    var na = parseInt(a.name);
    var nb = parseInt(b.name);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return 0;
  });

  var total = stages[0].value;
  var width = dscc.getWidth();
  var height = dscc.getHeight();
  var rowHeight = height / stages.length;
  var leftWidth = width * 0.5;
  var rightWidth = width * 0.5;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  document.body.appendChild(svg);

  stages.forEach(function(stage, i) {
    var prev = i === 0 ? null : stages[i - 1];
    var pct = i === 0 ? 100 : Math.round((stage.value / prev.value) * 100);

    var topRatio = stage.value / total;
    var nextStage = stages[i + 1];
    var bottomRatio = nextStage ? nextStage.value / total : topRatio * 0.5;

    var topW = leftWidth * topRatio;
    var bottomW = leftWidth * bottomRatio;
    var topX = (leftWidth - topW) / 2;
    var bottomX = (leftWidth - bottomW) / 2;
    var y = i * rowHeight;

    // Trapecio
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

    // Etiqueta derecha
    var labelX = leftWidth + 4;
    var labelY = y + rowHeight * 0.3;
    var labelW = rightWidth - 8;
    var labelH = rowHeight - 4;

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', labelX);
    rect.setAttribute('y', y + 2);
    rect.setAttribute('width', labelW);
    rect.setAttribute('height', labelH);
    rect.setAttribute('fill', colors[i] || '#7DC143');
    rect.setAttribute('rx', '4');
    svg.appendChild(rect);

    // % y conteo
    var text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text1.setAttribute('x', labelX + 8);
    text1.setAttribute('y', y + rowHeight * 0.42);
    text1.setAttribute('fill', 'white');
    text1.setAttribute('font-size', Math.min(14, rowHeight * 0.35));
    text1.setAttribute('font-weight', 'bold');
    text1.setAttribute('font-family', 'Arial, sans-serif');
    text1.textContent = pct + '% (' + stage.value + ')';
    svg.appendChild(text1);

    // Nombre etapa
    var cleanName = stage.name.replace(/^\d+\.\s*/, 'Etapa - ');
    var text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text2.setAttribute('x', labelX + 8);
    text2.setAttribute('y', y + rowHeight * 0.72);
    text2.setAttribute('fill', 'white');
    text2.setAttribute('font-size', Math.min(12, rowHeight * 0.28));
    text2.setAttribute('font-family', 'Arial, sans-serif');
    text2.textContent = cleanName;
    svg.appendChild(text2);
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
