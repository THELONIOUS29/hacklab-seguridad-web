const db = require('./database');

// Limpiar tablas
db.prepare('DELETE FROM transactions').run();
db.prepare('DELETE FROM comments').run();
db.prepare('DELETE FROM users').run();

// Insertar usuarios (contraseñas en texto plano - vulnerable)
const insertUser = db.prepare(
  'INSERT INTO users (username, password, fullname, email, role, balance) VALUES (?, ?, ?, ?, ?, ?)'
);

insertUser.run('admin',   'admin123',    'Administrador del Sistema',  'admin@securebank.com',   'admin', 0.00);
insertUser.run('jlopez',  'password',    'Jorge López Mendoza',        'jlopez@securebank.com',  'user',  15420.75);
insertUser.run('mgarcia', 'segura456',   'María García Ruiz',          'mgarcia@securebank.com', 'user',  8350.00);
insertUser.run('cperez',  'qwerty',      'Carlos Pérez Torres',        'cperez@securebank.com',  'user',  23100.50);
insertUser.run('amoreno', 'letmein',     'Andres Moreno Vega',         'amoreno@securebank.com', 'user',  4200.00);

// Insertar transacciones
const insertTx = db.prepare(
  'INSERT INTO transactions (user_id, type, description, amount, date) VALUES (?, ?, ?, ?, ?)'
);

// Jorge López
insertTx.run(2, 'credit', 'Transferencia recibida - Nómina',        3200.00, '2026-06-10');
insertTx.run(2, 'debit',  'Pago de servicios - Empresa de energía', -180.50, '2026-06-08');
insertTx.run(2, 'debit',  'Compra en línea - Tienda deportiva',     -340.00, '2026-06-05');
insertTx.run(2, 'credit', 'Depósito en efectivo',                    500.00, '2026-06-01');
insertTx.run(2, 'debit',  'Restaurante El Jardín',                   -65.25, '2026-05-30');

// María García
insertTx.run(3, 'credit', 'Transferencia recibida - Honorarios',    2500.00, '2026-06-09');
insertTx.run(3, 'debit',  'Arriendo mensual',                      -1200.00, '2026-06-01');
insertTx.run(3, 'debit',  'Supermercado Central',                   -245.80, '2026-05-28');

// Carlos Pérez
insertTx.run(4, 'credit', 'Transferencia recibida - Nómina',        4800.00, '2026-06-10');
insertTx.run(4, 'debit',  'Cuota préstamo vehicular',              -1100.00, '2026-06-05');
insertTx.run(4, 'debit',  'Seguro de salud',                        -420.00, '2026-06-03');

// Insertar comentarios de ejemplo
const insertComment = db.prepare(
  'INSERT INTO comments (author, content, created_at) VALUES (?, ?, ?)'
);

insertComment.run('jlopez',  'Excelente servicio al cliente, muy rápida la atención.', '2026-06-12 09:14:00');
insertComment.run('mgarcia', 'La app web funciona muy bien, fácil de usar.', '2026-06-11 14:32:00');
insertComment.run('cperez',  'Tuve un problema con una transferencia pero lo resolvieron en el día.', '2026-06-10 11:05:00');

console.log('Base de datos inicializada correctamente.');
console.log('Usuarios creados: admin, jlopez, mgarcia, cperez, amoreno');
process.exit(0);
