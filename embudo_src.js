var dscc = require('@google/dscc');

function drawViz(data) {
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';

  var rows = data.tables.DEFAULT.rows;
  if (!rows || rows.length === 0) {
    document.body.innerHTML = '<p>Sin datos</p>';
    return;
  }

  var colors = ['#7DC143', '#9AD65A', '#B8E47A', '#4A7C20', '#1a1a1a'];

  // Parsear etapas - con tableTransform cada row es array [etapa, valor]
  var stages = rows.map(function(row) {
    return {
      name: String(row[0]),
      value: Number(row[1])
    };
  }).sort(function(a, b) {
    var na = parseInt(a.name);
    var nb = parseInt(b.name);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return 0;
  });

  var total = stages[0].value;

  var container = document.createElement('div');
  container.style.width = '100%';
  container.style.padding = '8px';
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
  title.style.marginBottom = '8px';
  title.innerText = 'EMBUDO DE VENTAS';
  container.appendChild(title);

  stages.forEach(function(stage, i) {
    var prev = i === 0 ? null : stages[i - 1];
    var pct = i === 0 ? 100 : Math.round((stage.value / prev.value) * 100);
    var widthPct = Math.max(10, Math.round((stage.value / total) * 100));

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '4px';
    container.appendChild(row);

    var barWrap = document.createElement('div');
    barWrap.style.width = '50%';
    barWrap.style.display = 'flex';
    barWrap.style.justifyContent = 'center';

    var bar = document.createElement('div');
    bar.style.width = widthPct + '%';
    bar.style.height = '44px';
    bar.style.backgroundColor = colors[i] || '#7DC143';
    bar.style.borderRadius = '4px';
    barWrap.appendChild(bar);
    row.appendChild(barWrap);

    var label = document.createElement('div');
    label.style.width = '50%';
    label.style.backgroundColor = colors[i] || '#7DC143';
    label.style.color = 'white';
    label.style.padding = '6px 10px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '13px';
    label.style.lineHeight = '1.4';

    var cleanName = stage.name.replace(/^\d+\.\s*/, '');
    label.innerHTML = '<strong>' + pct + '%</strong> (' + stage.value + ')<br>' + cleanName;
    row.appendChild(label);
  });
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
