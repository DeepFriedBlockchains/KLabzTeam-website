(() => {
  const section = document.getElementById('live-tracking');
  if (!section) return;

  const API = 'https://kascov.io';
  const TOKEN_ID = '380151c0dd404ac59e9381a8b34ac05f7897d5fd327e2d50bceb33bf0256e535';
  const REFRESH_MS = 30_000;
  const MAX_DATA_AGE_MS = 5 * 60_000;
  const SOMPI_PER_KAS = 100_000_000;
  const UNAVAILABLE = 'Data temporarily unavailable';
  const RANGES = {
    '24h': { bucket: '1h', spanMs: 24 * 60 * 60_000, label: '24 hours' },
    '7d': { bucket: '4h', spanMs: 7 * 24 * 60 * 60_000, label: '7 days' },
    '30d': { bucket: '1d', spanMs: 30 * 24 * 60 * 60_000, label: '30 days' },
  };

  const byId = (id) => document.getElementById(id);
  const curveMeter = byId('curve-progress-meter');
  const curveFill = byId('curve-progress-fill');
  const chartLine = byId('price-chart-line');
  const chartArea = byId('price-chart-area');
  const chartDescription = byId('price-chart-description');
  const chartButtons = [...section.querySelectorAll('[data-chart-range]')];
  const lastValues = new Map();
  const flashTimers = new Map();
  let selectedRange = '24h';
  let chartRequest = 0;
  let updateTimer = null;
  let updateInProgress = false;
  let retryNotBefore = 0;
  let failureCount = 0;
  let lastUpdatedAt = null;
  let currentSpotKAS = null;
  let currentMarketCapKAS = null;
  let currentVolumeKAS = null;

  function readNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function putText(id, value) {
    const node = byId(id);
    if (node && node.textContent !== value) node.textContent = value;
  }

  function formatPlain(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits,
      useGrouping: true,
    }).format(value);
  }

  function formatPrice(value) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: value > 0 && value < 0.01 ? 8 : 2,
      maximumFractionDigits: 10,
      useGrouping: false,
    }).format(value);
  }

  function formatUsd(value) {
    if (Math.abs(value) < 0.01) return `$${formatPrice(Math.abs(value))}`;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatUnits(value, unit) {
    const useCompact = Math.abs(value) >= 10_000;
    const amount = useCompact
      ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(value)
      : formatPlain(value, 2);
    return `${amount} ${unit}`;
  }

  function freshTimestamp(value) {
    const timestamp = readNumber(value);
    if (timestamp === null) return null;
    const age = Date.now() - timestamp;
    return age >= -30_000 && age <= MAX_DATA_AGE_MS ? timestamp : null;
  }

  function recordUpdatedAt(timestamp) {
    if (timestamp === null) return;
    lastUpdatedAt = Math.max(lastUpdatedAt || 0, timestamp);
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    }).format(new Date(lastUpdatedAt));
    putText('tracker-updated', `Last updated ${formatted}`);
  }

  function markUnavailable(id) {
    putText(id, UNAVAILABLE);
  }

  function animatePrice(id, key, value, display) {
    const node = byId(id);
    if (!node) return;
    const previous = lastValues.get(key);
    if (previous !== undefined && value !== previous) {
      node.classList.remove('is-up', 'is-down');
      const direction = value > previous ? 'is-up' : 'is-down';
      requestAnimationFrame(() => node.classList.add(direction));
      if (flashTimers.has(key)) clearTimeout(flashTimers.get(key));
      flashTimers.set(key, setTimeout(() => {
        node.classList.remove('is-up', 'is-down');
        flashTimers.delete(key);
      }, 1_000));
    }
    lastValues.set(key, value);
    putText(id, display);
  }

  function clearCurve() {
    markUnavailable('curve-progress-text');
    markUnavailable('curve-phase');
    markUnavailable('curve-remaining');
    curveMeter.removeAttribute('aria-valuenow');
    curveMeter.setAttribute('aria-valuetext', UNAVAILABLE);
    curveFill.style.width = '0%';
  }

  function clearTokenMetrics() {
    currentSpotKAS = null;
    currentMarketCapKAS = null;
    currentVolumeKAS = null;
    clearCurve();
    markUnavailable('price-kas');
    markUnavailable('price-usd');
    markUnavailable('price-change');
    markUnavailable('market-cap-kas');
    markUnavailable('market-cap-usd');
    markUnavailable('volume-kas');
    markUnavailable('volume-usd');
    markUnavailable('holders-count');
  }

  function validSpot(market) {
    if (market?.program?.invariant_ok !== true) return null;
    const quoteSompi = readNumber(market.spot_num_sompi);
    const tokenAmount = readNumber(market.spot_den);
    if (quoteSompi === null || tokenAmount === null || quoteSompi <= 0 || tokenAmount <= 0) return null;
    return quoteSompi / tokenAmount / SOMPI_PER_KAS;
  }

  function renderProgress(market) {
    const basisPoints = readNumber(market?.grad_progress_bps);
    if (basisPoints === null || basisPoints < 0) {
      clearCurve();
      return;
    }

    const percent = Math.max(0, Math.min(100, basisPoints / 100));
    const formattedPercent = `${formatPlain(percent, 2)}%`;
    const isGraduated = market.phase === 'graduated' || percent >= 100;
    const phaseText = isGraduated ? 'Graduated' : market.phase === 'bonding' ? 'Bonding' : UNAVAILABLE;
    const remaining = Math.max(0, 100 - percent);

    if (curveMeter.getAttribute('aria-valuenow') !== String(percent)) {
      curveMeter.setAttribute('aria-valuenow', String(percent));
      curveFill.style.width = `${percent}%`;
    }
    curveMeter.setAttribute('aria-valuetext', `${formattedPercent} complete${isGraduated ? ', graduated' : ''}`);
    putText('curve-progress-text', `${formattedPercent} complete`);
    putText('curve-phase', phaseText);
    putText('curve-remaining', isGraduated ? 'Graduated' : `${formatPlain(remaining, 2)}% remaining to graduation`);
  }

  function renderToken(payload) {
    const token = payload?.token;
    if (token?.covenant_id !== TOKEN_ID || token.status !== 'verified') {
      clearTokenMetrics();
      throw new Error('KSQT token data is not verified');
    }

    const holders = readNumber(token.holders);
    if (holders === null || holders < 0) markUnavailable('holders-count');
    else putText('holders-count', formatPlain(holders, 0));

    const market = payload.market;
    const marketVerified = market?.program?.invariant_ok === true;
    if (!marketVerified) {
      currentSpotKAS = null;
      currentMarketCapKAS = null;
      currentVolumeKAS = null;
      clearCurve();
      markUnavailable('price-kas');
      markUnavailable('price-change');
      markUnavailable('market-cap-kas');
      markUnavailable('volume-kas');
      return false;
    }

    renderProgress(market);
    const spotKAS = validSpot(market);
    currentSpotKAS = spotKAS;
    const supply = readNumber(token.supply);
    if (spotKAS === null) {
      currentMarketCapKAS = null;
      markUnavailable('price-kas');
      markUnavailable('market-cap-kas');
    } else {
      animatePrice('price-kas', 'spot-kas', spotKAS, `${formatPrice(spotKAS)} KAS per KSQT`);
      if (supply !== null && supply >= 0) {
        currentMarketCapKAS = spotKAS * supply;
        putText('market-cap-kas', formatUnits(currentMarketCapKAS, 'KAS'));
      } else {
        currentMarketCapKAS = null;
        markUnavailable('market-cap-kas');
      }
    }

    const volumeSompi = readNumber(market.volume_24h_sompi);
    if (volumeSompi === null || volumeSompi < 0) {
      currentVolumeKAS = null;
      markUnavailable('volume-kas');
    } else {
      currentVolumeKAS = volumeSompi / SOMPI_PER_KAS;
      putText('volume-kas', formatUnits(currentVolumeKAS, 'KAS'));
    }

    const changeBps = readNumber(market.change_24h_bps);
    if (changeBps === null) markUnavailable('price-change');
    else {
      const changePercent = changeBps / 100;
      const sign = changePercent > 0 ? '+' : '';
      putText('price-change', `${sign}${formatPlain(changePercent, 2)}%`);
    }
    return spotKAS !== null;
  }

  function validKasUsd(payload) {
    const price = readNumber(payload?.kas_usd);
    const signers = readNumber(payload?.signatures ?? payload?.signers);
    const threshold = readNumber(payload?.threshold);
    const timestamp = freshTimestamp(payload?.updated_at_ms);
    if (price === null || price <= 0 || payload.signed !== true || payload.degraded === true
        || signers === null || threshold === null || signers < threshold || timestamp === null) return null;
    return { price, timestamp };
  }

  function renderKasUsd(payload) {
    const feed = validKasUsd(payload);
    if (!feed) {
      markUnavailable('price-usd');
      markUnavailable('market-cap-usd');
      markUnavailable('volume-usd');
      throw new Error('KAS/USD feed is missing valid signatures or is stale');
    }
    const tokenPrice = currentSpotKAS;

    if (tokenPrice === null) markUnavailable('price-usd');
    else animatePrice('price-usd', 'spot-usd', tokenPrice * feed.price, `${formatUsd(tokenPrice * feed.price)} USD per KSQT`);
    if (currentMarketCapKAS === null) markUnavailable('market-cap-usd');
    else putText('market-cap-usd', `${formatUsd(currentMarketCapKAS * feed.price)} · spot × supply`);
    if (currentVolumeKAS === null) markUnavailable('volume-usd');
    else putText('volume-usd', `${formatUsd(currentVolumeKAS * feed.price)} · 24h`);
    return feed.timestamp;
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const error = new Error(`Data service returned ${response.status}`);
        error.status = response.status;
        error.retryAfter = response.headers.get('Retry-After');
        throw error;
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function errorRetryMs(error) {
    if (!error || (error.status !== 429 && error.status !== 503) || !error.retryAfter) return 0;
    const seconds = Number(error.retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
    const dateDelay = Date.parse(error.retryAfter) - Date.now();
    return Number.isFinite(dateDelay) && dateDelay > 0 ? dateDelay : 0;
  }

  function addVerifiedUpdate(timestamp) {
    const fresh = freshTimestamp(timestamp);
    if (fresh === null) throw new Error('Market data timestamp is stale or invalid');
    recordUpdatedAt(fresh);
    return fresh;
  }

  function setUnavailableChart() {
    chartLine.setAttribute('d', '');
    chartArea.setAttribute('d', '');
    chartDescription.textContent = 'Verified price history is temporarily unavailable.';
    putText('price-chart-status', UNAVAILABLE);
  }

  function drawChart(payload, rangeKey, requestNumber) {
    if (requestNumber !== chartRequest) return null;
    if (payload?.token_id !== TOKEN_ID || !Array.isArray(payload.candles)) {
      setUnavailableChart();
      throw new Error('No verified KSQT candle series returned');
    }

    const range = RANGES[rangeKey];
    const generatedAt = freshTimestamp(payload.generated_at_ms);
    if (generatedAt === null) {
      setUnavailableChart();
      throw new Error('Candle data is stale or invalid');
    }
    const points = payload.candles
      .filter((candle) => {
        const time = readNumber(candle.t);
        const quote = readNumber(candle.close?.quote_sompi);
        const tokenAmount = readNumber(candle.close?.base_amount);
        return time !== null && time >= generatedAt - range.spanMs && time <= generatedAt
          && quote !== null && quote > 0 && tokenAmount !== null && tokenAmount > 0
          && (readNumber(candle.trades) > 0 || candle.carried === true);
      })
      .map((candle) => ({ time: Number(candle.t), price: Number(candle.close.quote_sompi) / Number(candle.close.base_amount) }))
      .sort((a, b) => a.time - b.time);

    if (points.length < 2) {
      setUnavailableChart();
      return false;
    }

    const width = 584;
    const left = 8;
    const top = 12;
    const bottom = 128;
    const values = points.map((point) => point.price);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const spread = maximum - minimum || Math.max(Math.abs(maximum) * 0.01, 1);
    const pathPoints = points.map((point, index) => ({
      x: left + (width * index) / (points.length - 1),
      y: maximum === minimum ? (top + bottom) / 2 : bottom - ((point.price - minimum) / spread) * (bottom - top),
    }));
    const linePath = pathPoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L${(left + width).toFixed(2)},${bottom} L${left},${bottom} Z`;
    chartLine.setAttribute('d', linePath);
    chartArea.setAttribute('d', areaPath);
    chartDescription.textContent = `Verified KSQT market-price history over ${range.label}; ${points.length} price points.`;
    putText('price-chart-status', `${points.length} verified price points · ${range.label}`);
    recordUpdatedAt(generatedAt);
    return true;
  }

  async function refreshChart(rangeKey = selectedRange) {
    const requestNumber = ++chartRequest;
    const range = RANGES[rangeKey];
    putText('price-chart-status', 'Loading verified price history…');
    const query = new URLSearchParams({ bucket: range.bucket, phase: 'all' });
    try {
      const payload = await fetchJson(`${API}/data/mainnet/token/${TOKEN_ID}/candles?${query}`);
      const drawn = drawChart(payload, rangeKey, requestNumber);
      if (drawn === false) throw new Error('Verified price history has fewer than two usable points');
      return drawn !== null;
    } catch (error) {
      if (requestNumber === chartRequest) setUnavailableChart();
      throw error;
    }
  }

  function updateTrackerStatus(failures) {
    putText('tracker-status', failures.length ? UNAVAILABLE : 'Live data connected');
  }

  async function refreshAll() {
    if (updateInProgress) return;
    if (Date.now() < retryNotBefore) {
      scheduleRefresh(retryNotBefore - Date.now());
      return;
    }
    updateInProgress = true;
    let nextDelay = REFRESH_MS;
    const failures = [];
    const results = await Promise.allSettled([
      fetchJson(`${API}/data/mainnet/token/${TOKEN_ID}?limit=1&events_limit=1`),
      fetchJson(`${API}/data/price.json`),
      refreshChart(selectedRange),
    ]);

    const [tokenResult, usdResult, chartResult] = results;
    if (tokenResult.status === 'fulfilled') {
      try {
        const updateTime = addVerifiedUpdate(tokenResult.value.generated_at_ms);
        if (!renderToken(tokenResult.value)) failures.push(new Error('Verified market data unavailable'));
        else recordUpdatedAt(updateTime);
      } catch (error) {
        clearTokenMetrics();
        failures.push(error);
      }
    } else {
      clearTokenMetrics();
      failures.push(tokenResult.reason);
    }

    if (usdResult.status === 'fulfilled') {
      try {
        const updateTime = renderKasUsd(usdResult.value);
        recordUpdatedAt(updateTime);
      } catch (error) {
        failures.push(error);
      }
    } else {
      markUnavailable('price-usd');
      markUnavailable('market-cap-usd');
      markUnavailable('volume-usd');
      failures.push(usdResult.reason);
    }

    if (chartResult.status === 'rejected') failures.push(chartResult.reason);
    updateTrackerStatus(failures);

    if (failures.length) {
      failureCount += 1;
      nextDelay = Math.min(180_000, REFRESH_MS * (2 ** Math.min(failureCount - 1, 3)));
      for (const error of failures) nextDelay = Math.max(nextDelay, errorRetryMs(error));
    } else {
      failureCount = 0;
    }

    updateInProgress = false;
    scheduleRefresh(nextDelay);
  }

  function scheduleRefresh(delay) {
    if (updateTimer) clearTimeout(updateTimer);
    retryNotBefore = Date.now() + delay;
    updateTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') refreshAll();
      else scheduleRefresh(Math.max(1_000, retryNotBefore - Date.now()));
    }, delay);
  }

  chartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const range = button.dataset.chartRange;
      if (!RANGES[range] || range === selectedRange) return;
      selectedRange = range;
      chartButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      refreshChart(range).catch(() => {
        // The chart status already communicates the unavailable state.
      });
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !updateInProgress) {
      if (updateTimer) clearTimeout(updateTimer);
      refreshAll();
    }
  });

  clearTokenMetrics();
  markUnavailable('price-usd');
  markUnavailable('market-cap-usd');
  markUnavailable('volume-usd');
  setUnavailableChart();
  refreshAll();
})();
