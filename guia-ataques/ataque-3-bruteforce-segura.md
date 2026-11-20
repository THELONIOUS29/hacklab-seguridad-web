# Ataque 3 - Brute Force con Hydra
## Version segura - Puerto 4000

Host objetivo:

```text
192.168.0.10
```

URL segura:

```text
http://192.168.0.10:4000
```

Endpoint de login:

```text
/api/login
```

---

## 1. Verificar que la version segura responde

```bash
curl -i "http://192.168.0.10:4000/login.html"
```

---

## 2. Verificar que las wordlists existen

```bash
ls /tmp/users.txt /tmp/demo-passwords.txt
```

Si no existen, crearlas:

```bash
echo -e "admin\njlopez\nmgarcia\ncperez\namoreno" > /tmp/users.txt
echo -e "abc123\npassword\n123456\nadmin123\nqwerty\nletmein\nsegura456" > /tmp/demo-passwords.txt
```

---

## 3. Probar rate limiting con curl

```bash
for i in {1..8}; do
  echo "Intento $i"
  curl -s -i -X POST "http://192.168.0.10:4000/api/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=wrongpass" | grep -E "HTTP/|message|RateLimit|Retry-After"
  echo
done
```

Resultado esperado:

```text
HTTP/1.1 401 Unauthorized
```

Despues de varios intentos:

```text
HTTP/1.1 429 Too Many Requests
```

Mensaje esperado:

```json
{"success":false,"message":"Demasiados intentos de acceso. Por favor espere 15 minutos."}
```

---

## 4. Ejecutar Hydra contra un usuario

```bash
hydra -I \
  -l admin \
  -P /tmp/demo-passwords.txt \
  192.168.0.10 \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:1=401:S=role" \
  -s 4000 \
  -t 4 \
  -V
```

Resultado esperado:

```text
El ataque debe fallar o quedar bloqueado por rate limiting.
```

---

## 5. Ejecutar Hydra contra multiples usuarios

```bash
hydra -I \
  -L /tmp/users.txt \
  -P /tmp/demo-passwords.txt \
  192.168.0.10 \
  http-post-form \
  "/api/login:username=^USER^&password=^PASS^:1=401:S=role" \
  -s 4000 \
  -t 4 \
  -V
```

Resultado esperado:

```text
La aplicacion segura bloquea los intentos masivos.
```

---

## 6. Verificar bloqueo con curl

```bash
curl -i -X POST "http://192.168.0.10:4000/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Si el rate limiting esta activo, incluso con la contrasena correcta puede responder:

```json
{"success":false,"message":"Demasiados intentos de acceso. Por favor espere 15 minutos."}
```

---

## Conclusion

La version segura mitiga el ataque de fuerza bruta mediante rate limiting y bloqueo de cuenta. Despues de varios intentos fallidos, el servidor responde con `HTTP 429 Too Many Requests`, impidiendo que Hydra continue probando credenciales de forma ilimitada.
