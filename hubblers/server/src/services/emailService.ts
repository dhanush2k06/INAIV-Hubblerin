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

/** Config variant for report acknowledgment / moderation emails.
 *  Uses EMAILJS_REPORT_TEMPLATE_ID when set, falls back to EMAILJS_TEMPLATE_ID. */
function reportEmailjsConfig(): EmailJSConfig | null {
  const base = emailjsConfig()
  if (!base) return null
  const reportTemplateId = process.env.EMAILJS_REPORT_TEMPLATE_ID
  if (
    reportTemplateId &&
    reportTemplateId !== 'your_report_template_id' &&
    reportTemplateId !== base.templateId
  ) {
    return { ...base, templateId: reportTemplateId }
  }
  return base
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
 * Send acknowledgment email to student when they submit an event/organizer report.
 */
export async function sendReportSubmittedStudentAcknowledgment(
  to: string,
  reporterName: string,
  eventTitle: string,
  category: string,
  reason: string,
  reportId: string,
) {
  const config = reportEmailjsConfig()
  const subject = `HubblerX: Report Received for "${eventTitle}" [Case #${reportId.slice(0, 8)}]`

  if (!config) {
    logSimulator('Report Submission Acknowledgment to Student', to, [
      `Subject: ${subject}`,
      `Student Name: ${reporterName}`,
      `Reported Event: ${eventTitle}`,
      `Report Category: ${category}`,
      `Report Reason: ${reason}`,
      `Case ID: ${reportId}`,
      `Status: Under Review by Trust & Safety Team`,
    ])
    return
  }

  const templateParams = {
    to_name: reporterName || 'Student',
    to_email: to,
    subject,
    report_type: 'STUDENT_REPORT_SUBMITTED',
    report_id: reportId,
    event_title: eventTitle,
    report_category: category,
    report_reason: reason,
    message_body: `Thank you for bringing this to our attention. We have received your report regarding "${eventTitle}" (Category: ${category}). Our Trust & Safety team is actively investigating the matter to ensure the platform remains safe, transparent, and accurate.`,
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Student report acknowledgment sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send student report acknowledgment to ${to}:`, error)
  }
}

/**
 * Send notice/acknowledgment to the event organizer when a report is filed against their event listing.
 */
export async function sendReportSubmittedOrganizerNotice(
  to: string,
  organizerName: string,
  eventTitle: string,
  category: string,
  reasonSummary: string,
  reportId: string,
) {
  const config = reportEmailjsConfig()
  const subject = `HubblerX Notice: Event Listing Review for "${eventTitle}" [Case #${reportId.slice(0, 8)}]`

  if (!config) {
    logSimulator('Report Notice to Event Organizer', to, [
      `Subject: ${subject}`,
      `Organizer: ${organizerName}`,
      `Event Title: ${eventTitle}`,
      `Category: ${category}`,
      `Summary: ${reasonSummary}`,
      `Notice: Our Trust & Safety team is reviewing this listing for platform guideline compliance.`,
    ])
    return
  }

  const templateParams = {
    to_name: organizerName || 'Organizer',
    to_email: to,
    subject,
    report_type: 'ORGANIZER_REPORT_FILED_NOTICE',
    report_id: reportId,
    event_title: eventTitle,
    report_category: category,
    message_body: `A report has been submitted regarding your event listing "${eventTitle}" under category "${category}". Our Trust & Safety team conducts standard reviews to ensure all details, schedules, and disclosures comply with HubblerX Community Standards. No immediate action is required on your part unless contacted by our moderation team.`,
    reply_to: process.env.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
  }

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log(`[Email Service] Organizer report notice sent to ${to} (${response.status})`)
  } catch (error: unknown) {
    console.error(`[Email Service] Failed to send organizer report notice to ${to}:`, error)
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
  const config = reportEmailjsConfig()
  const subject = `Notice: Removal of Event "${eventTitle}" from HubblerX`

  if (!config) {
    logSimulator('Event Removal Notice to Organizer', to, [
      `Subject: ${subject}`,
      `Organizer: ${organizerName}`,
      `Event Title: ${eventTitle}`,
      `Reason / Admin Note: ${reason || 'Violation of community / event guidelines'}`,
    ])
    return
  }

  const templateParams = {
    to_name: organizerName || 'Organizer',
    to_email: to,
    subject,
    report_type: 'EVENT_DELETION_NOTICE',
    event_title: eventTitle,
    reason: reason || 'Event was removed following community guidelines review.',
    message_body: `Your event listing "${eventTitle}" has been removed from HubblerX following moderation review. Reason: ${reason || 'Violation of community / event guidelines.'}`,
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
  const config = reportEmailjsConfig()
  const subject = `Update on Your HubblerX Report: Action Taken on Organizer`

  if (!config) {
    logSimulator('Report Acknowledgment & Action Notice to Student', to, [
      `Subject: ${subject}`,
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
    subject,
    report_type: 'ORGANIZER_BLOCKED_NOTICE',
    event_title: eventTitle || 'Reported Event',
    organizer_name: organizerName || 'Organizer',
    action_taken: 'Organizer account has been suspended.',
    resolution_message: resolutionMessage || 'Thank you for reporting this issue. We took appropriate moderation action.',
    message_body: `Following our investigation into your report regarding "${eventTitle}", the organizer account (${organizerName}) has been suspended from the HubblerX platform. Thank you for helping keep our student community safe.`,
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
  const config = reportEmailjsConfig()
  const subject = `Important: Your HubblerX Organizer Account Has Been Suspended`

  if (!config) {
    logSimulator('Account Suspension Notice to Organizer', to, [
      `Subject: ${subject}`,
      `Organizer: ${organizerName}`,
      `Reason: ${reason || 'Repeated community policy violations or reported fraudulent activities.'}`,
    ])
    return
  }

  const templateParams = {
    to_name: organizerName || 'Organizer',
    to_email: to,
    subject,
    report_type: 'ACCOUNT_SUSPENSION_NOTICE',
    reason: reason || 'Violation of community and organizer conduct guidelines.',
    message_body: `Your HubblerX organizer account has been suspended following community reports and policy review. Reason: ${reason || 'Violation of community and organizer conduct guidelines.'}`,
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
  const config = reportEmailjsConfig()
  const subject = `HubblerX: Update on your report regarding "${eventTitle}"`

  if (!config) {
    logSimulator('Report Acknowledgment to Student', to, [
      `Subject: ${subject}`,
      `Student: ${reporterName}`,
      `Event Title: ${eventTitle}`,
      `Resolution: ${resolutionMessage || 'Your report has been reviewed and resolved by our moderation team.'}`,
    ])
    return
  }

  const templateParams = {
    to_name: reporterName || 'Student',
    to_email: to,
    subject,
    report_type: 'REPORT_RESOLUTION_NOTICE',
    event_title: eventTitle,
    resolution_message: resolutionMessage || 'Our moderation team reviewed your report and took necessary measures.',
    message_body: resolutionMessage || 'Our moderation team reviewed your report and took necessary measures.',
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
