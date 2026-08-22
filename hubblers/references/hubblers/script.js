// Supabase Configuration - Found in Project Settings > API
const SUPABASE_URL = 'https://wadwdorjawsshfgelmzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZHdkb3JqYXdzc2hmZ2VsbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjQ2MjEsImV4cCI6MjA5MDc0MDYyMX0.X9nl_Wo6Sf3RAI1m7F7Ulse47bZsScFg-JL2JhxhE1c'; // Copy the 'anon' 'public' key from Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Theme Toggle Logic
const createThemeToggle = () => {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    btn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';

    btn.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    };
    document.body.appendChild(btn);
};

// Initialize Theme
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    createThemeToggle();
};

initTheme();

// Auth State Listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateNavbar(session);
});

async function updateNavbar(session) {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    if (session) {
        const user = session.user;
        let role = user.user_metadata?.role || 'student';
        console.log('[DEBUG Navbar] Raw metadata role:', user.user_metadata?.role, 'Final role:', role);
        
        // Profiles table fallback (don't override admin)
        if (role !== 'admin') {
            try {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profile && profile.role && !role.includes(profile.role)) {
                    role = profile.role;
                }
            } catch (e) {
                console.log('Profile fetch failed:', e.message);
            }
        }
        const fullName = user.user_metadata?.full_name || 'Admin';

        const initial = fullName.charAt(0);

        let roleLinks = '';
        let dashboardUrl = 'dashboard.html';

        if (role === 'admin') {
            roleLinks = `<li><a href="admin-dashboard.html">Admin Panel</a></li>`;
            dashboardUrl = 'admin-dashboard.html';
        } else if (role === 'college') {
            roleLinks = `<li><a href="#" onclick="openCreateEventModal()">Create Event</a></li>
                        <li><a href="college-dashboard.html">Manage Events</a></li>`;
            dashboardUrl = 'college-dashboard.html';
        } else {
            roleLinks = `<li><a href="events.html">Browse</a></li>
                        <li><a href="dashboard.html">My Events</a></li>`;
        }

        const roleBadge = role === 'admin' 
            ? `<span class="role-badge badge-admin">Admin</span>` 
            : role === 'college' 
            ? `<span class="role-badge badge-college">College</span>` 
            : `<span class="role-badge badge-student">Student</span>`;

        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            ${roleLinks}
            <li>
                <a href="${dashboardUrl}" class="user-profile">
                    <div class="profile-img">${initial}</div>
                    <span>${fullName}${roleBadge}</span>
                </a>
            </li>
            <li><a href="#" id="logoutBtn" class="logout-btn">Logout</a></li>
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
            <li class="btn-login"><a href="${isLoginPage ? 'signup.html' : 'login.html'}">${isLoginPage ? 'Sign Up' : 'Login'}</a></li>
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
                <h2 style="text-align: center; margin-bottom: 0.5rem;">Reserve Your Seat</h2>
                <p class="text-muted" style="text-align: center; margin-bottom: 2rem;">Fill in your details to receive your entry pass.</p>
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

// Event Creation Modal Setup (College Authorized Only)
const createEventModalHTML = `
    <div id="createEventModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeCreateEventModal()">&times;</span>
            <div id="createEventModalBody">
                <h2 style="text-align: center; margin-bottom: 0.5rem;">Post New Event</h2>
                <p class="text-muted" style="text-align: center; margin-bottom: 2rem;">Host a new event on the platform.</p>
                <form id="createEventForm" onsubmit="handleCreateEvent(event)">
                    <div class="form-group">
                        <label>Event Title</label>
                        <input type="text" id="eventTitle" required placeholder="e.g. AI Hackathon 2026">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="eventCategory" required>
                            <option value="workshop">Workshop</option>
                            <option value="symposium">Symposium</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="text" id="eventDate" required placeholder="e.g. Oct 25">
                    </div>
                    <div class="form-group">
                        <label>Price</label>
                        <input type="text" id="eventPrice" required placeholder="e.g. Free or $10">
                    </div>
                    <div class="form-group">
                        <label>Event Banner</label>
                        <input type="file" id="eventBanner" accept="image/jpeg,image/png" class="file-input" onchange="previewBanner(this)">
                        <div id="bannerPreview" class="photo-preview" style="width: 100%; height: 150px; margin-top: 0.5rem; display: none;"></div>
                    </div>
                    <button type="submit" class="auth-btn">Post Event</button>
                </form>
            </div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', createEventModalHTML);

// Auth elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function displayEvents(filteredEvents) {
    console.log('[DEBUG] displayEvents() called with', filteredEvents.length, 'events');
    
    if (!eventGrid) {
        console.error('[DEBUG] eventGrid element missing!');
        return;
    }
    
    if (filteredEvents.length === 0) {
        console.log('[DEBUG] No events, showing empty state');
        eventGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-slate-500);">No events found matching your search.</div>`;
        return;
    }
    
    console.log('[DEBUG] Rendering cards...');


    const stockImages = [
        'https://images.unsplash.com/photo-1540575861501-7ad05823c9f5?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80&auto=format&fit=crop'
    ];

    eventGrid.innerHTML = filteredEvents.map(event => {
        const imageUrl = event.banner_url || stockImages[(event.id || 0) % stockImages.length];
        return `
        <div class="card">
            <div class="card-img" style="background-image: url('${imageUrl}')"></div>
            <div class="card-content">
                <span class="card-tag">${event.category.toUpperCase()}</span>
                <h3 style="margin-bottom: 0.25rem;">${event.title}</h3>
                <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1.5rem;">📅 ${event.date} | 💰 ${event.price}</p>
                <button class="btn-book" onclick="viewDetails(${event.id})">View Details</button>
            </div>
        </div>
    `}).join('');
}

