const STORAGE_KEYS = {
  config: 'pisConfig',
  state: 'pisState',
};

const defaultState = {
  activeRouteId: '',
  activeStopIndex: 0,
  delayMinutes: 0,
  activeAnnouncement: '',
};

async function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEYS.config);
  if (saved) return JSON.parse(saved);
  const response = await fetch('config.json');
  return response.json();
}

function loadState(config) {
  const saved = localStorage.getItem(STORAGE_KEYS.state);
  const base = {
    ...defaultState,
    activeRouteId: config.activeRouteId || '',
    activeStopIndex: config.activeStopIndex || 0,
    delayMinutes: config.delayMinutes || 0,
  };
  return saved ? { ...base, ...JSON.parse(saved) } : base;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
}

function findRoute(config, routeId) {
  return config.routes.find((route) => route.id === routeId) || null;
}

function findLine(config, lineId) {
  return config.lines.find((line) => line.id === lineId) || null;
}

function doorSideLabel(value) {
  if (value === 'left') return 'links';
  if (value === 'right') return 'rechts';
  if (value === 'both') return 'beidseitig';
  return '—';
}

function renderClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function render(config, state) {
  const route = findRoute(config, state.activeRouteId);
  const line = route ? findLine(config, route.lineId) : null;
  const stops = route?.stops || [];
  const idx = Math.max(0, Math.min(state.activeStopIndex, stops.length - 1));
  const currentStop = stops[idx];
  const destination = stops.length ? stops[stops.length - 1].name : 'Keine aktive Route';

  const pill = document.getElementById('linePill');
  pill.textContent = line ? `${line.product} ${line.name}` : 'Keine Linie';
  pill.style.background = line?.color || '#005ca9';

  document.getElementById('destination').textContent = destination;
  document.getElementById('viaStops').textContent = stops.length > 2
    ? `Via ${stops.slice(1, -1).map((stop) => stop.name).join(' · ')}`
    : 'Direktverbindung';

  document.getElementById('nextStop').textContent = currentStop?.name || '—';
  document.getElementById('platform').textContent = currentStop?.platform || '—';
  document.getElementById('plannedTime').textContent = currentStop?.plannedDeparture || '—';
  document.getElementById('delay').textContent = `+${state.delayMinutes} Min`;
  document.getElementById('delay').classList.toggle('delay-positive', state.delayMinutes > 0);
  document.getElementById('doorSide').textContent = doorSideLabel(currentStop?.doorSide);

  const upcomingStops = document.getElementById('upcomingStops');
  upcomingStops.innerHTML = '';
  stops.slice(idx + 1, idx + 4).forEach((stop) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${stop.name}</span><span>Gleis ${stop.platform || '—'}</span>`;
    upcomingStops.appendChild(li);
  });
  if (!upcomingStops.children.length) {
    const li = document.createElement('li');
    li.innerHTML = '<span>Keine weiteren Halte</span><span>—</span>';
    upcomingStops.appendChild(li);
  }

  document.getElementById('activeAnnouncement').textContent =
    `Aktuelle Ansage: ${state.activeAnnouncement || '—'}`;
}

(async function init() {
  const config = await loadConfig();
  const state = loadState(config);

  renderClock();
  render(config, state);

  setInterval(renderClock, 1000);

  // Demo-Simulation: Haltwechsel alle 15 Sekunden.
  setInterval(() => {
    const route = findRoute(config, state.activeRouteId);
    if (!route?.stops?.length) return;
    state.activeStopIndex = Math.min(state.activeStopIndex + 1, route.stops.length - 1);
    saveState(state);
    render(config, state);
  }, 15000);

  window.addEventListener('storage', (event) => {
    if (![STORAGE_KEYS.state, STORAGE_KEYS.config].includes(event.key)) return;
    location.reload();
  });
})();

// Für spätere DB-API-Erweiterung:
// - Einbindung DB Timetables API für Live-Abfahrten
// - Mapping von Prognosen auf delayMinutes / platform-Updates
