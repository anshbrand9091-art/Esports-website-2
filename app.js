// ==== Utility & State ====
const $ = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));
const state = {
  role: localStorage.getItem('role') || 'guest',
  tab: 'upcoming',
  gameFilter: 'all',
  search: '',
  selectedTournamentId: null,
};

// ==== Demo Data ====
const tournaments = [
  {id:'t1', game:'bgmi', title:'BGMI Squad Showdown', date:'2025-08-24 18:00', fee:100, prize:10000, slots:[10,16], status:'upcoming', cover:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'},
  {id:'t2', game:'ff', title:'FF MAX Solo Blitz', date:'2025-08-23 20:00', fee:0, prize:0, slots:[20,48], status:'live', cover:'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop'},
  {id:'t3', game:'bgmi', title:'Weekend Cup', date:'2025-08-30 19:30', fee:50, prize:3000, slots:[16,16], status:'upcoming', cover:'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop'},
  {id:'t4', game:'ff', title:'Community Clash', date:'2025-08-15 17:00', fee:20, prize:1000, slots:[48,48], status:'completed', cover:'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop'}
];

const pointsDist = [
  {place:'1st', pts:15, kill:2},
  {place:'2nd', pts:12, kill:2},
  {place:'3rd', pts:10, kill:2},
  {place:'4th', pts:8, kill:2},
  {place:'5th', pts:6, kill:2},
  {place:'6-10th', pts:4, kill:2},
  {place:'11-16th', pts:1, kill:2},
];

const demoTeams = {
  t1:[{team:'Alpha', ign:'Aru#111', contact:'+91-90000-00000'}, {team:'Nexus', ign:'Shreya#777', contact:'discord:shreya#7777'}],
  t2:[{team:'Solo-Player-20', ign:'Rex', contact:'@rex'}, {team:'Solo-Player-21', ign:'Zed', contact:'@zed'}],
  t3:[], t4:[{team:'Winners', ign:'ProMax', contact:'@promax'}]
};

const posts = {
  bgmi:[
    {title:'BGMI 3.5 Patch Notes', excerpt:'New mode, weapon balance, improved anti-cheat.', img:'https://images.unsplash.com/photo-1542751371-0166a1f5d8f5?q=80&w=1200&auto=format&fit=crop'},
    {title:'This Weekend Cup Details', excerpt:'Lobby timings, map rotation, stream link.', img:'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1200&auto=format&fit=crop'}
  ],
  ff:[
    {title:'FF MAX Rank Push Tips', excerpt:'Sensitivity, HUD, character combos for headshots.', img:'https://images.unsplash.com/photo-1518085250887-2f903c200fee?q=80&w=1200&auto=format&fit=crop'},
    {title:'Solo Blitz Rules', excerpt:'No emulators, no teaming. Fair play only.', img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop'}
  ]
};

let pinned = [
  {id:'p1', text:'Weekend Cup registration closes Friday 6 PM.', when:'Aug 22, 2025'},
  {id:'p2', text:'Join Discord for scrims, daily rooms, giveaways.', when:'Aug 20, 2025'}
];

const roomSecrets = { bgmi:{id:'7788990', pass:'BG-55X'}, ff:{id:'114422', pass:'FF-9KX'} };

// ==== Init ====
document.addEventListener('DOMContentLoaded', () => {
  // year
  const y = new Date().getFullYear(); const yEl = document.getElementById('year'); if(yEl) yEl.textContent = y;

  // hero slider
  initHeroSlider();

  // tabs
  $$('.tab').forEach(btn=>btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    state.tab = btn.dataset.tab;
    renderTournaments();
  }));

  // filters
  const gameFilter = $('#gameFilter'); if(gameFilter){ gameFilter.addEventListener('change', e=>{ state.gameFilter = e.target.value; renderTournaments(); }); }
  const searchBox = $('#searchBox'); if(searchBox){ searchBox.addEventListener('input', e=>{ state.search = e.target.value.trim().toLowerCase(); renderTournaments(); }); }

  // login buttons
  const btnPlayer = $('#btnPlayer'); if(btnPlayer){ btnPlayer.addEventListener('click', ()=> window.location.href = 'player-login.html'); }
  const btnAdmin = $('#btnAdmin'); if(btnAdmin){ btnAdmin.addEventListener('click', ()=> window.location.href = 'admin-login.html'); }

  // admin-only badge
  if(state.role==='admin'){ const adm = $('#adminOnly_Pin'); if(adm){ adm.style.display='inline-flex'; adm.textContent='Admin Mode'; } }

  // render
  renderPinned();
  renderTournaments();
  renderPoints();
  renderPosts('bgmi');
  initRoomLock();

  // segmented posts
  $$('.seg').forEach(btn=>btn.addEventListener('click', ()=>{
    $$('.seg').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderPosts(btn.dataset.game);
  }))

  // modals
  const closeReg = $('#closeReg'); if(closeReg){ closeReg.addEventListener('click', ()=> toggleModal(false)); }
  const regForm = $('#regForm'); if(regForm){ regForm.addEventListener('submit', onSubmitRegistration); }
});

