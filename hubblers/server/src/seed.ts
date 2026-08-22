import { db } from './firebase.js'

const events = [
  { title: 'Campus Tech Fest', description: 'Hands-on workshops, live demos, and industry speaker sessions for students and colleges.', longDescription: 'Explore the future of technology with hands-on sessions in robotics, cloud computing, and AI. Includes networking lunch and swag bags for all participants.', location: 'North Campus Auditorium', startDate: 'July 18, 2026', endDate: 'July 18, 2026', xpReward: 50 },
  { title: 'Leadership Summit', description: 'Connect with college leaders, build networks, and unlock credit-earning opportunities.', longDescription: 'A day dedicated to developing leadership skills. Featured panels with alumni and industry leaders on management and entrepreneurship.', location: 'Central Lecture Hall', startDate: 'August 2, 2026', endDate: 'August 2, 2026', xpReward: 50 },
  { title: 'Career Sprint', description: 'Competitive events, resume clinics, and employer panels to accelerate student careers.', longDescription: 'Prepare for your dream job. Mock interviews, resume workshops, and direct interaction with HR representatives from top firms.', location: 'Innovation Center', startDate: 'September 12, 2026', endDate: 'September 12, 2026', xpReward: 75 },
  { title: 'Sustainability Workshop', description: 'Learn about eco-friendly practices and contribute to campus sustainability initiatives.', longDescription: 'A hands-on workshop focused on sustainable living, recycling techniques, and community gardening. Participate in a campus-wide clean-up drive.', location: 'Campus Green Hub', startDate: 'October 5, 2026', endDate: 'October 5, 2026', xpReward: 40 },
  { title: 'Art & Culture Showcase', description: 'Celebrate creativity with student art exhibits, musical performances, and cultural displays.', longDescription: 'An evening dedicated to showcasing the diverse talents of our students. Enjoy live music, poetry readings, and an exhibition of visual arts.', location: 'University Art Gallery', startDate: 'November 20, 2026', endDate: 'November 20, 2026', xpReward: 30 },
  { title: 'Global Hackathon 2026', description: '48-hour coding marathon to solve real-world problems with prizes worth $10,000.', longDescription: 'Join hundreds of developers, designers, and entrepreneurs to build innovative solutions. Mentorship from top tech companies provided.', location: 'Tech Hub Main Hall', startDate: 'December 5, 2026', endDate: 'December 7, 2026', xpReward: 100 },
  { title: 'Inter-College Music Fest', description: 'A battle of bands and solo performances from across the city.', longDescription: 'Experience a night of musical excellence. Includes rock, classical, and pop performances. Food stalls and merchandise available.', location: 'Open Air Theater', startDate: 'January 15, 2027', endDate: 'January 15, 2027', xpReward: 35 },
  { title: 'Alumni Networking Dinner', description: 'Exclusive opportunity to meet and network with distinguished alumni.', longDescription: 'Build professional connections and gain insights from successful alumni across various industries. Formal attire required.', location: 'Grand Ballroom', startDate: 'February 10, 2027', endDate: 'February 10, 2027', xpReward: 45 },
  { title: 'Photography Masterclass', description: 'Learn the secrets of professional photography from award-winning experts.', longDescription: 'Covering lighting, composition, and post-processing techniques. Bring your DSLR or mirrorless camera for hands-on practice.', location: 'Studio A, Arts Block', startDate: 'March 5, 2027', endDate: 'March 5, 2027', xpReward: 40 },
  { title: 'National Debate Championship', description: 'Top debaters from across the country compete on pressing global issues.', longDescription: 'Witness high-level intellectual discourse. Prizes for best speaker and best team. Refreshments provided throughout the event.', location: 'Senate Hall', startDate: 'April 22, 2027', endDate: 'April 24, 2027', xpReward: 60 },
  { title: 'Annual Sports Meet', description: 'Three days of track, field, and team sports competitions.', longDescription: 'Participate or cheer for your favorite teams in football, basketball, and athletics. Opening ceremony starts at 8 AM.', location: 'College Sports Complex', startDate: 'May 12, 2027', endDate: 'May 14, 2027', xpReward: 55 },
  { title: 'International Film Festival', description: 'Screening of award-winning independent films from around the world.', longDescription: 'A curated selection of world cinema followed by Q&A sessions with directors and critics. Free entry for students.', location: 'Auditorium 2', startDate: 'June 20, 2027', endDate: 'June 20, 2027', xpReward: 30 },
  { title: 'Poetry Slam Night', description: 'A platform for spoken word poets to share their voice and creativity.', longDescription: 'Open mic for poets followed by a judged slam. Themes of identity, love, and social change are encouraged.', location: 'The Coffee Lab', startDate: 'July 8, 2027', endDate: 'July 8, 2027', xpReward: 25 },
  { title: 'Startup Pitch Competition', description: 'Pitch your business ideas to a panel of investors and venture capitalists.', longDescription: 'Winners receive seed funding and incubation support. Prepare a 5-minute pitch deck and be ready for tough questions.', location: 'Entrepreneurship Cell', startDate: 'August 18, 2027', endDate: 'August 18, 2027', xpReward: 80 },
  { title: 'Yoga & Mindfulness Retreat', description: 'A peaceful morning of yoga, meditation, and mental health workshops.', longDescription: 'Reconnect with yourself. Guided meditation sessions and yoga for all levels. Bring your own mat and water bottle.', location: 'Lakeside Gardens', startDate: 'September 10, 2027', endDate: 'September 10, 2027', xpReward: 25 },
  { title: 'Algorithm Coding Challenge', description: 'Competitive programming contest for algorithm enthusiasts.', longDescription: 'Solve complex algorithmic problems within 3 hours. Top scorers advance to the regional finals. Individual participation only.', location: 'Computer Lab 4', startDate: 'October 14, 2027', endDate: 'October 14, 2027', xpReward: 70 },
]

async function seed() {
  if (!db) {
    console.error('Firestore is not initialized. Cannot seed.')
    process.exit(1)
  }

  const col = db.collection('events')
  const existing = await col.limit(1).get()
  if (!existing.empty) {
    console.log('Events already seeded. Skipping.')
    return
  }

  const batch = db.batch()
  for (const ev of events) {
    const ref = col.doc()
    batch.set(ref, { ...ev, createdAt: new Date().toISOString() })
  }
  await batch.commit()
  console.log(`Seeded ${events.length} events into Firestore.`)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
