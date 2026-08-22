import emailjs from '@emailjs/nodejs'

type RegistrationEmailDetails = Record<string, unknown>

interface EmailJSConfig {
  serviceId: string
  templateId: string
  publicKey: string
  privateKey: string
}

function emailjsConfig(): EmailJSConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY

  if (
    serviceId &&
    templateId &&
    publicKey &&
    privateKey &&
    serviceId !== 'your_emailjs_service_id' &&
    templateId !== 'your_emailjs_template_id' &&
    publicKey !== 'your_public_key' &&
    privateKey !== 'your_private_key'
  ) {
    return { serviceId, templateId, publicKey, privateKey }
  }
  return null
}

function logSimulator(title: string, to: string, extra: string[] = []) {
  console.log('\n==================================================')
  console.log(`📧 [EMAIL SIMULATOR] ${title}`)
  console.log(`To: ${to}`)
  extra.forEach((line) => console.log(line))
  console.log(
    'Notice: Configure EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY & EMAILJS_PRIVATE_KEY in server/.env to send live emails.',
  )
  console.log('==================================================\n')
}

export async function sendRegistrationEmail(
  to: string,
  details: RegistrationEmailDetails = {},
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Welcome Email', to, [
      `Subject: Welcome to HubblerX - Registration Details`,
      `Institution: ${String(details.institutionName ?? details.collegeName ?? 'N/A')}`,
      `Admin Name: ${String(details.adminName ?? details.fullName ?? 'N/A')}`,
    ])
    return
  }

  const templateParams = {
    to_name: String(details.adminName ?? details.fullName ?? ''),
    to_email: to,
    subject: 'Welcome to HubblerX - Registration Details',
    institution_name: String(details.institutionName ?? details.collegeName ?? 'N/A'),
    admin_name: String(details.adminName ?? details.fullName ?? 'N/A'),
    city: String(details.city ?? 'N/A'),
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Registration email sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    const err = error as { text?: string; message?: string } | null
    const detail =
      err?.text || err?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
    console.error(`[Email Service] Failed to send registration email to ${to}: ${detail}`)
  }
}

export async function sendEventRegistrationEmail(
  to: string,
  qrUrl: string,
  event: { title: string; location: string; startDate: string; endDate: string },
  registration: Record<string, unknown>,
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Event Registration Ticket Pass', to, [
      `Subject: Event Registration Confirmed - ${String(event.title)}`,
      `Event: ${String(event.title)} (${String(event.startDate)})`,
      `QR: ${qrUrl}`,
    ])
    return
  }

  const templateParams = {
    to_name: String(registration.name ?? ''),
    to_email: to,
    subject: `Event Registration Confirmed - ${String(event.title ?? 'INAIV Event')}`,
    event_title: String(event.title ?? ''),
    event_date: String(event.startDate ?? ''),
    event_end_date: String(event.endDate ?? ''),
    event_location: String(event.location ?? ''),
    reg_name: String(registration.name ?? 'N/A'),
    reg_email: String(registration.email ?? 'N/A'),
    reg_degree: String(registration.degree ?? 'N/A'),
    reg_branch: String(registration.branch ?? 'N/A'),
    reg_year: String(registration.year ?? 'N/A'),
    reg_college: String(registration.collegeName ?? 'N/A'),
    reg_phone: String(registration.phone ?? 'N/A'),
    qr_image: qrUrl,
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Event registration email sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    const err = error as { text?: string; message?: string } | null
    const detail =
      err?.text || err?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
    console.error(`[Email Service] Failed to send event email to ${to}: ${detail}`)
  }
}