async function loadLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboardList');
    if (!leaderboardEl) return;

    const { data, error } = await supabaseClient
        .from('event_participations')
        .select('student_name, student_email');

    if (error) return;

    // Simple aggregation: Count registrations per student
    const counts = data.reduce((acc, curr) => {
        acc[curr.student_name] = (acc[curr.student_name] || 0) + 1;
        return acc;
    }, {});

    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5

    leaderboardEl.innerHTML = sorted.map(([name, score], index) => `
        <div class="leader-item">
            <div style="font-weight: 700; color: var(--indigo-600); width: 2rem;">#${index + 1}</div>
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                <div class="profile-img" style="width: 2.5rem; height: 2.5rem; font-size: 0.875rem;">${name.charAt(0)}</div>
                <span style="font-weight: 600;">${name}</span>
            </div>
            <div style="font-weight: 700; color: var(--indigo-600);">${score * 100} XP</div>
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

        // Enforce institutional email restriction for College Portal login
        if (window.location.pathname.includes('college-login.html')) {
            if (!validateOfficialEmail(email)) {
                alert('Please enter a valid official email address.');
                return;
            }
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(`Login Error: ${error.message}`);
        } else {
            let role = data.user?.user_metadata?.role || 'student';
            try {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                if (profile) role = profile.role;
            } catch (e) {
                console.log('Profile role fetch failed:', e);
            }

            const path = window.location.pathname;

            // Role-Portal Matching Enforcement - STRICT email:password per portal
            const expectedRoleForPortal = 
                path.includes('admin-login.html') ? 'admin' :
                path.includes('college-login.html') ? 'college' :
                'student';

            if (role !== expectedRoleForPortal) {
                await supabaseClient.auth.signOut();
                const portalName = path.includes('admin-login.html') ? 'Admin' :
                                  path.includes('college-login.html') ? 'College' : 'Student';
                alert(`❌ Access Denied: This is ${portalName} Portal only.\n\nYour role: ${role}\nUse correct portal.`);
                return;
            }

            if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (role === 'college') {
                window.location.href = 'college-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    });
}

// Mock Colleges Data (replace with Supabase fetch later)
const colleges = [
    { id: 'ssn', name: 'SSN College of Engineering', shortcode: 'ssn', multi_campus: false, departments: ['CSE', 'ECE', 'MECH'], tiers: ['UG', 'PG'] },
    { id: 'srmktr', name: 'SRM Institute - Kattankulathur Campus', shortcode: 'srmktr', multi_campus: true, locations: ['KTR', 'Vadapalani'], departments: ['CSE', 'IT', 'ECE'], tiers: ['UG', 'PG', 'Diploma'] },
    { id: 'vit', name: 'VIT Vellore', shortcode: 'vit', multi_campus: false, departments: ['CSE', 'EEE'], tiers: ['UG', 'PG'] },
    // Add more from spec shortcodes
];

async function populateColleges() {
    const select = document.getElementById('collegeName');
    const { data, error } = await supabaseClient.from('colleges').select('*');
    const list = (data && !error && data.length > 0) ? data : colleges;
    select.innerHTML = '<option value="">Select your college</option>' + list.map(c => `<option value="${c.id}" data-shortcode="${c.shortcode}" data-multi="${c.multi_campus}">${c.name}</option>`).join('');
}

async function getUserProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// Student Signup Validation & Logic
function validateFullName(name) {
    return /^[a-zA-Z\s]{2,60}$/.test(name) && name.trim().length >= 2 && name.trim().length <= 60;
}

function validateMobile(mobile) {
    return /^[0-9]{10}$/.test(mobile);
}

function validateRollNumber(roll) {
    return /^[a-zA-Z0-9]{4,20}$/.test(roll);
}

function validateHandle(handle) {
    return /^[a-z][a-z0-9]{1,28}[a-z0-9]$/.test(handle) && handle.length >= 3 && handle.length <= 30 && !handle.includes('..');
}

function validateMapsURL(url) {
    if (!url) return true; // Optional
    return /^https?:\/\/(www\.)?(google\.com\/maps|goo\.gl\/maps)\/.*$/.test(url);
}

function validateOfficialEmail(email) {
    // Modified for testing: allow regular personal domains like gmail.com
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pwd) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(pwd);
}

function getPasswordStrength(pwd) {
    const strength = pwd.length >= 8 ? 1 : 0;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/\d/.test(pwd)) strength += 1;
    if (/[!@#$%^&*]/.test(pwd)) strength += 1;
    return ['weak', 'medium', 'strong'][Math.min(strength, 3)] || 'weak';
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('field-error');
    let errorEl = field.parentNode.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        field.parentNode.appendChild(errorEl);
    }
    errorEl.textContent = message;
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('field-error');
    const errorEl = field.parentNode.querySelector('.error-message');
    if (errorEl) errorEl.remove();
}

// Helper to upload files to Supabase Storage
async function uploadFileToSupabase(file, bucket, path) {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabaseClient.storage.from(bucket).upload(filePath, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
}

function validateForm() {
    const fields = {
        fullName: { val: validateFullName, msg: '2–60 chars, letters + spaces only' },
        mobile: { val: validateMobile, msg: 'Exactly 10 digits' },
        rollNumber: { val: validateRollNumber, msg: '4–20 alphanumeric chars' },
        hubblerHandle: { val: validateHandle, msg: 'Lowercase letters/numbers/dots, 3–30 chars' },
        email: { val: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), msg: 'Valid email required' },
        password: { val: validatePassword, msg: 'Min 8 chars: 1 uppercase, 1 number, 1 special char' }
    };

    let valid = true;
    Object.entries(fields).forEach(([id, { val, msg }]) => {
        const field = document.getElementById(id);
        if (!val(field.value)) {
            showFieldError(id, msg);
            valid = false;
        } else {
            clearFieldError(id);
        }
    });

    // Required selects
    ['collegeName', 'department', 'educationTier', 'startYear', 'endYear'].forEach(id => {
        const field = document.getElementById(id);
        if (!field.value) {
            showFieldError(id, 'Required');
            valid = false;
        }
    });

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = !valid;
    }
    return valid;
}

if (signupForm) {
    populateColleges(); // Load colleges on signup page

    // Populate Years
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    const currentYear = new Date().getFullYear();
    
    for(let i = currentYear - 5; i <= currentYear + 1; i++) {
        startYearSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    for(let i = currentYear; i <= currentYear + 6; i++) {
        endYearSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    startYearSelect.disabled = false;
    endYearSelect.disabled = false;

    // OTP Interaction Logic
    document.getElementById('mobile').addEventListener('input', (e) => {
        const sendOTPBtn = document.getElementById('sendOTP');
        sendOTPBtn.disabled = !/^[0-9]{10}$/.test(e.target.value);
    });

    // Cascading dropdowns + handle suggestion
    document.getElementById('collegeName').addEventListener('change', (e) => {
        const collegeId = e.target.value;
        // Enable dependent fields once college is selected
        document.getElementById('department').disabled = !collegeId;
        // Mock population for demo
        if(collegeId) {
            document.getElementById('department').innerHTML = `
                <option value="">Select department</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
            `;
        }
    });

    // Real-time validation
    ['fullName', 'mobile', 'rollNumber', 'hubblerHandle', 'email', 'password'].forEach(id => {
        document.getElementById(id).addEventListener('blur', () => validateForm());
        document.getElementById(id).addEventListener('input', () => validateForm());
    });

    ['collegeName', 'department', 'educationTier', 'startYear', 'endYear'].forEach(id => {
        document.getElementById(id).addEventListener('change', validateForm);
    });

    // Password strength
    document.getElementById('password').addEventListener('input', (e) => {
        const strengthEl = document.getElementById('passwordStrength');
        const strength = getPasswordStrength(e.target.value);
        strengthEl.className = `password-strength ${strength}`;
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerText = 'Creating Account...';

        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const photoFile = document.getElementById('profilePhoto').files[0];

            // 1. Upload Profile Photo
            const photoUrl = await uploadFileToSupabase(photoFile, 'profile-photos', 'students');

            // 2. Sign Up via Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: document.getElementById('fullName').value,
                        mobile: document.getElementById('mobile').value,
                        role: 'student',
                        college_name: document.getElementById('collegeName').value,
                        department: document.getElementById('department').value,
                        roll_number: document.getElementById('rollNumber').value.toUpperCase(),
                        hubbler_handle: document.getElementById('hubblerHandle').value,
                        profile_photo_url: photoUrl
                    }
                }
            });

            if (error) throw error;
            const user = data.user;

            // 3. Create entry in public.students table
            const { error: profileError } = await supabaseClient
                .from('students')
                .insert([{
                    id: user.id,
                    full_name: document.getElementById('fullName').value,
                    mobile: document.getElementById('mobile').value,
                    college_id: document.getElementById('collegeName').value,
                    department: document.getElementById('department').value,
                    roll_number: document.getElementById('rollNumber').value.toUpperCase(),
                    hubbler_handle: document.getElementById('hubblerHandle').value,
                    profile_photo_url: photoUrl,
                    role: 'student'
                }]);

            if (profileError) throw profileError;

            alert('Account created! Please check your email for the confirmation link.');
            window.location.href = 'login.html';
        } catch (err) {
            alert('Registration Failed: ' + err.message);
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Create HubblerX Account';
        }
    });
}

// College Signup Logic
const collegeForm = document.getElementById('collegeSignupForm');
if (collegeForm) {
    const validateCollegeForm = () => {
        const fields = {
            collegeOfficialName: { val: v => v.length >= 2 && v.length <= 120, msg: '2–120 chars required' },
            email: { val: validateOfficialEmail, msg: 'Valid official email required' },
            password: { val: validatePassword, msg: 'Strong password required' }
        };

        let isValid = true;
        Object.entries(fields).forEach(([id, { val, msg }]) => {
            const input = document.getElementById(id);
            if (!val(input.value)) {
                showFieldError(id, msg);
                isValid = false;
            } else {
                clearFieldError(id);
            }
        });
        return isValid;
    };

    collegeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateCollegeForm()) return;
        
        const btn = document.getElementById('submitBtn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Registering Institution...';

        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const logoFile = document.getElementById('collegeLogo').files[0];

            // 1. Upload Logo
            const logoUrl = await uploadFileToSupabase(logoFile, 'college-logos', 'institutions');

            // 2. Register via Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        college_name: document.getElementById('collegeOfficialName').value,
                        full_name: document.getElementById('collegeOfficialName').value, // Fallback for name
                        role: 'college',
                        college_logo_url: logoUrl,
                        is_verified: false // Requires admin approval
                    }
                }
            });

            if (error) throw error;
            const user = data.user;

            // 3. Create entry in public.colleges_profiles table
            const { error: profileError } = await supabaseClient
                .from('colleges_profiles')
                .insert([{
                    id: user.id,
                    college_name: document.getElementById('collegeOfficialName').value,
                    official_email: email,
                    logo_url: logoUrl,
                    role: 'college'
                }]);

            if (profileError) throw profileError;

            alert('Institutional registration request sent! Hubblers Group will verify your details soon.');
            window.location.href = 'college-login.html';
        } catch (err) {
            alert('Registration Failed: ' + err.message);
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    ['collegeOfficialName', 'email', 'password'].forEach(id => {
        document.getElementById(id).addEventListener('blur', validateCollegeForm);
    });
}

// Ensure app initializes on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded - initializing app');
    initializeApp();
});

// Also call on script load as fallback
initializeApp();

// Initialize EmailJS once at the start of the script
if (typeof emailjs !== 'undefined') {
    emailjs.init("w_MGIqyuAzHqjbG6o");
}

function viewDetails(id) {
    window.location.href = `event-details.html?id=${id}`;
}

// Initialize Application and Data
async function initializeApp() {
    console.log('[DEBUG] initializeApp() called');
    
    try {
        const { data, error } = await supabaseClient.from('events').select('*');
        console.log('[DEBUG] Supabase events fetch:', { data: data?.length || 0, error: error?.message });
        
        if (!error && data && data.length > 0) {
            events = data;
            console.log('[DEBUG] Using Supabase data');
        } else {
            console.log('[DEBUG] Fallback to mock data');
        }
    } catch (err) {
        console.error('[DEBUG] Supabase error:', err);
        console.log('[DEBUG] Using mock data fallback');
    }

    // Initial Render for Grid
    if (eventGrid) {
        console.log('[DEBUG] eventGrid found, rendering...');
        const isEventsPage = window.location.pathname.includes('events.html');
        const eventsToShow = isEventsPage ? events : events.slice(0, 3);
        console.log('[DEBUG] Events to show:', eventsToShow.length, 'Page:', window.location.pathname);
        displayEvents(eventsToShow);
    } else {
        console.warn('[DEBUG] eventGrid element NOT found!');
    }

    // Event Details Page Logic
    const detailsContainer = document.getElementById('eventDetailsContainer');

    if (detailsContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        const event = events.find(e => e.id == eventId);

        if (event) {
            const imageUrl = event.banner_url || 'https://images.unsplash.com/photo-1540575861501-7ad05823c9f5?w=800&q=80';
            detailsContainer.innerHTML = `
                <div class="details-layout">
                    <div class="details-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="details-info">
                        <span class="card-tag" style="width: fit-content; padding: 0.25rem 0.75rem; border-radius: 9999px;">${event.category.toUpperCase()}</span>
                        <h1 class="details-title">${event.title}</h1>
                        <p class="details-meta">📅 Date: ${event.date} | 💰 Price: ${event.price}</p>
                        <div class="details-desc">
                            <p>Join us for this incredible ${event.category}. This session will cover advanced topics, provide networking opportunities, and help you level up your skills in a collaborative environment.</p>
                        </div>
                        <button class="auth-btn" style="width: fit-content; padding: 1rem 2.5rem;" onclick="openModal(${event.id})">Reserve a Seat Now</button>
                    </div>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `<p class="error-text">Event details not found. Please try again later.</p>`;
        }
    }
}

