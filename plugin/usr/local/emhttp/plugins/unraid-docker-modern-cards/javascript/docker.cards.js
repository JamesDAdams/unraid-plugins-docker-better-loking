(function(){
  'use strict';
  const log = (...a)=>console.debug('[DockerCards]',...a);

  function parseContainerRow(row){
    const columns = row.querySelectorAll('td');
    if (!columns || columns.length < 10) return null;
    const appCell = columns[0];
    const img = appCell.querySelector('img');
    const logo = img ? img.src : '';
    const nameLink = appCell.querySelector('.appname a');
    const name = nameLink ? nameLink.textContent.trim() : (appCell.textContent||'').trim();
    const stateText = appCell.querySelector('.state');
    const state = stateText ? stateText.textContent.trim() : '';

    let updateText = 'other';
    const updateSpan = columns[1] && columns[1].querySelector('span');
    if (updateSpan) updateText = (updateSpan.textContent||'').trim().toLowerCase();

    const network = (columns[2]?.textContent||'').trim();
    const ip = (columns[3]?.textContent||'').trim();
    const port = (columns[4]?.textContent||'').trim();

    const cpuSpan = columns[7]?.querySelector('span[class^="cpu-"]');
    const memSpan = columns[7]?.querySelector('span[class^="mem-"]');
    const cpu = cpuSpan ? cpuSpan.textContent.trim() : '';
    const ram = memSpan ? memSpan.textContent.trim() : '';

    const autostartLabel = columns[8]?.querySelector('.switch-button-label.on, .switch-button-label.off');
    const autostart = autostartLabel ? autostartLabel.textContent.trim().toLowerCase() === 'on' : false;

    let uptime = '', created = '';
    const uptimeDiv = columns[9]?.querySelector('div');
    if (uptimeDiv){
      const text = uptimeDiv.textContent||'';
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

  function buildCardsFromTable(){
    const tbody = document.getElementById('docker_list');
    const table = tbody?.parentElement;
    if (!tbody || !table) return false;
    const rows = Array.from(tbody.querySelectorAll('tr.sortable'));
    if (rows.length === 0) return false;

    const containers = rows.map(parseContainerRow).filter(Boolean);

    // avoid duplicates
    let cardList = table.nextElementSibling;
    if (!(cardList && cardList.classList?.contains('docker-card-list'))){
      cardList = document.createElement('div');
      cardList.className = 'docker-card-list';
      containers.forEach(c => cardList.appendChild(createCard(c)));
      table.parentElement.insertBefore(cardList, table.nextSibling);
      // add action bar with toggle
      injectToggleBar(table, cardList);
    }

    // apply preferred view
    const pref = localStorage.getItem('udmc-view') || 'cards';
    setView(pref, table, cardList);
    return true;
  }

  function injectToggleBar(table, cardList){
    if (!table || !cardList) return;
    // insert a small action bar above the table (once)
    const container = table.parentElement;
    if (!container) return;
    const existing = container.querySelector('.udmc-actions');
    if (existing) return;
    const bar = document.createElement('div');
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

  function init(){
    // Run when DOM ready and also observe changes
    const tryBuild = ()=>{
      try {
        const ok = buildCardsFromTable();
        if (ok) return true;
      } catch(e){ log('error building cards', e); }
      return false;
    };

    if (!tryBuild()) setTimeout(tryBuild, 1200);

    const obs = new MutationObserver((muts)=>{
      for (const m of muts){
        if (m.type === 'childList') {
          if (tryBuild()) break;
        }
      }
    });
    obs.observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();