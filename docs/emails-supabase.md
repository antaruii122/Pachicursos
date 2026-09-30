# Plantillas de email de Supabase Auth

Dónde se pegan: Supabase → Authentication → **Emails** → pestaña **Templates**
(`https://supabase.com/dashboard/project/baijfzqjgvgbfzuauroi/auth/templates`).

Los links pasan por nuestra ruta `/auth/confirm` (`src/app/auth/confirm/route.ts`), que valida el
`token_hash` con `verifyOtp` y después lleva a `next`. Formato verificado en
https://supabase.com/docs/guides/auth/auth-email-templates (`type=signup` para confirmar,
`type=recovery` para recuperar contraseña). `{{ .SiteURL }}` sale de Authentication → URL
Configuration → Site URL (hoy: `https://pachicursos.vercel.app`).

Colores escritos a mano a propósito: los clientes de correo no leen variables CSS. Son los mismos
tokens de `src/app/globals.css` (ciruela `#6e2b5e`, ciruela oscuro `#3b1433`, fondo `#fbf9fa`,
texto suave `#7d6676`).

---

## 1. Confirm signup (Confirmar registro)

**Subject:** `Confirma tu cuenta en Alimenta tu Fertilidad`

**Body (pegar completo, en modo "Source"):**

```html
<div style="background:#fbf9fa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#2a1c2d">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ede3e9;border-radius:18px;padding:32px 28px;text-align:center">
    <div style="width:40px;height:40px;margin:0 auto 10px;border-radius:50%;border:4px solid #6e2b5e"></div>
    <div style="font-family:Georgia,serif;font-size:20px;color:#6e2b5e">Alimenta tu Fertilidad</div>
    <div style="font-size:10px;letter-spacing:4px;color:#7d6676;margin-bottom:24px">CAMPUS</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;color:#3b1433;margin:0 0 10px">Confirma tu correo</h1>
    <p style="font-size:15px;line-height:1.6;color:#7d6676;margin:0 0 24px">
      Ya casi está. Toca el botón para confirmar tu cuenta y entrar a tu campus.
    </p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/cuenta/mis-cursos"
       style="display:inline-block;background:#6e2b5e;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:999px">
      Confirmar mi cuenta
    </a>
    <p style="font-size:12px;line-height:1.5;color:#7d6676;margin:28px 0 0">
      Si no creaste una cuenta, puedes ignorar este correo.
    </p>
  </div>
</div>
```

---

## 2. Reset password (Recuperar contraseña)

**Subject:** `Crea una contraseña nueva — Alimenta tu Fertilidad`

**Body:**

```html
<div style="background:#fbf9fa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#2a1c2d">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ede3e9;border-radius:18px;padding:32px 28px;text-align:center">
    <div style="width:40px;height:40px;margin:0 auto 10px;border-radius:50%;border:4px solid #6e2b5e"></div>
    <div style="font-family:Georgia,serif;font-size:20px;color:#6e2b5e">Alimenta tu Fertilidad</div>
    <div style="font-size:10px;letter-spacing:4px;color:#7d6676;margin-bottom:24px">CAMPUS</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;color:#3b1433;margin:0 0 10px">¿Olvidaste tu contraseña?</h1>
    <p style="font-size:15px;line-height:1.6;color:#7d6676;margin:0 0 24px">
      Toca el botón para crear una contraseña nueva.
    </p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/cuenta/actualizar-password"
       style="display:inline-block;background:#6e2b5e;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:999px">
      Crear contraseña nueva
    </a>
    <p style="font-size:12px;line-height:1.5;color:#7d6676;margin:28px 0 0">
      Si no pediste este cambio, ignora este correo: tu contraseña actual sigue igual.
    </p>
  </div>
</div>
```
