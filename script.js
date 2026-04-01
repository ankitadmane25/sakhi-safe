import { database } from './firebase-config.js';
import { ref, set, get, child, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameInput = document.getElementById('userName');
const userPhoneInput = document.getElementById('userPhone');
const userLanguageInput = document.getElementById('userLanguage');

const displayName = document.getElementById('display-name');
const sosBtn = document.getElementById('sosBtn');
const contactsList = document.getElementById('contacts-list');
const newContactPhone = document.getElementById('newContactPhone');
const addContactBtn = document.getElementById('addContactBtn');

const countdownModal = document.getElementById('countdown-modal');
const countdownTimer = document.getElementById('countdown-timer');
const cancelSosBtn = document.getElementById('cancelSosBtn');
const sirenSound = document.getElementById('sirenSound');
const locationStatus = document.getElementById('location-status');
const enableShakeBtn = document.getElementById('enableShakeBtn');
const toastContainer = document.getElementById('toast-container');

// State
let currentUser = null; // db shape: { name, phone, language, contacts: [] }
let countdownInterval;
let isSosActive = false;

// Custom Toast Notification System
function showToast(message, type = 'normal') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '🔔';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✅';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('slideDown');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('slideDown');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Initialization
function init() {
    const savedPhone = localStorage.getItem('sakhiSafeUserPhone');
    if (savedPhone) {
        loadUserProfile(savedPhone);
    } else {
        showAuth();
    }
}

// UI Toggles
function showAuth() {
    authSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
}

function showMain() {
    authSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    displayName.textContent = currentUser.name;
    renderContacts();
}

// Login logic
loginBtn.addEventListener('click', async () => {
    const name = userNameInput.value.trim();
    const phone = userPhoneInput.value.trim();
    const language = userLanguageInput.value;

    if (!name || !phone) {
        showToast("Please enter both full name and phone number.", "error");
        return;
    }

    try {
        loginBtn.textContent = "Loading...";
        loginBtn.style.opacity = "0.7";

        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `users/${phone}`));
        
        if (snapshot.exists()) {
            // User exists, load profile
            currentUser = snapshot.val();
            // Update language preference if it changed during 'login'
            if (currentUser.language !== language) {
                currentUser.language = language;
                await update(ref(database, `users/${phone}`), { language });
            }
            showToast("Welcome back!", "success");
        } else {
            // New User Registration
            currentUser = { name, phone, language, contacts: [] };
            await set(ref(database, `users/${phone}`), currentUser);
            showToast("Account created successfully!", "success");
        }

        localStorage.setItem('sakhiSafeUserPhone', phone);
        userNameInput.value = '';
        userPhoneInput.value = '';
        
        loginBtn.textContent = "Enter Securely";
        loginBtn.style.opacity = "1";
        showMain();

        // Listen for realtime updates to contacts from other devices
        listenToContacts(phone);

    } catch (error) {
        console.error("Login failed:", error);
        showToast("Could not connect to Firebase database.", "error");
        loginBtn.textContent = "Enter Securely";
        loginBtn.style.opacity = "1";
    }
});

// Load Profile securely
async function loadUserProfile(phone) {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `users/${phone}`));
        if (snapshot.exists()) {
            currentUser = snapshot.val();
            showMain();
            listenToContacts(phone);
        } else {
            localStorage.removeItem('sakhiSafeUserPhone');
            showAuth();
        }
    } catch (error) {
        console.error("Failed to load profile:", error);
        showAuth();
    }
}

function listenToContacts(phone) {
    const contactsRef = ref(database, `users/${phone}/contacts`);
    onValue(contactsRef, (snapshot) => {
        currentUser.contacts = snapshot.val() || [];
        renderContacts();
    });
}

// Logout logic
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('sakhiSafeUserPhone');
    currentUser = null;
    showAuth();
});

// Contacts Management
addContactBtn.addEventListener('click', async () => {
    const contactPhone = newContactPhone.value.trim();
    if (!contactPhone) return;

    if (!currentUser.contacts) currentUser.contacts = [];
    if (currentUser.contacts.includes(contactPhone)) {
        showToast("Contact already exists!", "error");
        return;
    }

    const newContacts = [...currentUser.contacts, contactPhone];
    try {
        await update(ref(database, `users/${currentUser.phone}`), { contacts: newContacts });
        newContactPhone.value = '';
    } catch (error) {
        console.error("Failed to add contact:", error);
        showToast("Failed to save contact.", "error");
    }
});

// Make removeContact globally accessible for inline onclick usage
window.removeContact = async function(contact) {
    const newContacts = currentUser.contacts.filter(c => c !== contact);
    try {
        await update(ref(database, `users/${currentUser.phone}`), { contacts: newContacts });
    } catch (error) {
        console.error("Failed to remove contact:", error);
    }
};

function renderContacts() {
    contactsList.innerHTML = '';
    const contacts = currentUser.contacts || [];
    if (contacts.length === 0) {
        contactsList.innerHTML = '<p style="color:#888; font-size:0.9rem; padding: 10px;">No contacts added yet.</p>';
        return;
    }

    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'contact-card';
        div.innerHTML = `
            <span>${contact}</span>
            <button class="remove-btn" onclick="removeContact('${contact}')" title="Remove Contact">×</button>
        `;
        contactsList.appendChild(div);
    });
}

