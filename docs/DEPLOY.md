# Deploy $0 — Neon + Vercel

## 1. Neon (DB)

1. Entra a Neon → tu proyecto → **Connection Details**.
2. Copia dos URLs:
   - **Directa** (sin `-pooler`): solo para migraciones.
   - **Pooled** (`-pooler`, con `?sslmode=require`): la que usa la app. Agrégale `&pgbouncer=true&connect_timeout=15`.
3. Desde tu PC, aplica migraciones con la directa:
   ```bash
   DATABASE_URL="<directa>" npx prisma migrate deploy
   ```
4. Crea tus usuarios reales (NO uses el seed en prod):
   ```bash
   DATABASE_URL="<directa>" npm run users:create -- --email dueno@taller.ve --rol admin --nombre "Dueño"
   ```
   Repite para recepción/técnicos. Sin `--password` genera una segura y la imprime una vez.
5. Activa **backups automáticos** (Neon los incluye) y anota el *Point-in-Time Recovery*.

## 2. Vercel (app)

1. Vercel → *Add New → Project* → importa `code-rmendoza/SistemaTecnico` → framework Next.js (detectado solo).
2. **Environment Variables** (Production):
   - `DATABASE_URL` = la **pooled** de Neon.
   - `JWT_SECRET` = cadena aleatoria ≥32 chars. Genera una: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
   - `TZ` = `America/Caracas` (opcional).
3. Deploy. Cada merge a `main` redeploya solo.

## 3. Verificación post-deploy (15 min)

- [ ] `https://tu-app.vercel.app/api/health` → `{"db":"up"}`
- [ ] Login con tu admin, sin errores en *Vercel → Logs*
- [ ] Crear cliente + OT + presupuesto de prueba; cobrarla; cerrar caja
- [ ] Portal: consultar la OT con código + cédula
- [ ] Confirmar que `demo1234` NO existe en prod (nunca corras el seed ahí)
- [ ] Cargar la tasa del día y abrir caja en 0/0

## 4. Operación semanal

- Revisar *Vercel → Logs* y *Neon → Monitoring* (gratis).
- Cada Dependabot PR: CI verde + merge (ya lo vienes haciendo).
- Backup: verifica un restore en staging al menos una vez (Neon branch).

## Rollback

- App: *Vercel → Deployments* → *Promote to Production* en el deployment anterior (< 2 min).
- DB: migraciones v1 no destructivas; restore desde backup de Neon si hace falta.
