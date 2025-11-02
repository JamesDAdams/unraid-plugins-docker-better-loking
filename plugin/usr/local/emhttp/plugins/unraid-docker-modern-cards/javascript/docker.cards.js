(function(){
  'use strict';
  console.log('[DockerCards] UDMC JS v12 loaded');

  function findDockerTbody(){
    const queries = [
      'tbody#docker_list',
      '#docker_list tbody',
      'table#docker_list tbody',
      'table#docker_table tbody',
      'table[id*="docker"] tbody',
      'table[data-view="docker"] tbody',
      'table tbody#docker'
    ];
    for (const q of queries){
      const el = document.querySelector(q);
      if (el) return el;
    }
    const tables = Array.from(document.querySelectorAll('table'));
    for (const t of tables){
      const headTxt = (t.querySelector('thead')?.textContent || '').toLowerCase();
      if (headTxt.includes('docker')) return t.querySelector('tbody') || null;
    }
    return null;
  }

  function parseContainerRow(row){
    const columns = row.querySelectorAll('td');
    if (!columns || columns.length === 0) return null;
    const appCell = columns[0] || row.querySelector('td');
    if (!appCell) return null;

    const img = appCell.querySelector('img');
    const logo = img?.src || '';
    const nameLink = appCell.querySelector('.appname a, a[href^="/docker/"], a');
    const name = (nameLink?.textContent || appCell.textContent || '').trim();

    const stateEl = appCell.querySelector('.state, .status, .started, .stopped') || row.querySelector('.state, .status');
    const state = (stateEl?.textContent || '').trim();

    let updateText = 'other';
    const updateEl = columns[1]?.querySelector('span, i, .label') || row.querySelector('[data-status], .label.update, td:nth-child(2) span');
    if (updateEl) updateText = (updateEl.textContent || '').trim().toLowerCase();

    const network = (columns[2]?.textContent || '').trim();
    const ip = (columns[3]?.textContent || '').trim();
    const port = (columns[4]?.textContent || '').trim();

    const resCell = columns[7] || row.querySelector('td:nth-last-child(3)');
    const cpu = resCell?.querySelector('span[class*="cpu"], .cpu')?.textContent?.trim() || '';
    const ram = resCell?.querySelector('span[class*="mem"], .memory, .ram')?.textContent?.trim() || '';

    const autostartLabel = row.querySelector('.switch-button-label.on, .switch-button-label.off, .autostart .on, .autostart .off');
    const autostart = autostartLabel ? /on/i.test(autostartLabel.textContent || '') : false;

    let uptime = '', created = '';
    const uptimeDiv = columns[9]?.querySelector('div') || row.querySelector('td:last-child div');
    if (uptimeDiv){
      const text = uptimeDiv.textContent || '';
      const upMatch = text.match(/Uptime:\s*(.+)/i);
      const createdMatch = text.match(/Created:\s*(.+)/i);
      uptime = upMatch ? upMatch[1].trim() : '';
      created = createdMatch ? createdMatch[1].trim() : '';
    }

    return {name, logo, state, updateText, network, ip, port, cpu, ram, autostart, uptime, created};
  }

  function createCard(container){
    let status = 'other';
    if (container.updateText.includes('up-to-date')) status = 'up-to-date';
    else if (container.updateText.includes('not available')) status = 'not available';

    let stateIcon = '<i class="fa fa-play"></i>';
    let stateText = 'Running';
    if (container.state && container.state.toLowerCase().includes('started')) {
      stateIcon = '<i class="fa fa-play"></i>';
      stateText = 'Running';
    } else {
      stateIcon = '<i class="fa fa-stop"></i>';
      stateText = 'Stopped';
    }

    const autoText = container.autostart ? 'ON' : 'OFF';

    const card = document.createElement('div');
    card.className = 'docker-card';
    card.setAttribute('data-status', status);
    card.setAttribute('data-autostart', container.autostart ? 'on' : 'off');

    card.innerHTML = `
      <div class="card-header">
        <img class="app-logo" src="${container.logo}" alt="${container.name}">
        <span class="card-title">${container.name}</span>
        <span class="badge">${container.updateText}</span>
      </div>
      <div class="card-state">${stateIcon} ${stateText}</div>
      <div class="card-body">
        <div><strong>Network:</strong> <span>${container.network}</span></div>
        <div><strong>IP:</strong> <span>${container.ip}</span></div>
        <div><strong>Port:</strong> <span>${container.port}</span></div>
        <div class="card-sep"></div>
        <div><strong>CPU:</strong> <span>${container.cpu}</span></div>
        <div><strong>RAM:</strong> <span>${container.ram}</span></div>
      </div>
      <div class="card-footer">
        <span><strong>Uptime:</strong> <span>${container.uptime}</span></span>
        <span><strong>Created:</strong> <span>${container.created}</span></span>
        <span><strong>Autostart:</strong> <span class="autostart">${autoText}</span></span>
      </div>
    `;
    return card;
  }

  function injectToggleBar(table, cardList){
    if (!table || !cardList) return;
    const container = table.parentElement;
    if (!container) return;
    let bar = container.querySelector('.udmc-actions');
    if (!bar){
      bar = document.createElement('div');
      bar.className = 'udmc-actions';
      bar.innerHTML = `
        <span style="opacity:.8;margin-right:8px;">Vue:</span>
        <button class="udmc-btn" data-view="cards">Cartes</button>
        <button class="udmc-btn" data-view="table">Table</button>
      `;
      container.insertBefore(bar, table);
      bar.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        const v = btn.getAttribute('data-view');
        localStorage.setItem('udmc-view', v);
        setView(v, table, cardList);
        highlightActive(bar, v);
      });
    }
    highlightActive(bar, localStorage.getItem('udmc-view') || 'cards');
  }

  function setView(view, table, cardList){
    const showCards = view !== 'table';
    if (table) table.style.display = showCards ? 'none' : '';
    if (cardList) cardList.style.display = showCards ? '' : 'none';
  }

  function highlightActive(bar, active){
    bar.querySelectorAll('button[data-view]').forEach(b=>{
      if (b.getAttribute('data-view') === active) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function buildCardsFromTable(){
    const tbody = findDockerTbody();
    const table = tbody?.closest('table');
    if (!tbody || !table) return false;

    const rows = Array.from(tbody.querySelectorAll('tr')).filter(tr => tr.querySelector('td'));
    if (rows.length === 0) return false;

    const containers = rows.map(parseContainerRow).filter(Boolean);
    const containerEl = table.parentElement;
    if (!containerEl) return false;

    let cardList = containerEl.querySelector('.docker-card-list');
    if (cardList) cardList.remove();

    cardList = document.createElement('div');
    cardList.className = 'docker-card-list';
    containers.forEach(c => cardList.appendChild(createCard(c)));
    table.parentElement.insertBefore(cardList, table.nextSibling);

    injectToggleBar(table, cardList);

    const pref = localStorage.getItem('udmc-view') || 'cards';
    setView(pref, table, cardList);
    return true;
  }

  function init(){
    console.log('UDMC init');
    const tryBuild = ()=>{ try { return buildCardsFromTable(); } catch(e){ console.error('[DockerCards] build error', e); return false; } };
    if (!tryBuild()) setTimeout(tryBuild, 1200);

    const obs = new MutationObserver(()=>{ tryBuild(); });
    obs.observe(document.documentElement, {childList:true, subtree:true});

    let attempts = 0;
    const iv = setInterval(()=>{
      if (tryBuild() || ++attempts > 20) clearInterval(iv);
    }, 1500);

    window.addEventListener('hashchange', tryBuild);
    window.addEventListener('popstate', tryBuild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();