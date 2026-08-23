// Quick EmailJS API test — run from hubblers/server directory:
// node test_report_email.cjs
require('dotenv').config()
const emailjs = require('@emailjs/nodejs')
const e = process.env

console.log('Service ID:', e.EMAILJS_SERVICE_ID)
console.log('Report Template:', e.EMAILJS_REPORT_TEMPLATE_ID)
console.log('Reply To:', e.EMAILJS_REPLY_TO)

if (!e.EMAILJS_SERVICE_ID || !e.EMAILJS_REPORT_TEMPLATE_ID) {
  console.error('Missing env vars!')
  process.exit(1)
}

emailjs.send(
  e.EMAILJS_SERVICE_ID,
  e.EMAILJS_REPORT_TEMPLATE_ID,
  {
    to_name: 'Test Student',
    to_email: e.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com',
    subject: 'HubblerX: Report Received [Case #abc12345]',
    report_id: 'abc123456789',
    event_title: 'Tech Fest 2025',
    report_category: 'SCAM',
    report_reason: 'Test reason for diagnosis.',
    message_body: 'Thank you for your report. Our Trust & Safety team is reviewing it.',
    reply_to: e.EMAILJS_REPLY_TO || 'hubblersgroup@gmail.com'
  },
  { publicKey: e.EMAILJS_PUBLIC_KEY, privateKey: e.EMAILJS_PRIVATE_KEY }
)
  .then(r => {
    console.log('\n✅ SUCCESS:', r.status, r.text)
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ ERROR status:', err.status)
    console.error('ERROR text:', err.text || err.message)
    console.error('Full error:', JSON.stringify(err, null, 2))
    process.exit(1)
  })
