const STORAGE_KEYS = {
  config: 'pisConfig',
  state: 'pisState',
};

async function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEYS.config);
  if (saved) return JSON.parse(saved);
  const response = await fetch('config.json');
  return response.json();
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config, null, 2));
}

function setRouteLineOptions(config) {
  const routeLine = document.getElementById('routeLine');
  routeLine.innerHTML = '';
  config.lines.forEach((line) => {
    const option = document.createElement('option');
    option.value = line.id;
    option.textContent = `${line.product} ${line.name} (${line.id})`;
    routeLine.appendChild(option);
  });
}

function parseTokens(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [type, ...rest] = line.split(':');
      const payload = rest.join(':');
      if (type === 'snippet') return { type: 'snippet', snippetId: payload };
      if (type === 'text') return { type: 'text', value: payload };
      if (type === 'placeholder') return { type: 'placeholder', name: payload };
      return null;
    })
    .filter(Boolean);
}

(async function init() {
  const config = await loadConfig();
  let draftStops = [];

  const raw = document.getElementById('configRaw');

  function rerender() {
    setRouteLineOptions(config);
    raw.value = JSON.stringify(config, null, 2);
    document.getElementById('routePreview').textContent = JSON.stringify(draftStops, null, 2);
  }

  document.getElementById('addLine').addEventListener('click', () => {
    config.lines.push({
      id: document.getElementById('lineId').value.trim(),
      name: document.getElementById('lineName').value.trim(),
      product: document.getElementById('lineProduct').value.trim(),
      color: document.getElementById('lineColor').value,
    });
    rerender();
  });

  document.getElementById('addStop').addEventListener('click', () => {
    draftStops.push({
      id: document.getElementById('stopId').value.trim(),
      name: document.getElementById('stopName').value.trim(),
      platform: document.getElementById('stopPlatform').value.trim(),
      plannedDeparture: document.getElementById('stopTime').value.trim(),
      doorSide: document.getElementById('stopDoor').value,
    });
    rerender();
  });

  document.getElementById('saveRoute').addEventListener('click', () => {
    config.routes.push({
      id: document.getElementById('routeId').value.trim(),
      lineId: document.getElementById('routeLine').value,
      name: document.getElementById('routeName').value.trim(),
      stops: draftStops,
    });
    draftStops = [];
    rerender();
  });

  document.getElementById('addSnippet').addEventListener('click', () => {
    config.announcements.snippets.push({
      id: document.getElementById('snippetId').value.trim(),
      text: document.getElementById('snippetText').value.trim(),
    });
    rerender();
  });

  document.getElementById('saveTemplate').addEventListener('click', () => {
    config.announcements.templates.push({
      id: document.getElementById('templateId').value.trim(),
      name: document.getElementById('templateName').value.trim(),
      tokens: parseTokens(document.getElementById('templateTokens').value),
    });
    rerender();
  });

  document.getElementById('saveConfig').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(raw.value);
      saveConfig(parsed);
      alert('Konfiguration gespeichert');
    } catch (error) {
      alert('Ungültiges JSON');
    }
  });

  document.getElementById('exportConfig').addEventListener('click', () => {
    const blob = new Blob([raw.value], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'config.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById('importConfig').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    Object.assign(config, parsed);
    rerender();
  });

  rerender();
})();
