const express   = require('express');
const session   = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const bcrypt    = require('bcryptjs');
const he        = require('he');
const path      = require('path');
const db        = require('./database');

const app  = express();
const PORT = 4000;

// ============================================================
// PROTECCIÓN 1: Helmet — Headers de seguridad HTTP
// Agrega cabeceras como X-Content-Type-Options, X-Frame-Options,
// Content-Security-Policy, etc.
// ============================================================
app.use(helmet({
  // ✅ CSP: Bloquea scripts externos e inline — protección clave contra XSS
  contentSecurityPolicy: {
    useDefaults: false, // No usar defaults de Helmet (evita upgrade-insecure-requests)
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],          // Solo scripts del mismo origen (bloquea XSS inline)
      styleSrc:       ["'self'", "'unsafe-inline'"], // Permite estilos inline del HTML
      fontSrc:        ["'self'", 'data:'],
      imgSrc:        ["'self'", 'data:'],
      connectSrc:     ["'self'"],
      objectSrc:      ["'none'"],
      frameAncestors: ["'none'"]
      // Sin upgrade-insecure-requests — el lab corre en HTTP
    }
  },
  // Desactivar COEP para no bloquear recursos del mismo servidor
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesión correctamente configurada
app.use(session({
  secret: require('crypto').randomBytes(32).toString('hex'), // Secreto aleatorio en cada arranque
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,  // ✅ No accesible desde JavaScript
    secure: false,   // En producción real sería true (HTTPS)
    maxAge: 30 * 60 * 1000 // 30 minutos
  }
}));

// ============================================================
// PROTECCIÓN 2: Rate limiting en login
// Máximo 5 intentos por IP cada 15 minutos.
// ============================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { success: false, message: 'Demasiados intentos de acceso. Por favor espere 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================
// LOGIN SEGURO
// ============================================================
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Validación básica de input
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Datos de entrada inválidos.' });
  }

  // ✅ SEGURO: Query parametrizada — no hay concatenación de strings
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  if (!user) {
    // Tiempo de respuesta constante para evitar timing attacks
    await bcrypt.compare(password, '$2a$12$invalidHashToPreventTimingAttacks');
    return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
  }

  // ✅ PROTECCIÓN 3: Bloqueo de cuenta tras intentos fallidos
  if (user.locked) {
    return res.status(403).json({ success: false, message: 'Cuenta bloqueada. Contacte al administrador.' });
  }

  // ✅ SEGURO: Comparación de hash con bcrypt
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    const newAttempts = user.failed_attempts + 1;
    const shouldLock  = newAttempts >= 5;
    db.prepare('UPDATE users SET failed_attempts = ?, locked = ? WHERE id = ?').run(newAttempts, shouldLock ? 1 : 0, user.id);
    console.log(`[LOGIN] Intento fallido para "${username}" (${newAttempts}/5)${shouldLock ? ' — CUENTA BLOQUEADA' : ''}`);
    return res.status(401).json({ success: false, message: shouldLock ? 'Cuenta bloqueada por exceso de intentos.' : 'Credenciales incorrectas.' });
  }

  // Login exitoso: resetear intentos fallidos
  db.prepare('UPDATE users SET failed_attempts = 0, locked = 0 WHERE id = ?').run(user.id);

  req.session.user = { id: user.id, username: user.username, role: user.role, fullname: user.fullname, balance: user.balance };
  console.log(`[LOGIN] Acceso exitoso: ${user.username}`);
  res.json({ success: true, role: user.role });
});

// ============================================================
// COMENTARIOS SEGUROS
// ============================================================
app.post('/api/comments', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });

  const { content } = req.body;
  if (!content || typeof content !== 'string') return res.status(400).json({ success: false });

  // ✅ SEGURO: El contenido se escapa en el servidor con 'he'
  const safeContent = he.encode(content.trim().slice(0, 500));

  db.prepare('INSERT INTO comments (author, content, created_at) VALUES (?, ?, datetime("now"))').run(
    req.session.user.username,
    safeContent
  );
  res.json({ success: true });
});

app.get('/api/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments ORDER BY id DESC').all();
  res.json(comments);
});

app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  res.json({ success: true, user: req.session.user });
});

app.get('/api/transactions', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC').all(req.session.user.id);
  res.json(txs);
});

app.get('/api/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false });
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
  console.log('  ║   SecureBank - VERSION SEGURA              ║');
  console.log('  ║   Ejecutándose en http://0.0.0.0:4000      ║');
  console.log('  ║   Protecciones activas: SQLi | XSS | BF    ║');
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
});