// ==== Renderers ====
function renderPinned(){
  const list = $('#pinnedList'); if(!list) return; list.innerHTML='';
  pinned.forEach(p=>{
    const li = document.createElement('li'); li.className='pinned__item';
    li.innerHTML = `<div class="pinned__meta">${p.when}</div><div>${p.text}</div>`;
    list.appendChild(li);
  });
  // In Admin mode, allow quick-add pinned note
  if(state.role==='admin'){
    const li = document.createElement('li'); li.className='pinned__item';
    li.innerHTML = `
      <div class="form" style="grid-template-columns:1fr auto;align-items:end">
        <div class="form__row">
          <label>New Announcement</label>
          <input id="pinInput" class="input" placeholder="Type announcement…" />
        </div>
        <button class="btn btn--primary" id="addPin">Pin</button>
      </div>`;
    $('#pinnedList').appendChild(li);
    $('#addPin').addEventListener('click', ()=>{
      const v = $('#pinInput').value.trim(); if(!v) return;
      pinned.unshift({id:'p'+(Date.now()), text:v, when:new Date().toLocaleDateString()});
      renderPinned();
    });
  }
}

function renderTournaments(){
  const grid = $('#tournamentGrid'); if(!grid) return; grid.innerHTML='';
  const items = tournaments.filter(t =>
    (state.tab==='all' || t.status===state.tab)
    && (state.gameFilter==='all' || t.game===state.gameFilter)
    && (!state.search || (t.title.toLowerCase().includes(state.search)))
  );
  items.forEach(t => {
    const percent = Math.min(100, Math.round((t.slots[0]/t.slots[1])*100));
    const card = document.createElement('article'); card.className='card';
    card.innerHTML = `
      <div class="card__media" style="background-image:url('${t.cover}')"></div>
      <div class="card__body">
        <h3 class="card__title">${t.title}</h3>
        <div class="meta">
          <div class="kv">${t.game.toUpperCase()}</div>
          <div class="kv">${new Date(t.date).toLocaleString()}</div>
          <div class="kv">Entry: ${t.fee? '₹'+t.fee : 'Free'}</div>
          <div class="kv">Prize: ${t.prize? '₹'+t.prize : '—'}</div>
          <div class="kv">Slots: ${t.slots[0]}/${t.slots[1]}</div>
          <div class="kv">Status: ${t.status}</div>
        </div>
        <div class="progress"><div class="progress__bar" style="width:${percent}%"></div></div>
        <div class="card__actions">
          ${t.status!=='completed' ? `<button class="btn btn--neon" data-join="${t.id}">Join Now</button>`:''}
          ${state.role==='admin' ? `<button class="btn" data-room="${t.id}">Set Room</button>`:''}
        </div>
      </div>`;
    grid.appendChild(card);
  });
  // bind buttons
  $$('button[data-join]').forEach(btn=>btn.addEventListener('click', ()=> openRegistration(btn.dataset.join)));
  $$('button[data-room]').forEach(btn=>btn.addEventListener('click', ()=> setRoomFor(btn.dataset.room)));
}

