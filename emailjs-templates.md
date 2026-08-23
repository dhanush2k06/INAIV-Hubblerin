# HubblerX — EmailJS Templates Guide

Two separate templates are used. Each handles a distinct purpose. Paste the HTML below into the correct template in the **EmailJS Template Editor**.

---

## ⚙️ EmailJS Field Setup (Apply to BOTH templates)

| Field | Value | Notes |
|---|---|---|
| **To Email** | `{{to_email}}` | ⚠️ REQUIRED — must be exactly `{{to_email}}` or emails will fail with "recipients address is empty" |
| **Subject** | `{{subject}}` | Dynamic subject sent by the backend per email type |
| **From Name** | `HubblerX / INAIV` | Display name the recipient sees |
| **Reply To** | `{{reply_to}}` | Set to `hubblersgroup@gmail.com` or leave blank |
| **From Email** | *(Default service address)* | Check **"Use Default Email Address"** in EmailJS |

---

## Template 1 — Event Registration & Welcome (`template_el9y4aa`)

**Used for:**
- Student & Organizer welcome / signup confirmation
- Event registration QR ticket pass

### HTML Content

```html
<div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(2, 6, 23, 0.08); border: 1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #064e3b, #065f46, #10b981); padding: 28px 24px; text-align: center;">
      <div style="font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #a7f3d0; font-weight: 700; margin-bottom: 6px;">INAIV · HUBBLERX</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Grow Beyond Your Studies</h1>
      <p style="color: #d1fae5; margin: 6px 0 0; font-size: 13px; letter-spacing: 1px;">Discover · Join · Grow Through Activities</p>
    </div>

    <div style="padding: 32px;">

      <!-- Greeting -->
      <h2 style="color: #065f46; margin-top: 0; font-size: 20px;">Hello {{to_name}},</h2>
      <p style="color: #334155;">Thank you for being a part of the INAIV community. Here are your details:</p>

      <!-- Registration / College Details -->
      {{#institution_name}}
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 38%; border-radius: 8px 0 0 8px;">Institution</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{institution_name}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Email</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{to_email}}</td>
        </tr>
        {{#city}}
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; border-radius: 0 0 0 8px;">City</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a; border-radius: 0 0 8px 0;">{{city}}</td>
        </tr>
        {{/city}}
      </table>
      {{/institution_name}}

      <!-- Event Details + QR Ticket -->
      {{#event_title}}
      <h3 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px; margin-top: 24px;">📅 Event Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 38%;">Event</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a; font-weight: 600;">{{event_title}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Date</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{event_date}} - {{event_end_date}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Location</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">📍 {{event_location}}</td>
        </tr>
      </table>

      <h3 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px;">🎟️ Registration Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46; width: 38%;">Name</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_name}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Email</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_email}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Degree</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_degree}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Branch</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_branch}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Year</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_year}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">College</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_college}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; font-weight: 700; color: #065f46;">Phone</td>
          <td style="padding: 10px 12px; border: 1px solid #d1fae5; color: #0f172a;">{{reg_phone}}</td>
        </tr>
      </table>

      <!-- QR Pass -->
      <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #065f46; font-weight: 800; font-size: 15px;">🎟️ Your INAIV QR Pass</p>
        <img src="{{qr_image}}" alt="Event QR Code" style="max-width: 220px; width: 100%; height: auto; border-radius: 8px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);" />
        <p style="margin: 12px 0 0; color: #047857; font-size: 13px;">Present this QR code at the event entrance for check-in.</p>
      </div>
      {{/event_title}}

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="http://localhost:5173" style="background: #10b981; color: #022c22; text-decoration: none; padding: 12px 36px; border-radius: 999px; display: inline-block; font-weight: 800; font-size: 14px; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.3);">Open HubblerX</a>
      </div>

      <!-- Footer -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center; margin-top: 24px;">
        <p style="margin: 0; color: #065f46; font-weight: 700; font-size: 13px;">INAIV — Discover, Join &amp; Grow Through Activities</p>
        <p style="margin: 6px 0 0; color: #475569; font-size: 12px;">Need help? <a href="mailto:hubblersgroup@gmail.com" style="color: #10b981; font-weight: 600; text-decoration: none;">hubblersgroup@gmail.com</a></p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">This is an automated message. Please do not reply directly.</p>

    </div>
  </div>
</div>
```

