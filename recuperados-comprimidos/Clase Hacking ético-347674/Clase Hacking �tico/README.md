# HackLab — Laboratorio Práctico de Hacking Ético

> **Aviso legal:** Este laboratorio es exclusivamente para fines educativos en el contexto de la materia de Seguridad Informática. Todos los ataques deben realizarse únicamente contra los sistemas de este laboratorio.

---

## Descripción

Sistema web bancario ficticio **SecureBank** en dos versiones para demostrar los tres ataques más comunes del OWASP Top 10:

| Ataque | Versión Vulnerable | Versión Segura |
|--------|--------------------|----------------|
| SQL Injection | Puerto 3000 | Puerto 4000 |
| XSS Stored | Puerto 3000 | Puerto 4000 |
| Brute Force | Puerto 3000 | Puerto 4000 |

---

## Requisitos previos

- Node.js v18 o superior instalado en el host Windows
- Kali Linux en VMware con adaptador de red en modo **Bridge** o **Host-Only**
- Conocer la IP del host desde Kali: `ip route show default`

---

## Instalación (solo la primera vez)

Abra PowerShell en la carpeta del proyecto:

```powershell
# Instalar dependencias versión vulnerable
cd hacklab-vulnerable
npm install
node seed.js

# Instalar dependencias versión segura
cd ../hacklab-seguro
npm install
node seed.js
```

---

## Iniciar el laboratorio

Haga doble clic en **`iniciar-laboratorio.bat`**

Esto abrirá dos ventanas de terminal:
- `SecureBank VULNERABLE` escuchando en `http://0.0.0.0:3000`
- `SecureBank SEGURO` escuchando en `http://0.0.0.0:4000`

Desde Kali, acceda con la IP del host:
```
http://HOST_IP:3000   ← Vulnerable
http://HOST_IP:4000   ← Segura
```

---

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| jlopez | password | Usuario |
| mgarcia | segura456 | Usuario |
| cperez | qwerty | Usuario |

---

## Estructura del proyecto

```
Clase Hacking ético/
├── hacklab-vulnerable/      # App vulnerable (puerto 3000)
├── hacklab-seguro/          # App segura (puerto 4000)
├── guia-ataques/            # Guías paso a paso de cada ataque
├── iniciar-laboratorio.bat  # Script de inicio simultáneo
└── README.md
```

---

## Guías de ataques

Consulte la carpeta `guia-ataques/` para las instrucciones detalladas de cada demo:

1. `01-sqli-ataque.md` — SQL Injection
2. `02-xss-ataque.md` — Cross-Site Scripting
3. `03-bruteforce-ataque.md` — Brute Force con Hydra
4. `comparacion-codigo.md` — Comparación de código vulnerable vs seguro
