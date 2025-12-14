import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-item');
  const statusButtons = document.querySelectorAll('.status-toggle button');
  const sectionIds = Array.from(sections).map(s => s.id);
  let currentIndex = 0;

  // --- View Manager ---
  const updateView = (index) => {
    // 1. Update Sections
    sections.forEach((section, idx) => {
      section.classList.remove('active', 'prev', 'next');

      if (idx === index) {
        section.classList.add('active');

        // Layout check
        const container = document.getElementById('content-container');
        container.classList.remove('wide-mode'); // No flow mode anymore

        if (section.id === 'summary') {
          container.classList.add('wide-mode');
        }

      } else if (idx < index) {
        section.classList.add('prev');
      } else {
        section.classList.add('next');
      }
    });

    // 2. Update Sidebar Active State
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.target === sectionIds[index]) {
        item.classList.add('active');
      }
    });

    // 3. Update Briefing Buttons
    if (document.body.classList.contains('briefing-mode')) {
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');

      if (prevBtn) {
        prevBtn.style.opacity = index === 0 ? '0' : '1';
        prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
      }

      if (nextBtn) {
        if (index === sections.length - 1) { // Last pages
          nextBtn.textContent = 'Terminer';
          nextBtn.classList.add('btn-finish');
        } else {
          nextBtn.textContent = 'Suivant';
          nextBtn.classList.remove('btn-finish');
        }
      }
    }

    currentIndex = index;
  };

  // Sidebar Listeners
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      const targetIndex = sectionIds.indexOf(targetId);
      if (targetIndex !== -1) updateView(targetIndex);
    });
  });

  // Briefing Mode Nav
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  const getNextBriefingIndex = (current) => {
    let next = current + 1;
    // Skip 'employees' (index 3 via check or ID)
    if (next < sections.length && sections[next].id === 'employees') {
      next++;
    }
    return next;
  };

  const getPrevBriefingIndex = (current) => {
    let prev = current - 1;
    // Skip 'employees'
    if (prev >= 0 && sections[prev].id === 'employees') {
      prev--;
    }
    return prev;
  };

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextIdx = getNextBriefingIndex(currentIndex);
      if (nextIdx < sections.length) {
        updateView(nextIdx);
      } else {
        document.body.classList.remove('briefing-mode');
        updateView(0); // Return to Dashboard
      }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prevIdx = getPrevBriefingIndex(currentIndex);
      if (prevIdx >= 0) updateView(prevIdx);
    });
  }

  // --- Calendar V2 Logic ---
  let tokenClient;
  let gapiInited = false;
  let gisInited = false;
  const CLIENT_ID = '166947616558-sfkc6u4ngd0tjcj39o5jv2t1m886dlso.apps.googleusercontent.com';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  const gapiLoaded = async () => {
    gapi.load('client', async () => {
      await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      maybeEnableButton();
    });
  };

  const gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later in event handler
    });
    gisInited = true;
    maybeEnableButton();
  };

  const maybeEnableButton = () => {
    if (gapiInited && gisInited) {
      const authBtn = document.getElementById('authorize_button');
      if (authBtn) {
        authBtn.style.opacity = '1';
        authBtn.onclick = handleAuthClick;
        authBtn.innerText = 'G Connecter Google';
      }
    }
  };

  // Poll for script load (simple approach) or use onload in HTML
  // Since we added scripts with async defer, we check availability
  const checkGoogleLibs = setInterval(() => {
    if (typeof gapi !== 'undefined' && !gapiInited) {
      gapiLoaded();
    }
    if (typeof google !== 'undefined' && !gisInited) {
      gisLoaded();
    }
    if (gapiInited && gisInited) clearInterval(checkGoogleLibs);
  }, 500);

  const handleAuthClick = () => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      document.getElementById('authorize_button').innerText = 'Connecté';
      document.getElementById('authorize_button').classList.add('btn-finish');
      await listUpcomingEvents();
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const listUpcomingEvents = async () => {
    try {
      // Start of today (midnight) to ensure we see all of today's events even if running mid-day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const request = {
        'calendarId': 'primary',
        'timeMin': today.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 50, // Increased to avoid birthdays burying other events
        'orderBy': 'startTime',
      };
      const response = await gapi.client.calendar.events.list(request);
      const events = response.result.items;

      renderBriefingEvents(events);
      initCalendar(events); // Re-render grid with events

    } catch (err) {
      console.error(err);
      alert('Erreur chargement calendrier: ' + err.message);
    }
  };

  const renderBriefingEvents = (events) => {
    const listContainer = document.querySelector('.agenda-briefing');
    // Keep header and button, clear rest
    const existingHeader = listContainer.querySelector('.flex-row');
    listContainer.innerHTML = '';
    listContainer.appendChild(existingHeader);

    // Filter out potential noise (Birthdays, Holidays) for the briefing view
    // Keeps critical business events visible
    const filteredEvents = events.filter(e => {
      const title = (e.summary || '').toLowerCase();
      // Skip common noise patterns
      if (title.includes('anniversaire') || title.includes('birthday') || title.includes('fête')) return false;
      return true;
    });

    if (!filteredEvents || filteredEvents.length === 0) {
      const msg = events.length > 0 ? "Aucun événement important (masqués: " + (events.length) + ")" : "Aucun événement trouvé.";
      listContainer.innerHTML += `<div class="glass-card text-center text-sm text-secondary">${msg}</div>`;
      return;
    }

    // Show top 5 filtered events to keep briefing clean
    filteredEvents.slice(0, 5).forEach(event => {
      let timeStr = '';
      let endTimeStr = '';
      const isAllDay = !event.start.dateTime;

      if (isAllDay) {
        timeStr = 'Toute la journée';
        endTimeStr = '';
      } else {
        const dateObj = new Date(event.start.dateTime);
        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (event.end.dateTime) {
          const endObj = new Date(event.end.dateTime);
          endTimeStr = ' - ' + endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }

      const div = document.createElement('div');
      div.className = 'glass-card mb-2';
      div.style.borderLeft = '3px solid var(--accent-blue)';

      const displayDate = new Date(event.start.dateTime || event.start.date);
      const isToday = new Date().toDateString() === displayDate.toDateString();
      const dayLabel = isToday ? '' : `<span class="text-xs text-secondary ml-2">(${displayDate.toLocaleDateString()})</span>`;

      div.innerHTML = `
        <div class="flex-row justify-between mb-1">
            <strong class="text-sm">${timeStr}${endTimeStr}</strong>
            <span class="tag">Google</span>
        </div>
        <span class="text-secondary">${event.summary} ${dayLabel}</span>
      `;
      listContainer.appendChild(div);
    });
  };

  const initCalendar = (realEvents) => {
    const useMocks = (typeof realEvents === 'undefined');
    const eventsToRender = useMocks ? [] : realEvents;

    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayObj = new Date();
    const currentMonthDays = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0).getDate(); // Real days in month
    const startDay = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).getDay(); // Real start day (0=Sun)

    // Adjust for Monday start (0=Mon for our grid headers implies we want Mon=0, but JS Day is Sun=0)
    // Headers: LUN MAR MER JEU VEN SAM DIM
    // JS: 0=Sun, 1=Mon ...
    // So Mon=1 -> 0, Sun=0 -> 6.
    let gridStart = startDay - 1;
    if (gridStart < 0) gridStart = 6;

    // Empty slots for prev month
    for (let i = 0; i < gridStart; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-cell';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= currentMonthDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.textContent = day;

      // Check if Today
      if (day === todayObj.getDate()) cell.classList.add('today');

      // Check Real Events
      // Simple check: does any event start on this day?
      const eventsForDay = eventsToRender.filter(e => {
        const d = new Date(e.start.dateTime || e.start.date);
        return d.getDate() === day && d.getMonth() === todayObj.getMonth();
      });

      if (eventsForDay.length > 0) {
        cell.classList.add('has-event');
        cell.title = eventsForDay.map(e => e.summary).join('\n');
        // Add tiny dot
        const dot = document.createElement('div');
        dot.style.cssText = "width: 4px; height: 4px; background: var(--status-orange); border-radius: 50%; display: inline-block; position: absolute; bottom: 4px; right: 4px;";
        cell.appendChild(dot);
      } else {
        // Keep Mock Events if using mocks
        if (useMocks) {
          if ([5, 12, 14, 20, 24].includes(day)) {
            cell.classList.add('has-event');
          }
        }
      }

      cell.addEventListener('click', () => {
        if (eventsForDay.length > 0) {
          alert(`Événements le ${day}:\n` + eventsForDay.map(e => `- ${e.summary}`).join('\n'));
        } else {
          alert(`Ajouter un événement pour le ${day}?`);
        }
      });

      grid.appendChild(cell);
    }
  };

  // --- Relations Hub Tabs ---
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      // Activate new
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.style.display = 'flex'; // Use flex for column layout
    });
  });

  // Relation Detail View
  document.querySelectorAll('.relation-card').forEach(card => {
    card.addEventListener('click', () => {
      const title = document.getElementById('detail-title');
      const body = document.getElementById('detail-body');
      const action = document.getElementById('detail-action');
      const email = card.dataset.email;

      // Highlight card
      document.querySelectorAll('.relation-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
      card.style.borderColor = 'var(--accent-blue)';

      title.textContent = card.querySelector('strong').textContent;
      body.textContent = card.dataset.detail;

      // FIX: Enable Action Button
      action.style.opacity = '1';
      action.style.pointerEvents = 'auto';
      action.onclick = () => {
        window.open(`mailto:${email}`, '_blank');
      };
      action.textContent = `Répondre à ${email.split('@')[0]}`;
    });
  });

  // --- Employee CRUD ---
  const renderEmployees = async () => {
    const list = document.getElementById('employee-list');
    if (!list) return;
    list.innerHTML = 'Chargement...';

    try {
      const res = await fetch('http://localhost:3000/api/employees');
      const employees = await res.json();
      list.innerHTML = '';

      employees.forEach(emp => {
        const div = document.createElement('div');
        div.className = 'glass-card flex-row justify-between';
        div.innerHTML = `
                 <div>
                    <strong>${emp.name}</strong>
                    <div class="text-xs text-secondary">${emp.role}</div>
                 </div>
                 <div class="flex-col items-end">
                    <span class="tag" style="background: rgba(255,255,255,0.05)">${emp.status}</span>
                    <button class="nav-item text-xs" style="padding: 2px 6px; color: var(--status-red);" onclick="deleteEmployee(${emp.id})">Supprimer</button>
                 </div>
              `;
        list.appendChild(div);
      });
    } catch (err) {
      list.innerHTML = 'Erreur de chargement';
      console.error(err);
    }
  };

  // Global scope for onclick delete
  window.deleteEmployee = async (id) => {
    if (confirm('Confirmer la suppression ?')) {
      await fetch(`http://localhost:3000/api/employees/${id}`, { method: 'DELETE' });
      renderEmployees();
    }
  };

  const addEmpBtn = document.getElementById('add-employee-btn');
  if (addEmpBtn) {
    addEmpBtn.addEventListener('click', async () => {
      const name = prompt("Nom de l'employé:");
      if (name) {
        const role = prompt("Rôle:");
        await fetch('http://localhost:3000/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role: role || 'Staff', status: 'Offline' })
        });
        renderEmployees();
      }
    });
  }

  // --- Recruitment Logic ---
  const recruitBtn = document.querySelector('#hr-intelligence button');
  if (recruitBtn) {
    recruitBtn.addEventListener('click', async () => {
      const btnText = recruitBtn.innerHTML;
      recruitBtn.innerHTML = 'Analyse en cours...';
      try {
        const res = await fetch('http://localhost:3000/api/chat/recruitment/analyze', { method: 'POST' });
        const data = await res.json();
        alert(`Analyse IA:\n\n${data.analysis}\n\nSUGGESTION: ${data.suggestion}`);
      } catch (e) {
        alert("Erreur lors de l'analyse IA");
      }
      recruitBtn.innerHTML = btnText;
    });
  }


  // --- AI Chat Logic ---
  const aiInput = document.getElementById('ai-input');
  const aiSend = document.getElementById('ai-send-btn');
  const aiHistory = document.getElementById('chat-history');

  const addChatMsg = (text, isUser = false) => {
    const p = document.createElement('p');
    p.style.marginBottom = '4px';
    if (isUser) {
      p.innerHTML = `<strong style="color: var(--accent-blue)">Vous:</strong> ${text}`;
    } else {
      p.innerHTML = `<strong>IA:</strong> ${text}`;
    }
    aiHistory.appendChild(p);
    aiHistory.scrollTop = aiHistory.scrollHeight;
  };

  if (aiSend && aiInput) {
    const handleSend = async () => {
      const text = aiInput.value.trim();
      if (!text) return;
      addChatMsg(text, true);
      aiInput.value = '';

      try {
        const res = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        addChatMsg(data.reply, false);
      } catch (e) {
        addChatMsg("Erreur de connexion avec l'IA.", false);
      }
    };

    aiSend.addEventListener('click', handleSend);
    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }


  // --- Init ---
  document.body.classList.add('briefing-mode');
  initCalendar();
  renderEmployees();


  // --- Dynamic Status Logic ---
  const initStatus = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/config/status');
      const data = await res.json();

      statusButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(data.status)) {
          btn.classList.add('active');
        }
      });
    } catch (e) { console.error("Status Load Error", e); }
  };
  initStatus();

  statusButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      statusButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Extract text (e.g. "Focus")
      const newStatus = btn.textContent.trim();
      await fetch('http://localhost:3000/api/config/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    });
  });

  // --- Relations Hub Tabs ---

  // Modal Logic (Existing HR)
  document.addEventListener('click', (e) => {
    // .. (Same modal logic as before) ..
    const card = e.target.closest('.hr-card');
    if (card) {
      const modal = document.getElementById('hr-modal');
      if (modal) {
        document.getElementById('modal-name').textContent = card.dataset.name;
        // ... (truncated simple fill for brevity, or full implementation below)
        document.getElementById('modal-role').textContent = card.dataset.role;
        document.getElementById('modal-score').textContent = card.dataset.score;
        document.getElementById('modal-tenure').textContent = card.dataset.tenure;
        document.getElementById('modal-desc').textContent = card.dataset.desc;
        modal.classList.add('active');
      }
    }

    if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
      const modal = document.getElementById('hr-modal');
      if (modal) modal.classList.remove('active');
    }
  });

  // Dashboard Task Logic
  const taskInput = document.getElementById('new-task-input');
  const taskBtn = document.getElementById('add-task-btn');
  if (taskBtn && taskInput) {
    const addTask = () => {
      if (taskInput.value.trim()) {
        const checklistContainer = document.getElementById('checklist-container');
        const d = document.createElement('div');
        d.innerHTML = `<div class="flex-row items-center"><div style="width: 20px; height: 20px; border: 1px solid var(--text-secondary); border-radius: 4px; margin-right: 8px;" onclick="this.style.background='var(--status-green)'"></div><span>${taskInput.value}</span></div>`;
        checklistContainer.appendChild(d.firstChild);
        taskInput.value = '';
      }
    };
    taskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  }

});
