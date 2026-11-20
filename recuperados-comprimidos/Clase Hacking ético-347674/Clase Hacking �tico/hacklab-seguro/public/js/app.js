// ============================================================
// app.js — SecureBank Frontend (Versión Segura)
// ============================================================

const API = '';

function fmt(amount) {
  return '$ ' + Math.abs(amount).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d.replace(' ', 'T'));
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function showView(name) {
  ['dashboard','transactions','comments','admin'].forEach(v => {
    const el  = document.getElementById('view-' + v);
    if (el) el.style.display = 'none';
    const nav = document.getElementById('nav-' + v);
    if (nav) nav.classList.remove('active');
  });
  const t  = document.getElementById('view-' + name);
  if (t) t.style.display = '';
  const nt = document.getElementById('nav-' + name);
  if (nt) nt.classList.add('active');
}
function buildTransactionRow(tx) {
  return `<tr>
    <td>${fmtDate(tx.date)}</td>
    <td>${tx.description}</td>
    <td><span class="badge ${tx.type}">${tx.type === 'credit' ? 'Ingreso' : 'Egreso'}</span></td>
    <td style="text-align:right;font-weight:600;color:${tx.amount > 0 ? 'var(--success)' : 'var(--danger)'};">${tx.amount > 0 ? '+' : ''}${fmt(tx.amount)}</td>
  </tr>`;
}

// ── Login Page ──────────────────────────────────────────────
if (document.getElementById('login-form')) {
  const form    = document.getElementById('login-form');
  const alertEl = document.getElementById('alert-box');
  const btnEl   = document.getElementById('btn-login');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.className = 'alert';
    alertEl.style.display = 'none';
    btnEl.disabled = true;
    btnEl.textContent = 'Verificando...';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = '/dashboard.html';
      } else {
        alertEl.className = 'alert error';
        alertEl.textContent = data.message || 'Credenciales incorrectas.';
        alertEl.style.display = 'block';
        btnEl.disabled = false;
        btnEl.textContent = 'Ingresar';
      }
    } catch (err) {
      alertEl.className = 'alert error';
      alertEl.textContent = 'Error de conexión. Intente nuevamente.';
      alertEl.style.display = 'block';
      btnEl.disabled = false;
      btnEl.textContent = 'Ingresar';
    }
  });
}

// ── Dashboard Page ──────────────────────────────────────────
if (document.getElementById('view-dashboard')) {
  let currentUser  = null;
  let allTransactions = [];

  async function initDashboard() {
    const res = await fetch('/api/user');
    if (!res.ok) { window.location.href = '/login.html'; return; }
    const data = await res.json();
    if (!data.success) { window.location.href = '/login.html'; return; }

    currentUser = data.user;

    const topbarUser = document.getElementById('topbar-user');
    if (topbarUser) topbarUser.textContent = `Sesión: ${currentUser.fullname}`;

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) { btnLogout.style.display = ''; btnLogout.addEventListener('click', logout); }
    const sidebarLogout = document.getElementById('sidebar-logout-btn');
    if (sidebarLogout) sidebarLogout.addEventListener('click', logout);

    if (currentUser.role === 'admin') {
      const adminSection = document.getElementById('admin-section');
      if (adminSection) adminSection.style.display = '';
    }

    const greeting = document.getElementById('greeting');
    if (greeting) greeting.textContent = `Bienvenido, ${currentUser.fullname.split(' ')[0]}`;

    const txRes  = await fetch('/api/transactions');
    const txData = await txRes.json();
    allTransactions = Array.isArray(txData) ? txData : [];

    const income  = allTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = allTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

    const cardBalance = document.getElementById('card-balance');
    const cardIncome  = document.getElementById('card-income');
    const cardExpense = document.getElementById('card-expense');
    if (cardBalance) cardBalance.textContent = fmt(currentUser.balance || 0);
    if (cardIncome)  cardIncome.textContent  = fmt(income);
    if (cardExpense) cardExpense.textContent  = fmt(expense);

    const recentBody = document.getElementById('table-recent');
    if (recentBody) recentBody.innerHTML = allTransactions.slice(0, 5).map(buildTransactionRow).join('');

    const allBody = document.getElementById('table-all-transactions');
    if (allBody) allBody.innerHTML = allTransactions.map(buildTransactionRow).join('');

    await loadComments();
    if (currentUser.role === 'admin') await loadAdminUsers();
  }

  async function loadComments() {
    const res  = await fetch('/api/comments');
    const list = await res.json();
    const container = document.getElementById('comments-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.87rem;">No hay mensajes aún.</p>';
      return;
    }

    // ✅ SEGURO: textContent en lugar de innerHTML — el contenido ya viene escapado del servidor.
    // Nunca se ejecutará como HTML aunque contenga tags.
    const fragment = document.createDocumentFragment();
    list.forEach(c => {
      const item = document.createElement('div');
      item.className = 'comment-item';

      const meta = document.createElement('div');
      meta.className = 'comment-meta';

      const author = document.createElement('span');
      author.className = 'comment-author';
      author.textContent = c.author; // textContent: seguro

      const date = document.createElement('span');
      date.className = 'comment-date';
      date.textContent = fmtDate(c.created_at);

      const body = document.createElement('div');
      body.className = 'comment-body';
      body.textContent = c.content; // textContent: seguro — nunca ejecuta JS

      meta.appendChild(author);
      meta.appendChild(date);
      item.appendChild(meta);
      item.appendChild(body);
      fragment.appendChild(item);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }

  async function loadAdminUsers() {
    const res  = await fetch('/api/admin/users');
    if (!res.ok) return;
    const users = await res.json();
    const tbody = document.getElementById('table-admin-users');
    if (!tbody) return;
    tbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      [u.id, u.username, u.fullname, u.email].forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      const tdRole = document.createElement('td');
      const badge  = document.createElement('span');
      badge.className = `badge ${u.role === 'admin' ? 'debit' : 'credit'}`;
      badge.textContent = u.role;
      tdRole.appendChild(badge);
      tr.appendChild(tdRole);
      const tdBal = document.createElement('td');
      tdBal.style.textAlign  = 'right';
      tdBal.style.fontWeight = '600';
      tdBal.textContent = fmt(u.balance);
      tr.appendChild(tdBal);
      tbody.appendChild(tr);
    });
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  }

  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showView(link.dataset.view);
    });
  });

  const btnComment = document.getElementById('btn-comment');
  if (btnComment) {
    btnComment.addEventListener('click', async () => {
      const input   = document.getElementById('comment-input');
      const content = input.value.trim();
      if (!content) return;

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        input.value = '';
        await loadComments();
      }
    });
  }

  initDashboard();
}
