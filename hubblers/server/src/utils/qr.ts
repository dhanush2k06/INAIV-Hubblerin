import QRCode from 'qrcode'
import { uploadBufferToStorage } from '../firebase.js'

export async function createStudentQrCode(data: Record<string, string>, destination: string) {
  const buffer = await QRCode.toBuffer(JSON.stringify(data), { type: 'png', width: 360 })
  const dataUri = `data:image/png;base64,${buffer.toString('base64')}`
  try {
    const uploadedUrl = await uploadBufferToStorage(buffer, destination, 'image/png')
    if (uploadedUrl) {
      return uploadedUrl
    }
  } catch (err) {
    console.warn('[QR Generator] Firebase storage upload failed, using Data URI fallback:', err)
  }
  return dataUri
}

export async function createEventQrCode(data: Record<string, string>, destination: string) {
  const buffer = await QRCode.toBuffer(JSON.stringify(data), { type: 'png', width: 480 })
  const dataUri = `data:image/png;base64,${buffer.toString('base64')}`
  let url = dataUri
  try {
    const uploadedUrl = await uploadBufferToStorage(buffer, destination, 'image/png')
    if (uploadedUrl) {
      url = uploadedUrl
    }
  } catch (err) {
    console.warn('[QR Generator] Firebase storage upload failed, using Data URI fallback:', err)
  }
  return { buffer, url }
}
