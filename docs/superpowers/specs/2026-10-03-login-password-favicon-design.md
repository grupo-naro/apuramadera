# Login con email + contraseña, gestión de usuarios admin y favicon

Fecha: 2026-10-03

## Objetivo

1. Mostrar el logo de Apuro Madera como favicon.
2. Reemplazar el login por magic link (Resend) por email + contraseña.
3. Permitir al admin principal crear usuarios del panel. Su contraseña inicial es el DNI y deben cambiarla en el primer ingreso.

Todos los usuarios del panel tienen acceso completo. No hay roles.

## Decisiones

- Enfoque: provider **Credentials** de Auth.js v5 (sesión JWT, proxy edge-safe como hoy). Se descarta un login propio.
- Hash de contraseñas: `scrypt` de `node:crypto`, formato `salt:hash`, comparación con `timingSafeEqual`. Sin dependencias nuevas.
- Resend queda sólo para notificaciones; deja de participar del login.

## 1. Datos

Cambios en `User` (Prisma):

| Campo | Tipo | Nota |
|-------|------|------|
| `passwordHash` | `String?` | scrypt `salt:hash` |
| `dni` | `String? @unique` | sólo usuarios creados desde el panel |
| `mustChangePassword` | `Boolean @default(false)` | `true` al crear con DNI |
| `failedLogins` | `Int @default(0)` | intentos fallidos consecutivos |
| `lockedUntil` | `DateTime?` | bloqueo temporal |

`Account`, `Session` y `VerificationToken` dejan de usarse pero no se eliminan (evita migración destructiva). El adapter de Prisma se quita de `auth.ts`.

### Quién es admin

- **Admin principal:** email en `ADMIN_EMAILS`. Contraseña inicial en la env `ADMIN_INITIAL_PASSWORD`. En su primer login exitoso con esa clave se crea/actualiza su fila de `User` con el hash y `mustChangePassword = false`. Luego puede cambiarla desde el panel.
- **Usuarios creados:** cualquier `User` con `passwordHash` es admin.
- Excepción menor al principio "sin columna `role`": el acceso lo define existir en la tabla `User` con contraseña. Se documenta en `CLAUDE.md`.

## 2. Flujo de login

- `/login`: formulario email + contraseña. Se elimina `/login/verificar`.
- Error siempre genérico: "Email o contraseña incorrectos".
- Límite: 5 fallos consecutivos → `lockedUntil = now + 15 min`. Un login correcto resetea `failedLogins`.
- El JWT lleva `isAdmin` y `mustChangePassword`.
- `auth.config.ts` (usado por el proxy) sigue sin DB ni providers; el provider Credentials vive en `auth.ts`.
- Proxy: si `mustChangePassword` es `true`, todo `/admin/*` (salvo `/admin/cambiar-clave`) redirige a `/admin/cambiar-clave`.
- `/admin/cambiar-clave`: clave nueva + confirmación. Reglas: mínimo 8 caracteres, distinta del DNI y de la actual. Al guardar: actualiza hash, `mustChangePassword = false`, signOut y redirige a `/login` para reingresar con la clave nueva.

## 3. Gestión de usuarios

Nuevo módulo `src/core/modules/users/` con el layering estándar (`index.ts`, `users.actions.ts`, `users.use-cases.ts`, `users.repository.ts`, `users.schemas.ts`, `users.types.ts`).

- `/admin/usuarios`: lista de usuarios + formulario de alta (nombre, email, DNI).
- Alta: valida email y DNI únicos; clave inicial = DNI hasheado; `mustChangePassword = true`.
- Baja: no se puede eliminar al propio usuario ni al admin principal.
- Entrada nueva "Usuarios" en la navegación del admin.
- Fuera de alcance (YAGNI): reset de clave por el admin, roles/permisos, recuperación por email.

## 4. Favicon

- Generar `src/app/icon.png` y `src/app/apple-icon.png` desde `public/logo.png` (cuadrado, con fondo si el logo lo necesita).
- Eliminar `src/app/favicon.ico`.

## 5. Configuración y docs

- `.env.example`: agregar `ADMIN_INITIAL_PASSWORD`; `AUTH_RESEND_KEY` deja de ser requerida para el login.
- Actualizar `CLAUDE.md` (sección Auth y Environment).

## 6. Tests

- Unitarios: hash/verify de contraseña; lógica de bloqueo por intentos.
- E2E (Playwright): login correcto, login incorrecto, primer ingreso de usuario creado con cambio de clave obligatorio.

## Riesgos

- La clave inicial = DNI es débil: mitigado con bloqueo por intentos y cambio obligatorio en el primer ingreso.
- `ADMIN_INITIAL_PASSWORD` en env: recomendar cambiarla tras el primer ingreso.
