const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
  db.prepare('DELETE FROM transactions').run();
  db.prepare('DELETE FROM comments').run();
  db.prepare('DELETE FROM users').run();

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, fullname, email, role, balance) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // ✅ SEGURO: Las contraseñas se hashean con bcrypt (salt rounds = 12)
  const hashes = await Promise.all([
    bcrypt.hash('admin123',  12),
    bcrypt.hash('password',  12),
    bcrypt.hash('segura456', 12),
    bcrypt.hash('qwerty',    12),
    bcrypt.hash('letmein',   12)
  ]);

  insertUser.run('admin',   hashes[0], 'Administrador del Sistema',  'admin@securebank.com',   'admin', 0.00);
  insertUser.run('jlopez',  hashes[1], 'Jorge López Mendoza',        'jlopez@securebank.com',  'user',  15420.75);
  insertUser.run('mgarcia', hashes[2], 'María García Ruiz',          'mgarcia@securebank.com', 'user',  8350.00);
  insertUser.run('cperez',  hashes[3], 'Carlos Pérez Torres',        'cperez@securebank.com',  'user',  23100.50);
  insertUser.run('amoreno', hashes[4], 'Andres Moreno Vega',         'amoreno@securebank.com', 'user',  4200.00);

  const insertTx = db.prepare(
    'INSERT INTO transactions (user_id, type, description, amount, date) VALUES (?, ?, ?, ?, ?)'
  );

  insertTx.run(2, 'credit', 'Transferencia recibida - Nómina',        3200.00, '2026-06-10');
  insertTx.run(2, 'debit',  'Pago de servicios - Empresa de energía', -180.50, '2026-06-08');
  insertTx.run(2, 'debit',  'Compra en línea - Tienda deportiva',     -340.00, '2026-06-05');
  insertTx.run(2, 'credit', 'Depósito en efectivo',                    500.00, '2026-06-01');
  insertTx.run(2, 'debit',  'Restaurante El Jardín',                   -65.25, '2026-05-30');

  insertTx.run(3, 'credit', 'Transferencia recibida - Honorarios',    2500.00, '2026-06-09');
  insertTx.run(3, 'debit',  'Arriendo mensual',                      -1200.00, '2026-06-01');
  insertTx.run(3, 'debit',  'Supermercado Central',                   -245.80, '2026-05-28');

  insertTx.run(4, 'credit', 'Transferencia recibida - Nómina',        4800.00, '2026-06-10');
  insertTx.run(4, 'debit',  'Cuota préstamo vehicular',              -1100.00, '2026-06-05');
  insertTx.run(4, 'debit',  'Seguro de salud',                        -420.00, '2026-06-03');

  const insertComment = db.prepare(
    'INSERT INTO comments (author, content, created_at) VALUES (?, ?, ?)'
  );
  insertComment.run('jlopez',  'Excelente servicio al cliente, muy rápida la atención.', '2026-06-12 09:14:00');
  insertComment.run('mgarcia', 'La app web funciona muy bien, fácil de usar.', '2026-06-11 14:32:00');

  console.log('Base de datos segura inicializada correctamente.');
  console.log('Contraseñas hasheadas con bcrypt (12 rounds).');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
