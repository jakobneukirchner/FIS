(() => {
  const STORAGE_KEYS = {
    config: 'pisConfig',
    state: 'pisState',
  };

  const defaultState = {
    activeRouteId: '',
    activeStopIndex: 0,
    delayMinutes: 0,
    activeAnnouncement: '',
    simulationEnabled: true,
    simulationIntervalSeconds: 15,
    occupancyLevel: 'normal',
    serviceNotice: '',
  };

  function isDriverView() {
    return window.location.search.includes('driver');
  }

  async function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEYS.config);
    if (saved) return JSON.parse(saved);
    const response = await fetch('config.json');
    return response.json();
  }

  function loadState(config) {
    const saved = localStorage.getItem(STORAGE_KEYS.state);
    const state = {
      ...defaultState,
      activeRouteId: config.activeRouteId || config.routes?.[0]?.id || '',
      activeStopIndex: config.activeStopIndex || 0,
      delayMinutes: config.delayMinutes || 0,
    };
    return saved ? { ...state, ...JSON.parse(saved) } : state;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
  }

  function findRoute(config, routeId) {
    return config.routes.find((route) => route.id === routeId) || null;
  }

  function tokenToText(token, snippets, context) {
    if (token.type === 'snippet') {
      return snippets.find((snippet) => snippet.id === token.snippetId)?.text || '';
    }
    if (token.type === 'text') return token.value || '';
    if (token.type === 'placeholder') return context[token.name] ?? '';
    return '';
  }

  function renderAnnouncement(template, snippets, context) {
    return (template?.tokens || []).map((token) => tokenToText(token, snippets, context)).join('').trim();
  }

  function refreshDriverStops(route, activeStopIndex) {
    const wrapper = document.getElementById('driverStops');
    const jumpStopSelect = document.getElementById('jumpStopSelect');
    wrapper.innerHTML = '';
    jumpStopSelect.innerHTML = '';

    if (!route?.stops?.length) {
      wrapper.textContent = 'Keine Halte vorhanden';
      return;
    }

    route.stops.forEach((stop, index) => {
      const row = document.createElement('div');
      row.className = `stop-row ${index === activeStopIndex ? 'active' : ''}`;
      row.innerHTML = `<span>${index + 1}. ${stop.name}</span><span>Gleis ${stop.platform || '—'}</span>`;
      wrapper.appendChild(row);

      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${index + 1}. ${stop.name}`;
      jumpStopSelect.appendChild(option);
    });

    jumpStopSelect.value = String(activeStopIndex);
  }

  (async function init() {
    if (!isDriverView()) return;

    const config = await loadConfig();
    const state = loadState(config);

    const routeSelect = document.getElementById('routeSelect');
    const templateSelect = document.getElementById('templateSelect');

    config.routes.forEach((route) => {
      const option = document.createElement('option');
      option.value = route.id;
      option.textContent = route.name || route.id;
      routeSelect.appendChild(option);
    });
    if (state.activeRouteId) routeSelect.value = state.activeRouteId;

    (config.announcements?.templates || []).forEach((template) => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name || template.id;
      templateSelect.appendChild(option);
    });

    function render() {
      const route = findRoute(config, state.activeRouteId);
      const stops = route?.stops || [];
      state.activeStopIndex = Math.max(0, Math.min(state.activeStopIndex, Math.max(0, stops.length - 1)));
      state.delayMinutes = Math.max(0, Number(state.delayMinutes) || 0);
      state.simulationIntervalSeconds = Math.max(5, Number(state.simulationIntervalSeconds) || 15);
      saveState(state);

      const stop = stops[state.activeStopIndex];
      document.getElementById('activeStopText').textContent = stop
        ? `Aktiver Halt: ${stop.name} (Gleis ${stop.platform || '—'})`
        : 'Kein aktiver Halt';
      document.getElementById('delayInfo').innerHTML =
        `Aktuelle Verspätung: <span class="delay-badge">+${state.delayMinutes} Min</span>`;

      refreshDriverStops(route, state.activeStopIndex);

      const selectedTemplate = (config.announcements?.templates || []).find((tpl) => tpl.id === templateSelect.value)
        || config.announcements?.templates?.[0];
      const context = {
        nextStop: stop?.name || '',
        platform: stop?.platform || '',
        doorSide: stop?.doorSide || '',
        delayMinutes: state.delayMinutes,
      };
      document.getElementById('announcementPreview').value =
        renderAnnouncement(selectedTemplate, config.announcements?.snippets || [], context);

      document.getElementById('delayDirectInput').value = String(state.delayMinutes);
      document.getElementById('occupancySelect').value = state.occupancyLevel || 'normal';
      document.getElementById('simEnabled').checked = Boolean(state.simulationEnabled);
      document.getElementById('simInterval').value = String(state.simulationIntervalSeconds || 15);
      document.getElementById('serviceNoticeInput').value = state.serviceNotice || '';
    }

    routeSelect.addEventListener('change', () => {
      state.activeRouteId = routeSelect.value;
      state.activeStopIndex = 0;
      render();
    });

    document.getElementById('prevStop').addEventListener('click', () => {
      state.activeStopIndex -= 1;
      render();
    });
    document.getElementById('nextStopBtn').addEventListener('click', () => {
      state.activeStopIndex += 1;
      render();
    });
    document.getElementById('setStop').addEventListener('click', () => render());

    document.getElementById('jumpToStop').addEventListener('click', () => {
      state.activeStopIndex = Number(document.getElementById('jumpStopSelect').value || 0);
      render();
    });

    document.querySelectorAll('[data-delay]').forEach((button) => {
      button.addEventListener('click', () => {
        state.delayMinutes += Number(button.dataset.delay || 0);
        render();
      });
    });

    document.getElementById('applyDelayDirect').addEventListener('click', () => {
      state.delayMinutes = Number(document.getElementById('delayDirectInput').value || 0);
      render();
    });

    document.getElementById('resetDelay').addEventListener('click', () => {
      state.delayMinutes = 0;
      render();
    });

    templateSelect.addEventListener('change', render);

    document.getElementById('applyOpsSettings').addEventListener('click', () => {
      state.occupancyLevel = document.getElementById('occupancySelect').value;
      state.simulationEnabled = document.getElementById('simEnabled').checked;
      state.simulationIntervalSeconds = Number(document.getElementById('simInterval').value || 15);
      state.serviceNotice = document.getElementById('serviceNoticeInput').value.trim();
      render();
    });

    document.getElementById('clearServiceNotice').addEventListener('click', () => {
      state.serviceNotice = '';
      render();
    });

    document.getElementById('resetRuntimeState').addEventListener('click', () => {
      state.activeStopIndex = 0;
      state.delayMinutes = 0;
      state.activeAnnouncement = '';
      state.simulationEnabled = true;
      state.simulationIntervalSeconds = 15;
      state.occupancyLevel = 'normal';
      state.serviceNotice = '';
      render();
    });

    document.getElementById('triggerAnnouncement').addEventListener('click', () => {
      state.activeAnnouncement = document.getElementById('announcementPreview').value;
      saveState(state);
      alert('Ansage ausgelöst');
    });

    render();
  })();
})();
