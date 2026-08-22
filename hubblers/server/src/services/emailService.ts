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

/**
 * Send notice to an organizer when their event is deleted by Admin due to reports/violations.
 */
export async function sendEventDeletionNoticeToOrganizer(
  to: string,
  organizerName: string,
  eventTitle: string,
  reason: string,
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Event Removal Notice to Organizer', to, [
      `Subject: Notice: Removal of Event "${eventTitle}" from HubblerX`,
      `Organizer: ${organizerName}`,
      `Event Title: ${eventTitle}`,
      `Reason / Admin Note: ${reason || 'Violation of community / event guidelines'}`,
    ])
    return
  }

  const templateParams = {
    to_name: organizerName || 'Organizer',
    to_email: to,
    subject: `Notice: Removal of Event "${eventTitle}" on HubblerX`,
    event_title: eventTitle,
    reason: reason || 'Event was removed following community guidelines review.',
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Event removal notice sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send event removal notice to ${to}:`, error)
  }
}

/**
 * Send confirmation/acknowledgment to the reporting student that action was taken on an organizer.
 */
export async function sendOrganizerBlockedNoticeToReporter(
  to: string,
  reporterName: string,
  organizerName: string,
  eventTitle: string,
  resolutionMessage: string,
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Report Acknowledgment & Action Notice to Student', to, [
      `Subject: Update on Your Report: Action Taken on Organizer`,
      `Student: ${reporterName}`,
      `Reported Event: ${eventTitle || 'N/A'}`,
      `Organizer: ${organizerName}`,
      `Action: The organizer account has been suspended/blocked following our investigation.`,
      `Admin Message: ${resolutionMessage || 'Thank you for helping keep HubblerX safe.'}`,
    ])
    return
  }

  const templateParams = {
    to_name: reporterName || 'Student',
    to_email: to,
    subject: `Update on Your Report: Action Taken on Organizer`,
    event_title: eventTitle || 'Reported Event',
    organizer_name: organizerName || 'Organizer',
    action_taken: 'Organizer account has been suspended.',
    resolution_message: resolutionMessage || 'Thank you for reporting this issue. We took appropriate moderation action.',
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Report resolution notice sent to student ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send report resolution notice to ${to}:`, error)
  }
}

/**
 * Send notice to an organizer that their account has been blocked/suspended.
 */
export async function sendOrganizerAccountBlockedNotice(
  to: string,
  organizerName: string,
  reason: string,
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Account Suspension Notice to Organizer', to, [
      `Subject: Important: Your HubblerX Organizer Account Has Been Suspended`,
      `Organizer: ${organizerName}`,
      `Reason: ${reason || 'Repeated community policy violations or reported fraudulent activities.'}`,
    ])
    return
  }

  const templateParams = {
    to_name: organizerName || 'Organizer',
    to_email: to,
    subject: `Important: Your HubblerX Organizer Account Has Been Suspended`,
    reason: reason || 'Violation of community and organizer conduct guidelines.',
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Account suspension notice sent to organizer ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send suspension notice to ${to}:`, error)
  }
}

/**
 * Send general report acknowledgment email to the student reporter.
 */
export async function sendReportAcknowledgmentEmail(
  to: string,
  reporterName: string,
  eventTitle: string,
  resolutionMessage: string,
) {
  const config = emailjsConfig()
  if (!config) {
    logSimulator('Report Acknowledgment to Student', to, [
      `Subject: HubblerX: Update on your event report`,
      `Student: ${reporterName}`,
      `Event Title: ${eventTitle}`,
      `Resolution: ${resolutionMessage || 'Your report has been reviewed and resolved by our moderation team.'}`,
    ])
    return
  }

  const templateParams = {
    to_name: reporterName || 'Student',
    to_email: to,
    subject: `HubblerX: Update on your report regarding "${eventTitle}"`,
    event_title: eventTitle,
    resolution_message: resolutionMessage || 'Our moderation team reviewed your report and took necessary measures.',
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Report acknowledgment sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send report acknowledgment to ${to}:`, error)
  }
}
