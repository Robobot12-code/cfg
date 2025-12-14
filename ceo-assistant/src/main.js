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
  const initCalendar = () => {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentMonthDays = 30; // Simulating a 30-day month
    const startDay = 2; // Starts on Wednesday (0=Mon, 1=Tue, 2=Wed...)

    // Empty slots for prev month
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-cell';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= currentMonthDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.textContent = day;

      if (day === 14) cell.classList.add('today'); // Mock 'Today'

      // Add Mock Events
      if ([5, 12, 14, 20, 24].includes(day)) {
        cell.classList.add('has-event');
        cell.title = "Réunions planifiées";
      }

      cell.addEventListener('click', () => {
        alert(`Ajouter un événement pour le ${day}?`);
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
      action.href = `mailto:${email}`;
      action.textContent = `Répondre à ${email.split('@')[0]}`;
    });
  });

  // --- Employee CRUD ---
  const employees = [
    { id: 1, name: "Alice Dubois", role: "CTO", status: "En ligne" },
    { id: 2, name: "Marc Dupont", role: "Head of Sales", status: "En réunion" },
    { id: 3, name: "Sophie Martin", role: "Lead Designer", status: "Absent(e)" }
  ];

  const renderEmployees = () => {
    const list = document.getElementById('employee-list');
    if (!list) return;
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
  };

  // Global scope for onclick delete
  window.deleteEmployee = (id) => {
    const idx = employees.findIndex(e => e.id === id);
    if (idx !== -1) {
      if (confirm('Confirmer la suppression ?')) {
        employees.splice(idx, 1);
        renderEmployees();
      }
    }
  };

  const addEmpBtn = document.getElementById('add-employee-btn');
  if (addEmpBtn) {
    addEmpBtn.addEventListener('click', () => {
      const name = prompt("Nom de l'employé:");
      if (name) {
        const role = prompt("Rôle:");
        employees.push({ id: Date.now(), name, role: role || 'Staff', status: 'Offline' });
        renderEmployees();
      }
    });
  }

  // --- Recruitment Logic ---
  const recruitBtn = document.querySelector('#hr-intelligence button');
  if (recruitBtn) {
    recruitBtn.addEventListener('click', () => {
      const currentRoles = employees.map(e => e.role).join(', ');
      alert(`Analyse des écarts basée sur 3 employés...\n\nRôles Actuels: ${currentRoles}\n\nMANQUANT: Senior Backend Engineer.\n\n-> Offre 'Senior Backend' créée avec succès.`);
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
    const handleSend = () => {
      const text = aiInput.value.trim();
      if (!text) return;
      addChatMsg(text, true);
      aiInput.value = '';

      // Simulate AI Typing
      setTimeout(() => {
        let response = "Requête traitée.";
        if (text.toLowerCase().includes('réunion')) response = "J'ai ajouté la réunion à votre agenda.";
        else if (text.toLowerCase().includes('mail')) response = "Brouillon préparé dans vos relations.";
        else if (text.toLowerCase().includes('recrute')) response = "J'ai scanné 5 nouveaux profils pertinents.";

        addChatMsg(response, false);
      }, 1000);
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

  // Status Toggles
  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      statusButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

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
