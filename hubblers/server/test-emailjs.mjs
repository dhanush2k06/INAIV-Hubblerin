import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import emailjs from '@emailjs/nodejs'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(serverDir, '.env') })

const config = {
  serviceId: process.env.EMAILJS_SERVICE_ID,
  templateId: process.env.EMAILJS_TEMPLATE_ID,
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
}
console.log('Using config:', {
  serviceId: config.serviceId,
  templateId: config.templateId,
  publicKey: config.publicKey,
  privateKey: config.privateKey ? '*** set ***' : 'MISSING',
})

const to = process.argv[2] || 'hubblersgroup@gmail.com'

const templateParams = {
  to_name: 'Test User',
  to_email: to,
  institution_name: 'Test College',
  admin_name: 'Test User',
  city: 'Test City',
  reply_to: 'hubblersgroup@gmail.com',
}

async function run() {
  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey, privateKey: config.privateKey },
    )
    console.log('SUCCESS! Status:', response.status, 'Text:', response.text)
    console.log('If the email still did not arrive, check the inbox of ' + to)
  } catch (error) {
    console.error('FAILED (full):', JSON.stringify(error, null, 2))
    const msg = JSON.stringify(error)
    if (msg.includes('non-browser')) {
      console.log('ACTION REQUIRED: Enable "Allow access from non-browser environments" at')
      console.log('https://dashboard.emailjs.com/admin/account/security')
    }
  }
}

run()