### Variables used by Template 1

| Variable | Description |
|---|---|
| `{{to_name}}` | Recipient name |
| `{{to_email}}` | Recipient email (**set in "To Email" field**) |
| `{{subject}}` | Full subject line (**set in "Subject" field**) |
| `{{institution_name}}` | College / institution name (registration) |
| `{{city}}` | City of institution |
| `{{event_title}}` | Event name (ticket) |
| `{{event_date}}`, `{{event_end_date}}` | Event dates |
| `{{event_location}}` | Event venue |
| `{{reg_name}}`, `{{reg_email}}`, etc. | Student registration details |
| `{{qr_image}}` | Hosted QR pass URL |
| `{{reply_to}}` | Reply address |

---

## Template 2 — Report & Moderation Acknowledgment (`template_rz39jqh`)

**Used for:**
- Student acknowledgment when a report is submitted
- Organizer notice when a report is filed against their event
- Event deletion notice to organizer
- Organizer account blocked notice
- Reporter acknowledgment when admin takes action (resolve / dismiss / block)

### HTML Content

```html
<div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a; background: #f1f5f9; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(2, 6, 23, 0.1); border: 1px solid #e2e8f0;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a, #1e293b, #334155); padding: 28px 24px; text-align: center;">
      <div style="font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #38bdf8; font-weight: 700; margin-bottom: 6px;">HUBBLERX TRUST &amp; SAFETY</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Community &amp; Event Moderation</h1>
      <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Keeping the HubblerX community safe and transparent</p>
    </div>

    <div style="padding: 32px;">

      <!-- Greeting -->
      <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Hello {{to_name}},</h2>

      <!-- Main Message Body -->
      <div style="background: #f8fafc; border-left: 4px solid #38bdf8; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 18px 0;">
        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.7;">{{message_body}}</p>
      </div>

      <!-- Case Details Table -->
      <h3 style="color: #334155; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 10px;">Case Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; width: 38%;">Case ID</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #0f172a; font-family: monospace; font-size: 13px;">{{report_id}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Event</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">{{event_title}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Category</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #e11d48; font-weight: 700;">{{report_category}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Status</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: 700;">Under Review — Trust &amp; Safety Team</td>
        </tr>
      </table>

      <!-- Footer -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; margin-top: 28px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #334155; font-size: 13px; font-weight: 700;">HubblerX Trust &amp; Safety Team</p>
        <p style="margin: 6px 0 0; color: #64748b; font-size: 12px;">Questions? Contact <a href="mailto:hubblersgroup@gmail.com" style="color: #0284c7; text-decoration: none; font-weight: 600;">hubblersgroup@gmail.com</a></p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">This is an automated message from HubblerX. Please do not reply directly to this email.</p>

    </div>
  </div>
</div>
```

### Variables used by Template 2

| Variable | Description |
|---|---|
| `{{to_name}}` | Recipient name (student or organizer) |
| `{{to_email}}` | Recipient email (**set in "To Email" field**) |
| `{{subject}}` | Full subject line (**set in "Subject" field**) |
| `{{message_body}}` | Main acknowledgment / notice text |
| `{{report_id}}` | Unique case / report ID |
| `{{event_title}}` | Reported event title |
| `{{report_category}}` | `SCAM`, `SPAM`, `FAKE_EVENT`, etc. |
| `{{reply_to}}` | Reply address |

---

## Summary — Which Template Handles What

| Email Type | Template Used |
|---|---|
| Welcome / Signup confirmation | `template_el9y4aa` |
| Event QR ticket pass | `template_el9y4aa` |
| Report submitted → Student acknowledgment | `template_rz39jqh` |
| Report submitted → Organizer notice | `template_rz39jqh` |
| Event deleted by admin → Organizer notice | `template_rz39jqh` |
| Organizer account blocked → Organizer notice | `template_rz39jqh` |
| Organizer blocked → Reporter acknowledgment | `template_rz39jqh` |
| Report resolved / dismissed → Reporter update | `template_rz39jqh` |
