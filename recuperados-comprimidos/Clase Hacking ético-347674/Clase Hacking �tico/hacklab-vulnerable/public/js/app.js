// ============================================================
// app.js — SecureBank Frontend (Versión Vulnerable)
// ============================================================

const API = '';

// ── Utilidades ─────────────────────────────────────────────
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
    const el = document.getElementById('view-' + v);
    if (el) el.style.display = 'none';
    const nav = document.getElementById('nav-' + v);
    if (nav) nav.classList.remove('active');
  });
  const target = document.getElementById('view-' + name);
  if (target) target.style.display = '';
  const navTarget = document.getElementById('nav-' + name);
  if (navTarget) navTarget.classList.add('active');
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
  let currentUser = null;
  let allTransactions = [];

  async function initDashboard() {
    const res = await fetch('/api/user');
    if (!res.ok) { window.location.href = '/login.html'; return; }
    const data = await res.json();
    if (!data.success) { window.location.href = '/login.html'; return; }

    currentUser = data.user;

    // Topbar
    const topbarUser = document.getElementById('topbar-user');
    if (topbarUser) topbarUser.textContent = `Sesión: ${currentUser.fullname}`;

    // Logout button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.style.display = '';
      btnLogout.addEventListener('click', logout);
    }
    const sidebarLogout = document.getElementById('sidebar-logout-btn');
    if (sidebarLogout) sidebarLogout.addEventListener('click', logout);

    // Show admin section if admin
    if (currentUser.role === 'admin') {
      const adminSection = document.getElementById('admin-section');
      if (adminSection) adminSection.style.display = '';
    }

    // Greeting
    const greeting = document.getElementById('greeting');
    if (greeting) greeting.textContent = `Bienvenido, ${currentUser.fullname.split(' ')[0]}`;

    // Load transactions
    const txRes  = await fetch('/api/transactions');
    const txData = await txRes.json();
    allTransactions = Array.isArray(txData) ? txData : [];

    // Cards
    const balance = currentUser.balance;
    const income  = allTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = allTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

    const cardBalance = document.getElementById('card-balance');
    const cardIncome  = document.getElementById('card-income');
    const cardExpense = document.getElementById('card-expense');
    if (cardBalance) cardBalance.textContent = fmt(balance);
    if (cardIncome)  cardIncome.textContent  = fmt(income);
    if (cardExpense) cardExpense.textContent  = fmt(expense);

    // Recent table
    const recentBody = document.getElementById('table-recent');
    if (recentBody) {
      recentBody.innerHTML = allTransactions.slice(0, 5).map(buildTransactionRow).join('');
    }

    // All transactions table
    const allBody = document.getElementById('table-all-transactions');
    if (allBody) {
      allBody.innerHTML = allTransactions.map(buildTransactionRow).join('');
    }

    // Load comments
    await loadComments();

    // Admin users
    if (currentUser.role === 'admin') {
      await loadAdminUsers();
    }
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

    // ❌ VULNERABLE: innerHTML sin sanitización — permite XSS Stored
    container.innerHTML = list.map(c => `
      <div class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">${c.author}</span>
          <span class="comment-date">${fmtDate(c.created_at)}</span>
        </div>
        <div class="comment-body">${c.content}</div>
      </div>
    `).join('');
  }

  async function loadAdminUsers() {
    const res  = await fetch('/api/admin/users');
    if (!res.ok) return;
    const users = await res.json();
    const tbody = document.getElementById('table-admin-users');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.fullname}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'debit' : 'credit'}">${u.role}</span></td>
        <td style="text-align:right;font-weight:600;">${fmt(u.balance)}</td>
      </tr>
    `).join('');
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  }

  // Nav links
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showView(link.dataset.view);
    });
  });

  // Post comment
  const btnComment = document.getElementById('btn-comment');
  if (btnComment) {
    btnComment.addEventListener('click', async () => {
      const input = document.getElementById('comment-input');
      const content = input.value.trim();
      if (!content) return;

      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      input.value = '';
      await loadComments();
    });
  }

  initDashboard();
}
