const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// ========================================================
// CONFIGURACIÓN INSEGURA - NO USAR EN PRODUCCIÓN
// ========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesión sin configuración segura
app.use(session({
  secret: 'CONFIGURAR_LOCALMENTE', // Secreto débil, hardcodeado
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: false, // Permite acceso desde JavaScript (vulnerable a XSS)
    secure: false
  }
}));

// ============================================================
// VULNERABILIDAD 1: SQL INJECTION en el login
// La query se construye concatenando strings directamente con
// los datos del usuario sin ningún tipo de validación.
// ============================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // ❌ INSEGURO: Concatenación directa de input del usuario en la query SQL
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = 'CONFIGURAR_LOCALMENTE'`;

  console.log(`[LOGIN] Query ejecutada: ${query}`);

  try {
    const user = db.prepare(query).get();

    if (user) {
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        balance: user.balance
      };
      res.json({ success: true, role: user.role, username: user.username });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }
  } catch (err) {
    // ❌ INSEGURO: Se expone el error de la base de datos al cliente
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// VULNERABILIDAD 2: XSS Stored en comentarios
// Los comentarios se guardan y recuperan sin sanitización,
// permitiendo que código HTML/JS malicioso sea ejecutado.
// ============================================================
app.post('/api/comments', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  const { content } = req.body;

  // ❌ INSEGURO: Guarda HTML/JS sin ninguna sanitización
  db.prepare("INSERT INTO comments (author, content, created_at) VALUES (?, ?, datetime('now'))").run(
    req.session.user.username,
    content // El contenido no se sanitiza
  );

  res.json({ success: true });
});

// ❌ INSEGURO: Devuelve comentarios con HTML sin sanitizar
app.get('/api/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments ORDER BY id DESC').all();
  res.json(comments);
});

// ============================================================
// VULNERABILIDAD 3: Sin rate limiting en ningún endpoint
// Un atacante puede hacer miles de intentos de login sin
// ningún tipo de restricción.
// ============================================================
app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false });
  }
  res.json({ success: true, user: req.session.user });
});

app.get('/api/transactions', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false });
  }
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC').all(req.session.user.id);
  res.json(transactions);
});

app.get('/api/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado.' });
  }
  const users = db.prepare('SELECT id, username, fullname, email, role, balance FROM users').all();
  res.json(users);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log('  ║   SecureBank - VERSION VULNERABLE          ║');
  console.log('  ║   Ejecutándose en http://0.0.0.0:3000      ║');
  console.log('  ║   [ATENCIÓN: Solo para fines educativos]   ║');
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
});