function renderPoints(){
  const tbody = $('#pointsTable'); if(!tbody) return; tbody.innerHTML='';
  pointsDist.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.place}</td><td>${r.pts}</td><td>+${r.kill}/kill</td>`;
    tbody.appendChild(tr);
  });
}

function renderTeams(tournamentId){
  const tbody = $('#teamsTable'); if(!tbody) return; tbody.innerHTML='';
  const list = demoTeams[tournamentId] || [];
  list.forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${t.team}</td><td>${t.ign}</td><td>${t.contact}</td>`;
    tbody.appendChild(tr);
  });
}

function renderPosts(game){
  const grid = $('#postsGrid'); if(!grid) return; grid.innerHTML='';
  (posts[game]||[]).forEach(p=>{
    const el = document.createElement('article'); el.className='card';
    el.innerHTML = `
      <div class="card__media" style="background-image:url('${p.img}')"></div>
      <div class="card__body">
        <h3 class="card__title">${p.title}</h3>
        <p class="muted">${p.excerpt}</p>
      </div>`;
    grid.appendChild(el);
  });
}

// ==== Registration ====
function openRegistration(tournamentId){
  const t = tournaments.find(x=>x.id===tournamentId); if(!t) return;
  state.selectedTournamentId = t.id;
  $('#regTournament').value = `${t.title}`;
  $('#entryFee').value = t.fee? `₹${t.fee}` : 'Free';
  toggleModal(true);
}

function toggleModal(show){
  const m = $('#regModal'); if(!m) return; m.classList.toggle('show', !!show); m.setAttribute('aria-hidden', show? 'false':'true');
}

function onSubmitRegistration(e){
  e.preventDefault();
  const tid = state.selectedTournamentId; if(!tid) return;
  const teamName = $('#teamName').value.trim();
  const ign = $('#captainIGN').value.trim();
  const contact = $('#contactInfo').value.trim();
  const txn = $('#txnId').value.trim();
  if(!teamName || !ign || !contact || !txn){ alert('Please fill all fields'); return; }
  demoTeams[tid] = demoTeams[tid] || []; demoTeams[tid].push({team:teamName, ign, contact});
  renderTeams(tid);
  toggleModal(false);
  alert('Registration successful! You will receive Room ID/Pass after verification.');
}

// ==== Room Lock & Admin Set ====
function initRoomLock(){
  const lock = $('#roomLock'); const content = $('#roomContent');
  if(state.role==='player' || state.role==='admin'){
    lock.textContent = 'Unlocked';
    content.hidden = false;
    $('#bgmiRoomId').textContent = roomSecrets.bgmi.id;
    $('#bgmiRoomPass').textContent = roomSecrets.bgmi.pass;
    $('#ffRoomId').textContent = roomSecrets.ff.id;
    $('#ffRoomPass').textContent = roomSecrets.ff.pass;
  }
}

function setRoomFor(tournamentId){
  if(state.role!=='admin'){ alert('Admin only'); return; }
  const game = tournaments.find(t=>t.id===tournamentId)?.game || 'bgmi';
  const id = prompt('Enter Room ID for '+game.toUpperCase());
  const pass = prompt('Enter Room Password for '+game.toUpperCase());
  if(!id || !pass) return;
  roomSecrets[game] = {id, pass};
  initRoomLock();
  alert('Room updated for '+game.toUpperCase());
}

// ==== Hero slider ====
function initHeroSlider(){
  const slides = $$('.hero__slide'); const dotsWrap = $('#heroDots');
  if(!slides.length || !dotsWrap) return;
  slides.forEach((_,i)=>{
    const d = document.createElement('div'); d.className='dot'+(i===0?' active':''); d.addEventListener('click',()=>go(i)); dotsWrap.appendChild(d);
  });
  let idx = 0; let timer = setInterval(()=>go((idx+1)%slides.length), 5000);
  function go(n){ idx = n; slides.forEach(s=>s.classList.remove('active')); slides[idx].classList.add('active');
    $$('.dot', dotsWrap).forEach((d,i)=>d.classList.toggle('active', i===idx)); }
}