initializeApp();

let selectedEventId = null;

function openCreateEventModal() {
    document.getElementById('createEventModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCreateEventModal() {
    document.getElementById('createEventModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function previewBanner(input) {
    const preview = document.getElementById('bannerPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.style.backgroundImage = `url(${e.target.result})`;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
    }
}

async function handleCreateEvent(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    const title = document.getElementById('eventTitle').value;
    const category = document.getElementById('eventCategory').value;
    const date = document.getElementById('eventDate').value;
    const price = document.getElementById('eventPrice').value;
    const bannerFile = document.getElementById('eventBanner').files[0];

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user || user.user_metadata.role !== 'college') {
        alert('Unauthorized: Only verified college accounts can post events.');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Posting Event...';

    try {
        let bannerUrl = null;
        if (bannerFile) {
            bannerUrl = await uploadFileToSupabase(bannerFile, 'event-banners', 'colleges');
        }

        const { data, error } = await supabaseClient
            .from('events')
            .insert([{
                title,
                category,
                date,
                price,
                college_name: user.user_metadata.college_name,
                created_by: user.id,
                banner_url: bannerUrl
            }]);

        if (error) throw error;

        alert('Event successfully posted to HubblerX!');
        closeCreateEventModal();
        e.target.reset();
        document.getElementById('bannerPreview').style.display = 'none';
        initializeApp(); // Refresh event list
    } catch (err) {
        alert('Error posting event: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function openModal(id) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        alert('You must be logged in to register for events.');
        window.location.href = 'login.html';
        return;
    }

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
    const event = events.find(ev => ev.id == selectedEventId);
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const studentId = document.getElementById('studentId').value;
    const modalBody = document.getElementById('modalBody');

    // Show loading state
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
            <div class="loading-spinner"></div>
            <p class="text-muted" style="font-weight: 500;">Processing your reservation and generating pass...</p>
        </div>
    `;

    // Get current authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert('Registration failed: Session expired. Please log in again.');
        window.location.href = 'login.html';
        return;
    }

    setTimeout(async () => {
        const ticketId = 'HUB-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Save to Supabase Participation History
        const { error: dbError } = await supabaseClient
            .from('event_participations')
            .insert([{
                user_id: user.id,
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
            <div style="text-align: center;">
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Check Your Inbox!</h3>
                <p class="text-muted" style="margin-bottom: 1.5rem;">A confirmation mail has been sent to <br><strong>${email}</strong>.</p>
                <div style="background-color: white; padding: 1.5rem; display: inline-block; border-radius: 1rem; border: 1px solid var(--border); margin-bottom: 1.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                    <img src="${qrUrl}" alt="Event QR Code" style="width: 12rem; height: 12rem; margin: 0 auto;">
                    <p style="margin-top: 1rem; font-size: 0.625rem; font-weight: 700; color: var(--text-slate-400); text-transform: uppercase; letter-spacing: 0.1em;">Scan at the entrance</p>
                </div>
                <p style="font-size: 0.875rem; font-weight: 500; color: var(--text-slate-500);">Ticket ID: <span style="font-family: monospace; background-color: var(--bg-slate-100); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 700; color: var(--text-slate-900);">${ticketId}</span></p>
                <button class="auth-btn" style="background-color: var(--bg-slate-100); color: var(--text-slate-600); margin-top: 2rem;" onclick="closeModal()">Close</button>
            </div>
        `;
    }, 1500);
}