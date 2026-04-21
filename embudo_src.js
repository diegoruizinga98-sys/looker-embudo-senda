var dscc = require('@google/dscc');

function drawViz(data) {
  // Limpiar contenido anterior
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.backgroundColor = '#fff';

  var rows = data.tables.DEFAULT.rows;
  if (!rows || rows.length === 0) {
    document.body.innerHTML = '<p>Sin datos</p>';
    return;
  }

  // Parsear etapas
  var stages = rows.map(function(row) {
    return {
      name: String(row.dimID[0]),
      value: Number(row.metricID[0])
    };
  }).sort(function(a, b) {
    var na = parseInt(a.name);
    var nb = parseInt(b.name);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return 0;
  });

  var total = stages[0].value;
  var colors = ['#7DC143', '#9AD65A', '#B8E47A', '#4A7C20', '#1a1a1a'];

  // Contenedor principal
  var container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  // Título
  var title = document.createElement('div');
  title.style.backgroundColor = '#7DC143';
  title.style.color = 'white';
  title.style.textAlign = 'center';
  title.style.padding = '10px';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '16px';
  title.style.borderRadius = '8px 8px 0 0';
  title.innerText = 'EMBUDO DE VENTAS';
  container.appendChild(title);

  // Filas del embudo
  stages.forEach(function(stage, i) {
    var prev = i === 0 ? null : stages[i - 1];
    var pct = i === 0 ? 100 : Math.round((stage.value / prev.value) * 100);
    var widthPct = Math.round((stage.value / total) * 100);

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginTop = '4px';
    container.appendChild(row);

    // Barra
    var barWrap = document.createElement('div');
    barWrap.style.width = '55%';
    barWrap.style.display = 'flex';
    barWrap.style.justifyContent = 'center';

    var bar = document.createElement('div');
    bar.style.width = widthPct + '%';
    bar.style.height = '40px';
    bar.style.backgroundColor = colors[i] || '#7DC143';
    bar.style.borderRadius = '4px';
    barWrap.appendChild(bar);
    row.appendChild(barWrap);

    // Etiqueta
    var label = document.createElement('div');
    label.style.width = '45%';
    label.style.backgroundColor = colors[i] || '#7DC143';
    label.style.color = 'white';
    label.style.padding = '4px 8px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '13px';

    var cleanName = stage.name.replace(/^\d+\.\s*/, '');
    label.innerHTML = '<strong>' + pct + '%</strong> (' + stage.value + ')<br>' + cleanName;
    row.appendChild(label);
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