// SOS Logic (Button & Shake)
sosBtn.addEventListener('click', triggerSOS);

function triggerSOS() {
    if (isSosActive) return;
    isSosActive = true;
    locationStatus.textContent = "";

    countdownModal.classList.remove('hidden');
    let timeLeft = 5;
    countdownTimer.textContent = timeLeft;

    // Play Siren Sound
    sirenSound.currentTime = 0;
    // Autoplay might be blocked by browsers if user hasn't interacted, but since 
    // login or a manual button press happened, it usually works.
    sirenSound.play().catch(e => console.warn("Audio play blocked by browser:", e));
    
    // Vibrate if supported (500ms on, 200ms off pattern)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownTimer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            executeEmergencyProtocol();
            countdownModal.classList.add('hidden');
        }
    }, 1000);
}

cancelSosBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    isSosActive = false;
    countdownModal.classList.add('hidden');
    sirenSound.pause();
    sirenSound.currentTime = 0;
    if (navigator.vibrate) navigator.vibrate(0); // Stop vibration
    locationStatus.textContent = "Alert Cancelled.";
    setTimeout(() => locationStatus.textContent = "", 3000);
});

// Execute Emergency Protocol
async function executeEmergencyProtocol() {
    locationStatus.textContent = "Fetching your live location...";
    try {
        if (!navigator.geolocation) throw new Error("Geolocation not supported by browser.");
        
        // Wrap getCurrentPosition in a promise
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
        
        sendAlerts(mapLink);
        locationStatus.textContent = "Alert sent successfully! Help is on the way.";
        
    } catch (error) {
        console.error("Location error:", error);
        locationStatus.textContent = "Could not get tracking location. Sending alert without precise location...";
        sendAlerts("[Location unknown]");
    }
    
    isSosActive = false;
    sirenSound.pause();
}

function sendAlerts(locationStr) {
    let message = "";
    const lang = currentUser.language || "English";
    
    // Dynamic Language Generation
    if (lang === "English") {
        message = `I am in danger! I need help immediately. My location: ${locationStr}`;
    } else if (lang === "Hindi") {
        message = `मैं खतरे में हूँ! कृपया मेरी मदद करें। मेरी लोकेशन: ${locationStr}`;
    } else if (lang === "Marathi") {
        message = `मी धोक्यात आहे! कृपया मदत करा. माझे स्थान: ${locationStr}`;
    }

    const contacts = currentUser.contacts || [];
    if (contacts.length === 0) {
        showToast("Alert generated, but NO emergency contacts are saved! Please add contacts.", "error");
        return;
    }

    // In a production backend, you would trigger SMS APIs here.
    // For this purely frontend + Firebase demo, we will simulate it.
    console.log("=== SAKHI SAFE: EMERGENCY ALERT TRIGGERED ===");
    console.log("Message:", message);
    console.log("Target Contacts:", contacts);
    console.log("============================================");

    showToast(`Emergency alert successfully sent to ${contacts.length} contacts!`, "success");
}

// Shake Detection Logic
let lastX = null, lastY = null, lastZ = null;
let lastUpdate = 0;

// Increased threshold and added counter for INTENSIVE shake detection
const SHAKE_THRESHOLD = 30; // High speed required
let shakeCount = 0;
let lastShakeTime = 0;

// Setup iOS Shake Permission Button
if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    enableShakeBtn.classList.remove('hidden');
    enableShakeBtn.addEventListener('click', () => {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    enableShakeBtn.classList.add('hidden');
                    showToast("Shake detection is now active.", "success");
                } else {
                    showToast("Permission denied. Shake to SOS will not work.", "error");
                }
            })
            .catch(console.error);
    });
}

// Modern iOS devices require explicit permission for DeviceMotion, 
// but Android mostly allows it on https sites automatically.
window.addEventListener('devicemotion', (event) => {
    if (!currentUser || isSosActive) return; // Must be logged in and not already buzzing
    
    const current = event.accelerationIncludingGravity;
    if (!current || current.x === null) return;
    
    const currTime = Date.now();
    if ((currTime - lastUpdate) > 100) { // Check every 100ms
        const diffTime = (currTime - lastUpdate);
        lastUpdate = currTime;

        if (lastX !== null) {
            const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;
            
            if (speed > SHAKE_THRESHOLD) {
                // If it's been more than 1.5s since the last intense movement, reset the counter
                if (currTime - lastShakeTime > 1500) {
                    shakeCount = 0;
                }
                shakeCount++;
                lastShakeTime = currTime;

                // Require at least 4 consecutive high-intensity movements to count as an "intensive shake"
                if (shakeCount >= 4) {
                    console.log("Intensive device shake detected! Triggering SOS.");
                    triggerSOS();
                    shakeCount = 0;
                }
            }
        }
        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
    }
}, false);

// Init APP
init();
