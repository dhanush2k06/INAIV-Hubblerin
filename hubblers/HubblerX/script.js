// Supabase Configuration - Found in Project Settings > API
const SUPABASE_URL = 'https://wadwdorjawsshfgelmzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZHdkb3JqYXdzc2hmZ2VsbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjQ2MjEsImV4cCI6MjA5MDc0MDYyMX0.X9nl_Wo6Sf3RAI1m7F7Ulse47bZsScFg-JL2JhxhE1c'; // Copy the 'anon' 'public' key from Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth State Listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateNavbar(session);
});

async function updateNavbar(session) {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    if (session) {
        const user = session.user;
        const fullName = user.user_metadata.full_name || user.email.split('@')[0];
        const initial = fullName.charAt(0);

        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="events.html">Browse</a></li>
            <li>
                <a href="dashboard.html" class="user-profile">
                    <div class="profile-img">${initial}</div>
                    <span>${fullName}</span>
                </a>
            </li>
            <li><a href="#" id="logoutBtn" style="color: #ff4757; font-weight: 600;">Logout</a></li>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    } else {
        // Show login/signup links when logged out
        const isLoginPage = window.location.pathname.includes('login.html');
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="events.html">Browse</a></li>
            <li class="btn-login"><a href="${isLoginPage ? 'signup.html' : 'login.html'}" style="color: white;">${isLoginPage ? 'Sign Up' : 'Login'}</a></li>
        `;
    }
}

const events = [
    { id: 1, title: "AI Ethics Symposium 2026", category: "symposium", date: "Oct 12", price: "Free" },
    { id: 2, title: "React & Next.js Workshop", category: "workshop", date: "Nov 05", price: "$10" },
    { id: 3, title: "Bio-Medical Conference", category: "symposium", date: "Dec 01", price: "$25" },
    { id: 4, title: "Global Health Summit", category: "symposium", date: "Jan 15", price: "$50" },
    { id: 5, title: "Web Dev Bootcamp", category: "workshop", date: "Feb 10", price: "$99" },
    { id: 6, title: "Creative Writing Masterclass", category: "workshop", date: "Mar 05", price: "Free" },
    { id: 7, title: "Data Science Summit", category: "symposium", date: "Apr 20", price: "$45" },
    { id: 8, title: "Mobile App Design", category: "workshop", date: "May 12", price: "$15" },
    { id: 9, title: "Cybersecurity Forum", category: "symposium", date: "Jun 08", price: "Free" },
    { id: 10, title: "Python for Beginners", category: "workshop", date: "Jul 14", price: "$20" },
    { id: 11, title: "UI/UX Trends 2026", category: "symposium", date: "Aug 05", price: "$30" },
    { id: 12, title: "Machine Learning Lab", category: "workshop", date: "Sep 18", price: "$55" },
    { id: 13, title: "Cloud Computing Expo", category: "symposium", date: "Oct 05", price: "$40" },
    { id: 14, title: "JS Performance Workshop", category: "workshop", date: "Nov 20", price: "$15" },
    { id: 15, title: "AI in Medicine", category: "symposium", date: "Dec 10", price: "Free" },
];

const eventGrid = document.getElementById('eventGrid');
const searchInput = document.getElementById('eventSearch');
let currentCategory = 'all';

// Booking Modal Setup
const modalHTML = `
    <div id="bookingModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <div id="modalBody">
                <h2>Reserve Your Seat</h2>
                <p style="color: #636e72; margin-bottom: 1.5rem;">Fill in your details to receive your entry pass.</p>
                <form id="registrationForm" onsubmit="handleRegistration(event)">
                    <div class="form-group">
                        <label>Student Name</label>
                        <input type="text" id="studentName" required placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label>College Email</label>
                        <input type="email" id="studentEmail" required placeholder="john@university.edu">
                    </div>
                    <div class="form-group">
                        <label>Student ID / Roll No</label>
                        <input type="text" id="studentId" required placeholder="CS2026-001">
                    </div>
                    <button type="submit" class="auth-btn">Confirm Reservation</button>
                </form>
            </div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Auth elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function displayEvents(filteredEvents) {
    if (filteredEvents.length === 0) {
        eventGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #636e72;">
            <h3>No events found matching your search.</h3>
        </div>`;
        return;
    }
    eventGrid.innerHTML = filteredEvents.map(event => `
        <div class="card">
            <div class="card-content">
                <span class="card-tag">${event.category.toUpperCase()}</span>
                <h3>${event.title}</h3>
                <p>📅 ${event.date} | 💰 ${event.price}</p>
                <button class="btn-book" onclick="viewDetails(${event.id})">View Details</button>
            </div>
        </div>
    `).join('');
}

function filterEvents() {
    if (!searchInput) return;
    const term = searchInput.value.toLowerCase().trim();
    const filtered = events.filter(ev => {
        const matchesSearch = ev.title.toLowerCase().includes(term) || 
                             ev.category.toLowerCase().includes(term);
        const matchesCategory = currentCategory === 'all' || ev.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    displayEvents(filtered);
}

// Event Listeners
if (searchInput) {
    searchInput.addEventListener('input', filterEvents);
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        filterEvents();
    });
});

// Auth Form Handling
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(`Login Error: ${error.message}`);
        } else {
            alert(`Logged in as ${email}. Your event participation and rewards are now synced!`);
            window.location.href = 'index.html';
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        const name = e.target.querySelector('input[type="text"]').value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (error) {
            alert(`Signup Error: ${error.message}`);
        } else {
            alert(`Welcome, ${name}! Please check your email for the confirmation link.`);
            window.location.href = 'login.html';
        }
    });
}

// Initial Render
if (eventGrid) {
    const isEventsPage = window.location.pathname.includes('events.html');
    if (isEventsPage) {
        displayEvents(events);
    } else {
        displayEvents(events.slice(0, 3));
    }
}

// Event Details Page Logic
const detailsContainer = document.getElementById('eventDetailsContainer');
if (detailsContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));
    const event = events.find(e => e.id === eventId);

    if (event) {
        detailsContainer.innerHTML = `
            <div class="details-layout">
                <div class="details-image" style="background-image: url('https://images.unsplash.com/photo-1540575861501-7ad05823c9f5?w=800&q=80')"></div>
                <div class="details-info">
                    <span class="card-tag">${event.category.toUpperCase()}</span>
                    <h1>${event.title}</h1>
                    <p class="details-meta">📅 Date: ${event.date} | 💰 Price: ${event.price}</p>
                    <div class="details-description">
                        <p>Join us for this incredible ${event.category}. This session will cover advanced topics, provide networking opportunities, and help you level up your skills in a collaborative environment.</p>
                    </div>
                    <button class="auth-btn" onclick="openModal(${event.id})">Reserve a Seat Now</button>
                </div>
            </div>
        `;
    }
}

// Initialize EmailJS once at the start of the script
if (typeof emailjs !== 'undefined') {
    emailjs.init("w_MGIqyuAzHqjbG6o");
}

function viewDetails(id) {
    window.location.href = `event-details.html?id=${id}`;
}

let selectedEventId = null;

function openModal(id) {
    selectedEventId = id;
    document.getElementById('bookingModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function handleRegistration(e) {
    e.preventDefault();
    const event = events.find(ev => ev.id === selectedEventId);
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const studentId = document.getElementById('studentId').value;
    const modalBody = document.getElementById('modalBody');

    // Show loading state
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="loading-spinner"></div>
            <p>Processing your reservation and generating pass...</p>
        </div>
    `;

    // Get current authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();

    setTimeout(async () => {
        const ticketId = 'HUB-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Save to Supabase Participation History
        const { error: dbError } = await supabaseClient
            .from('event_participations')
            .insert([{
                user_id: user ? user.id : null,
                event_id: selectedEventId,
                event_title: event.title,
                student_name: name,
                student_email: email,
                student_roll_no: studentId,
                ticket_id: ticketId
            }]);

        const qrData = encodeURIComponent(`Event: ${event.title}\nStudent: ${name}\nTicket: ${ticketId}`);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

        // Integration with EmailJS to send the actual email
        if (typeof emailjs !== 'undefined') {
            emailjs.send("service_5al1tfg", "template_cx5dtpf", {
                student_name: name,
                student_email: email,
                event_title: event.title,
                ticket_id: ticketId,
                qr_code_url: qrUrl
            }, "w_MGIqyuAzHqjbG6o")
            .then((response) => {
                console.log("SUCCESS!", response.status, response.text);
            }, (err) => {
                console.error("FAILED...", err);
            });
        }

        modalBody.innerHTML = `
            <div class="ticket-success">
                <h3>Check Your Inbox!</h3>
                <p>A confirmation mail has been sent to <strong>${email}</strong>.</p>
                <div class="qr-container">
                    <img src="${qrUrl}" alt="Event QR Code">
                    <p style="margin-top: 1rem; font-size: 0.8rem; color: #636e72;">Scan at the entrance</p>
                </div>
                <p>Ticket ID: <span class="ticket-id">${ticketId}</span></p>
                <button class="btn-secondary" style="margin-top: 1.5rem; width: 100%;" onclick="closeModal()">Close</button>
            </div>
        `;
    }, 1500);
}