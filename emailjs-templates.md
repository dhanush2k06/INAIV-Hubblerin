# INAIV EmailJS Template Content for HubblerX

These templates are ready to copy-paste into the **EmailJS Template Editor** (Template ID `template_el9y4aa`).

> **Important**: In the EmailJS template editor, you insert variables using `{{variable_name}}` (Mustache-style). EmailJS auto-replaces values from `template_params` sent by the code.

---

## Template: INAIV Combined (Registration + Event Ticket)

**Template ID:** `template_el9y4aa`

**SUBJECT**
```
{{subject}}
```

> **Important:** Use the single variable `{{subject}}` in the EmailJS **Subject** field. Do NOT use Mustache *section* tags like `{{#event_title}}` in the subject — EmailJS subjects do not support sections and this causes the "One or more dynamic variables are corrupted" error. The server sends the full subject via the `subject` template param.

**HTML CONTENT (paste into the EmailJS template editor)**

```html
<div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(2, 6, 23, 0.12);">

    <!-- INAIV Header -->
    <div style="background: linear-gradient(135deg, #064e3b, #065f46, #10b981); padding: 28px 24px; text-align: center;">
      <div style="font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #a7f3d0; font-weight: 700; margin-bottom: 8px;">INAIV</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Grow Beyond Your Studies</h1>
      <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">Discover · Join · Grow Through Activities</p>
    </div>

    <div style="padding: 32px;">

      <!-- Greeting -->
      <h2 style="color: #065f46; margin-top: 0; font-size: 20px;">Hello {{to_name}},</h2>
      <p style="color: #334155;">Thank you for being a part of the INAIV community. Here are your details:</p>

      <!-- Institution / College -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 8px 0 0 8px;">Institution</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{institution_name}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Email</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{to_email}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 0 0 0 8px;">City</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a; border-radius: 0 0 8px 0;">{{city}}</td>
        </tr>
      </table>

      <!-- Event Details (only if it's an event ticket) -->
      {{#event_title}}
      <h3 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px;">📅 Event Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 8px 0 0 8px;">Event</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a; font-weight: 600;">{{event_title}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Date</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{event_date}}{{#event_end_date}} - {{event_end_date}}{{/event_end_date}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 0 0 0 8px;">Location</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a; border-radius: 0 0 8px 0;">📍 {{event_location}}</td>
        </tr>
      </table>

      <h3 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px;">🎟️ Registration Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 8px 0 0 8px;">Name</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_name}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Email</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_email}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Degree</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_degree}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Branch</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_branch}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">Year</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_year}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%;">College</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_college}}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 40%; border-radius: 0 0 0 8px;">Phone</td>
          <td style="padding: 12px; border: 1px solid #d1fae5; color: #0f172a; border-radius: 0 0 8px 0;">{{reg_phone}}</td>
        </tr>
      </table>

      <!-- QR Pass Callout -->
      <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #065f46; font-weight: 800; font-size: 15px;">🎟️ Your INAIV QR Pass</p>
        <img src="{{qr_image}}" alt="Event QR Code" style="max-width: 220px; width: 100%; height: auto; border-radius: 8px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);" />
        <p style="margin: 12px 0 0; color: #047857; font-size: 13px;">Please present this <strong>QR code</strong> at the event entrance for check-in. Scan to attend — fast, secure &amp; eco-friendly.</p>
      </div>
      {{/event_title}}

      <!-- Login CTA -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:5173/login" style="background: #10b981; color: #022c22; text-decoration: none; padding: 14px 40px; border-radius: 999px; display: inline-block; font-weight: 800; font-size: 14px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);">Go to Login</a>
      </div>

      <!-- Footer -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center; margin-top: 24px;">
        <p style="margin: 0; color: #065f46; font-weight: 700; font-size: 13px;">INAIV — Discover, Join &amp; Grow Through Activities</p>
<p style="margin: 6px 0 0; color: #475569; font-size: 12px;">Need help? Contact us at <a href="mailto:hubblersgroup@gmail.com" style="color: #10b981; font-weight: 600; text-decoration: none;">hubblersgroup@gmail.com</a></p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">This is an automated message from INAIV. Please do not reply to this email.</p>

    </div>
  </div>
</div>
```

---

## EmailJS editor fields — what to fill

| EmailJS Field | What to fill | Why |
|---|---|---|
| **To Email** | `{{to_email}}` | The code sends the recipient's email in `to_email`. Using this variable sends to the actual user who registered. |
| **From Name** | `INAIV` | The display name recipients see as the sender. |
| **From Email** | `hubblersgroup@gmail.com` (or the email connected to your EmailJS service) | The sender address. Must be an address permitted by your EmailJS service. |
| **Use Default Email Address** | ✅ **Check it** (recommended) | Makes EmailJS use the service's default sender automatically, avoiding "from address not allowed" errors. |
| **Reply To** | `{{reply_to}}` or `hubblersgroup@gmail.com` (or leave blank) | The address recipients reply to. The code sends an optional `reply_to`. |

> **Important:** `From Email` must be an address connected to your EmailJS Email Service. If you set it to `hubblersgroup@gmail.com` but that account isn't linked, emails will be rejected. The simplest reliable setup is to **check "Use Default Email Address"** so EmailJS uses the registered sender automatically.

## Expected template variables (from the code)
| Variable | Type |
|---|---|
| `subject` | All emails — the full subject line for the EmailJS Subject field |
| `to_name`, `to_email`, `institution_name`, `admin_name`, `city`, `reply_to` | Registration |
| `event_title`, `event_date`, `event_end_date`, `event_location` | Event ticket |
| `reg_name`, `reg_email`, `reg_degree`, `reg_branch`, `reg_year`, `reg_college`, `reg_phone` | Event ticket |
| `qr_image` | Event ticket — the QR code's hosted URL used in `<img src="{{qr_image}}">` |

## Important notes
- **Branding**: Uses INAIV's emerald-green theme (`#10b981` / `#065f46`), the "Grow Beyond Your Studies" slogan, and `hubblersgroup@gmail.com`.
- The **QR code** is referenced by its hosted URL via the `{{qr_image}}` variable (shown in the `<img>` tag). This avoids email attachments (unsupported on the EmailJS free plan) and avoids embedding large base64 blobs that EmailJS can corrupt.
- This combined template uses Mustache sections (`{{#event_title}}...{{/event_title}}`) so the event block only appears on event-ticket emails and is hidden on registration emails.
- If you'd prefer **two separate templates** (one for registration, one for event tickets), I can update the code to support `EMAILJS_REG_TEMPLATE_ID` and `EMAILJS_EVENT_TEMPLATE_ID` — just let me know.
