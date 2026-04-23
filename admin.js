﻿// ============================================
// Firebase Initialization
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, addDoc, collection, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzQhNztzGFUj8rRca2i7F1w9MMzer-0c",
  authDomain: "raas-dandiya-events-7afe1.firebaseapp.com",
  projectId: "raas-dandiya-events-7afe1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;

console.log('✓ Firebase initialized for Admin Portal');

// ============================================
// Admin Portal - Event Management
// ============================================

// Admin State
let adminEvents = [];
let currentTicketTypes = [];
let bannerBase64 = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ DOM Content Loaded');
  initializeAdmin();
  
  // Verify form exists
  const form = document.getElementById('createEventForm');
  if (form) {
    console.log('✓ Create Event Form found');
    console.log('Form onsubmit handler:', form.onsubmit);
  } else {
    console.warn('⚠ Create Event Form NOT found in DOM');
  }
});

function initializeAdmin() {
  console.log('✓ DOM Content Loaded');
  
  // Always show the admin dashboard - no localStorage authentication needed
  // Load events asynchronously without blocking UI
  loadAdminEvents().catch(err => console.error('Failed to load events:', err));
  
  // Load analytics on initialization
  loadAnalytics().catch(err => console.error('Failed to load analytics:', err));
  
  // Start auto-refresh for analytics
  startAnalyticsRefresh();
}

// ==================== AUTHENTICATION ====================
function showAdminLogin() {
  const adminPanel = document.querySelector('.admin-container');
  if (!adminPanel) return;
  
  adminPanel.innerHTML = `
    <div class="admin-login-container">
      <div class="login-card">
        <h2>Admin Portal</h2>
        <p>Enter your credentials to continue</p>
        
        <form onsubmit="handleAdminLogin(event)">
          <div class="form-group">
            <label>Admin ID</label>
            <input type="text" id="adminId" placeholder="admin" required>
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="adminPassword" placeholder="password" required>
          </div>
          
          <button type="submit" class="btn btn-primary btn-lg">Login</button>
        </form>
      </div>
    </div>
  `;
}

function handleAdminLogin(event) {
  event.preventDefault();
  const adminId = document.getElementById('adminId').value;
  const password = document.getElementById('adminPassword').value;
  
  if (adminId === 'admin' && password === 'admin123') {
    // Authentication successful - admin dashboard will load
    location.reload();
  } else {
    alert('Invalid credentials. Use admin / admin123');
  }
}

function logoutAdmin() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ==================== TAB SWITCHING ====================
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
    
    if (tabName === 'events') {
      // Call async function without awaiting to keep UI responsive
      loadAdminEvents().catch(err => console.error('Failed to load events:', err));
    } else if (tabName === 'create') {
      initializeCreateForm();
    } else if (tabName === 'guests') {
      // Load guest list when tab is selected
      loadGuestList().catch(err => console.error('Failed to load guest list:', err));
    } else if (tabName === 'analytics') {
      // Load fresh analytics when switching to tab
      loadAnalytics().catch(err => console.error('Failed to load analytics:', err));
      startAnalyticsRefresh();
    }
  }
}

// ==================== LOAD & DISPLAY EVENTS ====================
async function loadAdminEvents() {
  try {
    console.log('Loading events from Firestore...');
    if (!db) {
      console.warn('Database not initialized');
      return;
    }

    const querySnapshot = await getDocs(collection(db, "events"));
    adminEvents = [];
    querySnapshot.forEach((doc) => {
      adminEvents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('✓ Loaded', adminEvents.length, 'events from Firestore');
  } catch (error) {
    console.error('Error loading events from Firestore:', error);
    adminEvents = [];
  }

  const container = document.getElementById('adminEventsList');
  if (!container) return;
  
  if (adminEvents.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">No events created yet!</div>';
    return;
  }
  
  container.innerHTML = adminEvents.map(event => {
    const statusColors = {
      active: { emoji: '🟢', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
      postponed: { emoji: '🟡', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
      cancelled: { emoji: '🔴', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      inactive: { emoji: '⭕', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' }
    };
    const statusStyle = statusColors[event.status] || statusColors.inactive;
    
    // Display "To be announced" for postponed events
    const dateDisplay = event.status === 'postponed' ? 'To be announced' : new Date(event.eventDate).toLocaleDateString('en-IN');
    const venueDisplay = event.status === 'postponed' ? 'To be announced' : (event.venue || 'TBD');
    
    return `
    <div class="glass-card" style="padding: var(--space-lg);">
      <div style="display: flex; gap: var(--space-lg); margin-bottom: var(--space-lg);">
        <img src="${event.banner || event.image}" alt="${event.eventName || 'Event'}" style="width: 100px; height: 100px; border-radius: var(--radius-lg); object-fit: cover;">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: var(--space-md);">
            <div>
              <h3 style="margin: 0 0 var(--space-sm) 0;">${event.eventName || 'Untitled Event'}</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">📅 ${dateDisplay}</p>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin: var(--space-sm) 0 0 0;">📍 ${venueDisplay}</p>
            </div>
            <span style="display: inline-block; padding: 6px 12px; background: ${statusStyle.bg}; color: ${statusStyle.color}; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">${statusStyle.emoji} ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
        <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
          <select class="btn btn-secondary btn-sm" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); background: var(--bg-tertiary); border: 1px solid var(--glass-border); font-weight: 600;" onchange="changeEventStatus('${event.id}', this.value); this.value=''">
            <option value="" style="color: var(--text-primary); background: var(--bg-tertiary);">Change Status...</option>
            <option value="active" style="color: var(--text-primary); background: var(--bg-tertiary);">🟢 Active</option>
            <option value="postponed" style="color: var(--text-primary); background: var(--bg-tertiary);">🟡 Postponed</option>
            <option value="cancelled" style="color: var(--text-primary); background: var(--bg-tertiary);">🔴 Cancelled</option>
            <option value="inactive" style="color: var(--text-primary); background: var(--bg-tertiary);">⭕ Inactive</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="editEvent('${event.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')">Delete</button>
        </div>
      </div>
    </div>
  `}).join('');
}

async function changeEventStatus(eventId, newStatus) {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, { status: newStatus });
    console.log('✓ Event status updated to:', newStatus);
    showToast('success', 'Status Updated', 'Event status changed to ' + newStatus);
    loadAdminEvents();
    loadAnalytics();
  } catch (error) {
    console.error('Error updating event status:', error);
    alert('Error updating status: ' + error.message);
  }
}

function deleteEvent(eventId) {
  if (confirm('Delete this event?')) {
    try {
      console.log('Deleting event:', eventId);
      deleteDoc(doc(db, "events", eventId)).then(() => {
        console.log('✓ Event deleted from Firestore');
        showToast('success', 'Event Deleted', 'Event removed');
        loadAdminEvents();
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event: ' + error.message);
    }
  }
}

// ==================== CREATE EVENT FORM ====================
function initializeCreateForm() {
  currentTicketTypes = [];
  bannerBase64 = null;
  
  const form = document.getElementById('createEventForm');
  if (form) {
    form.reset();
    form.dataset.editingId = '';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Create Event';
  }
  
  const bannerText = document.getElementById('bannerText');
  if (bannerText) bannerText.textContent = 'Click to upload banner image';
  
  const bannerPreview = document.getElementById('bannerPreview');
  if (bannerPreview) bannerPreview.style.display = 'none';
  
  const ticketsContainer = document.getElementById('ticketsContainer');
  if (ticketsContainer) ticketsContainer.innerHTML = '';
}

// ==================== FORM SUBMISSION - MAIN HANDLER ====================
async function handleCreateEvent(event) {
  event.preventDefault();
  console.log('✓ Create event form submitted');
  console.log('Event object:', event);
  
  try {
    // Validate and save ticket types
    if (!saveTicketTypes()) {
      alert('Please add at least one ticket type');
      return;
    }
    
    // Get form values
    const eventName = document.getElementById('eventTitle').value?.trim();
    const category = document.getElementById('eventCategory').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const venue = document.getElementById('eventLocation').value?.trim();
    const description = document.getElementById('eventDescription').value?.trim();
    const status = document.getElementById('eventStatus')?.value || 'active';
    const isFeatured = document.getElementById('isFeatured')?.checked || false;
    
    // Validate all fields
    if (!eventName || !category || !eventDate || !eventTime || !venue || !description) {
      console.warn('Missing required fields');
      alert('Please fill all required fields');
      return;
    }
    
    if (!bannerBase64) {
      console.warn('No banner image uploaded');
      alert('Please upload an event banner image');
      return;
    }
    
    // Validate future date
    const selectedDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      console.warn('Past date selected');
      alert('Please select a future date');
      return;
    }
    
    // Extract ticket prices
    let priceSingle = 0, priceCouple = 0, priceGroup5 = 0, priceGroup10 = 0, priceGroup20 = 0;
    
    currentTicketTypes.forEach(ticket => {
      if (ticket.name === 'Single Pass') priceSingle = ticket.price;
      else if (ticket.name === 'Couple Pass') priceCouple = ticket.price;
      else if (ticket.name === 'Group of 5') priceGroup5 = ticket.price;
      else if (ticket.name === 'Group of 10') priceGroup10 = ticket.price;
      else if (ticket.name === 'Group of 20') priceGroup20 = ticket.price;
    });
    
    console.log('Event data:', {
      eventName,
      eventDate,
      eventTime,
      venue,
      priceSingle,
      priceCouple,
      priceGroup5,
      priceGroup10,
      priceGroup20
    });
    
    // Check if database is initialized
    if (!db) {
      throw new Error('Firebase database not initialized');
    }
    
    // Save event to Firestore
    console.log('Saving event to Firestore...');
    const docRef = await addDoc(collection(db, "events"), {
      eventName: eventName,
      eventDate: eventDate,
      eventTime: eventTime,
      venue: venue,
      priceSingle: priceSingle,
      priceCouple: priceCouple,
      priceGroup5: priceGroup5,
      priceGroup10: priceGroup10,
      priceGroup20: priceGroup20,
      status: status,
      createdAt: new Date(),
      description: description,
      category: category,
      featured: isFeatured,
      banner: bannerBase64
    });
    
    console.log('✓ Event saved to Firestore with ID:', docRef.id);
    
    showToast('success', 'Event Created!', eventName + ' added successfully');
    
    // Reset form
    initializeCreateForm();
    
    // Reload events and navigate
    await loadAdminEvents();
    setTimeout(() => switchAdminTab('events'), 300);
    
  } catch (error) {
    console.error('Error creating event:', error);
    alert('Error creating event: ' + error.message);
  }
}

// ==================== TICKET TYPES ====================
function addTicketType() {
  const container = document.getElementById('ticketsContainer');
  if (!container) return;
  
  const id = 'ticket-' + Date.now() + '-' + Math.random();
  const html = `
    <div class="ticket-form-group" id="${id}" style="background: var(--bg-tertiary); padding: var(--space-lg); border-radius: var(--radius-lg); margin-bottom: var(--space-md);">
      <div class="form-row">
        <div class="form-group">
          <label>Ticket Category *</label>
          <select class="ticket-category" onchange="togglePeoplePermitted(this)" required>
            <option value="">Select Category</option>
            <option value="Single Pass">Single Pass (1 person)</option>
            <option value="Couple Pass">Couple Pass (2 people)</option>
            <option value="Group of 5">Group of 5 (5 people)</option>
            <option value="Group of 10">Group of 10 (10 people)</option>
            <option value="Group of 20">Group of 20 (20 people)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Price (₹) *</label>
          <input type="number" placeholder="500" min="0" class="ticket-price" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>People Permitted *</label>
          <input type="number" placeholder="1" min="1" class="ticket-people-permitted" value="1" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g., Entry pass" class="ticket-desc">
        </div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeTicketType('${id}')">Remove</button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function togglePeoplePermitted(selectElement) {
  const ticketGroup = selectElement.closest('.ticket-form-group');
  const peoplePermittedInput = ticketGroup.querySelector('.ticket-people-permitted');
  const category = selectElement.value;
  
  // Auto-set people permitted based on category
  const categoryPeopleMap = {
    'Single Pass': 1,
    'Couple Pass': 2,
    'Group of 5': 5,
    'Group of 10': 10,
    'Group of 20': 20
  };
  
  if (categoryPeopleMap[category]) {
    peoplePermittedInput.value = categoryPeopleMap[category];
  }
}

function removeTicketType(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function saveTicketTypes() {
  currentTicketTypes = [];
  const groups = document.querySelectorAll('.ticket-form-group');
  
  groups.forEach(group => {
    const category = group.querySelector('.ticket-category')?.value?.trim();
    const price = parseFloat(group.querySelector('.ticket-price')?.value || 0);
    const peoplePermitted = parseInt(group.querySelector('.ticket-people-permitted')?.value || 1);
    const desc = group.querySelector('.ticket-desc')?.value?.trim() || '';
    
    if (category && price > 0) {
      currentTicketTypes.push({
        id: 'type-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: category,
        category: category,
        price,
        peoplePermitted,
        description: desc,
        maxUses: peoplePermitted
      });
    }
  });
  
  return currentTicketTypes.length > 0;
}

// ==================== BANNER UPLOAD ====================
function handleBannerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    bannerBase64 = e.target.result;
    const img = document.getElementById('bannerImg');
    if (img) img.src = bannerBase64;
    const preview = document.getElementById('bannerPreview');
    if (preview) preview.style.display = 'block';
    const text = document.getElementById('bannerText');
    if (text) text.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeBanner() {
  bannerBase64 = null;
  const input = document.getElementById('bannerInput');
  if (input) input.value = '';
  const preview = document.getElementById('bannerPreview');
  if (preview) preview.style.display = 'none';
  const text = document.getElementById('bannerText');
  if (text) text.style.display = 'block';
}

// ==================== VENUE ====================
function updateVenueOptions() {
  const type = document.getElementById('venueType')?.value;
  const section = document.getElementById('manualVenueSection');
  if (section) {
    section.style.display = type === 'decided' ? 'block' : 'none';
  }
}

// ==================== ANALYTICS (FIREBASE-POWERED) ====================
// Analytics state
let analyticsRefreshInterval = null;
let analyticsEventsUnsubscribe = null;
let analyticsTicketsUnsubscribe = null;

async function loadAnalytics() {
  try {
    // Set loading state
    setAnalyticsLoading(true);

    // Stop previous listeners
    if (analyticsEventsUnsubscribe) analyticsEventsUnsubscribe();
    if (analyticsTicketsUnsubscribe) analyticsTicketsUnsubscribe();

    // Function to process and update analytics
    const updateAnalyticsUI = (events, tickets) => {
      let totalEvents = events.length;
      let activeEvents = events.filter(e => e.status === "active").length;
      let totalTickets = tickets.length;
      let usedTickets = tickets.filter(t => t.used).length;
      let pendingTickets = tickets.filter(t => !t.used).length;
      let totalRevenue = 0;
      let perEventStats = {};

      // Build per-event stats
      events.forEach(event => {
        const eventName = event.eventName || 'Untitled Event';
        if (!perEventStats[eventName]) {
          perEventStats[eventName] = {
            sold: 0,
            checkedIn: 0,
            pending: 0,
            revenue: 0
          };
        }
      });

      tickets.forEach(ticket => {
        totalRevenue += Number(ticket.price || 0);
        const eventName = ticket.eventName || ticket.eventTitle || 'Unknown Event';
        if (!perEventStats[eventName]) {
          perEventStats[eventName] = {
            sold: 0,
            checkedIn: 0,
            pending: 0,
            revenue: 0
          };
        }
        perEventStats[eventName].sold++;
        perEventStats[eventName].revenue += Number(ticket.price || 0);
        if (ticket.used) {
          perEventStats[eventName].checkedIn++;
        } else {
          perEventStats[eventName].pending++;
        }
      });

      // Update UI with animations
      animateAnalyticsCard('totalEvents', totalEvents);
      animateAnalyticsCard('activeEvents', activeEvents);
      animateAnalyticsCard('totalTickets', totalTickets);
      animateAnalyticsCard('usedTickets', usedTickets);
      animateAnalyticsCard('pendingTickets', pendingTickets);
      updateAnalyticsCardWithRevenue('totalRevenue', totalRevenue);

      // Display per-event statistics
      displayPerEventStats(perEventStats);

      // Get and display recent items
      const ticketsList = tickets
        .sort((a, b) => (b.purchaseDate || b.createdAt || 0) - (a.purchaseDate || a.createdAt || 0))
        .slice(0, 5);
      
      const eventsList = events
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);

      displayRecentTickets(ticketsList);
      displayRecentEvents(eventsList);

      console.log('✓ Analytics synced:', { totalEvents, activeEvents, totalTickets, usedTickets, pendingTickets, totalRevenue });
    };

    // Load initial data
    const eventsSnap = await getDocs(collection(db, "events"));
    const ticketsSnap = await getDocs(collection(db, "tickets"));
    
    let currentEvents = [];
    let currentTickets = [];

    eventsSnap.forEach(doc => {
      currentEvents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    ticketsSnap.forEach(doc => {
      currentTickets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    updateAnalyticsUI(currentEvents, currentTickets);

    // Set up real-time listeners
    analyticsEventsUnsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      currentEvents = [];
      snapshot.forEach(doc => {
        currentEvents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      updateAnalyticsUI(currentEvents, currentTickets);
    });

    analyticsTicketsUnsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      currentTickets = [];
      snapshot.forEach(doc => {
        currentTickets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      updateAnalyticsUI(currentEvents, currentTickets);
    });

    // Clear loading state
    setAnalyticsLoading(false);
    console.log('✓ Analytics real-time sync enabled');

  } catch (error) {
    console.error('❌ Error loading analytics:', error);
    setAnalyticsLoading(false);
    showAnalyticsError('Failed to load analytics. Check console.');
  }
}

function setAnalyticsLoading(isLoading) {
  const cards = document.querySelectorAll('.analytics-card');
  cards.forEach(card => {
    if (isLoading) {
      card.style.opacity = '0.6';
      const value = card.querySelector('.analytics-value');
      if (value) value.textContent = 'Loading...';
    } else {
      card.style.opacity = '1';
    }
  });
}

function animateAnalyticsCard(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  // Animate number increase
  const currentValue = parseInt(element.textContent) || 0;
  const increment = Math.max(1, Math.ceil((value - currentValue) / 10));
  let count = currentValue;

  const counter = setInterval(() => {
    count += increment;
    if (count >= value) {
      element.textContent = value;
      clearInterval(counter);
    } else {
      element.textContent = count;
    }
  }, 30);
}

function updateAnalyticsCardWithRevenue(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  // Animate revenue with rupee symbol
  const currentValue = parseInt(element.textContent.replace(/[₹,]/g, '')) || 0;
  const increment = Math.max(1, Math.ceil((value - currentValue) / 10));
  let count = currentValue;

  const counter = setInterval(() => {
    count += increment;
    if (count >= value) {
      element.textContent = '₹' + value.toLocaleString('en-IN');
      clearInterval(counter);
    } else {
      element.textContent = '₹' + count.toLocaleString('en-IN');
    }
  }, 30);
}

function showAnalyticsError(message) {
  const analyticsGrid = document.querySelector('.analytics-grid');
  if (analyticsGrid) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'grid-column: 1/-1; padding: var(--space-lg); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-lg); color: #ef4444; text-align: center;';
    errorDiv.textContent = '⚠️ ' + message;
    analyticsGrid.appendChild(errorDiv);
  }
}

function displayRecentTickets(tickets) {
  const container = document.getElementById('recentTicketsContainer');
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--space-lg);">No tickets sold yet</p>';
    return;
  }

  container.innerHTML = '<h3 style="margin-bottom: var(--space-md);">Recent Tickets</h3>' + 
    '<div style="display: flex; flex-direction: column; gap: var(--space-sm);">' +
    tickets.map(ticket => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
        <div>
          <p style="font-weight: 600; margin: 0;">${ticket.customerName || 'Unknown'}</p>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 4px 0 0;">${ticket.ticketType || 'General'}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: 600; margin: 0;">₹${Number(ticket.price || 0).toLocaleString('en-IN')}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 0;">${new Date(ticket.purchaseDate || Date.now()).toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    `).join('') +
    '</div>';
}

function displayRecentEvents(events) {
  const container = document.getElementById('recentEventsContainer');
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--space-lg);">No events created yet</p>';
    return;
  }

  container.innerHTML = '<h3 style="margin-bottom: var(--space-md);">Recent Events</h3>' +
    '<div style="display: flex; flex-direction: column; gap: var(--space-sm);">' +
    events.map(event => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
        <div style="flex: 1;">
          <p style="font-weight: 600; margin: 0;">${event.eventName || 'Untitled'}</p>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 4px 0 0;">📅 ${new Date(event.eventDate || Date.now()).toLocaleDateString('en-IN')}</p>
        </div>
        <div>
          <span style="display: inline-block; padding: 4px 12px; background: ${event.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; color: ${event.status === 'active' ? '#22c55e' : '#6b7280'}; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${event.status === 'active' ? '🟢 Active' : '⭕ Inactive'}</span>
        </div>
      </div>
    `).join('') +
    '</div>';
}

function displayPerEventStats(perEventStats) {
  const container = document.getElementById('perEventStatsContainer');
  if (!container) return;

  const events = Object.entries(perEventStats).sort((a, b) => b[1].sold - a[1].sold);

  if (events.length === 0) {
    container.innerHTML = '<div class="glass-card" style="grid-column: 1/-1; padding: var(--space-lg); text-align: center; color: var(--text-muted);">No events with ticket data yet</div>';
    return;
  }

  container.innerHTML = events.map(([eventName, stats]) => `
    <div class="glass-card" style="padding: var(--space-lg);">
      <div style="margin-bottom: var(--space-lg);">
        <h4 style="margin: 0 0 var(--space-sm) 0;">${eventName}</h4>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); font-size: 0.875rem;">
        <div>
          <p style="color: var(--text-muted); margin: 0 0 4px 0;">Sold</p>
          <p style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-primary);">${stats.sold}</p>
        </div>
        <div>
          <p style="color: var(--text-muted); margin: 0 0 4px 0;">Revenue</p>
          <p style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-primary);">₹${stats.revenue.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style="color: var(--text-muted); margin: 0 0 4px 0;">Checked In</p>
          <p style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #22c55e;">✓ ${stats.checkedIn}</p>
        </div>
        <div>
          <p style="color: var(--text-muted); margin: 0 0 4px 0;">Pending</p>
          <p style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #eab308;">⏳ ${stats.pending}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Auto-refresh analytics every 60 minutes (3,600,000 ms)
const ANALYTICS_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

function startAnalyticsRefresh() {
  if (analyticsRefreshInterval) {
    clearInterval(analyticsRefreshInterval);
  }
  analyticsRefreshInterval = setInterval(() => {
    loadAnalytics().catch(err => console.warn('Analytics refresh failed:', err));
  }, ANALYTICS_REFRESH_INTERVAL);
  console.log('✓ Analytics auto-refresh started: every 60 minutes');
}

function stopAnalyticsRefresh() {
  if (analyticsRefreshInterval) {
    clearInterval(analyticsRefreshInterval);
    analyticsRefreshInterval = null;
  }
  if (analyticsEventsUnsubscribe) {
    analyticsEventsUnsubscribe();
    analyticsEventsUnsubscribe = null;
  }
  if (analyticsTicketsUnsubscribe) {
    analyticsTicketsUnsubscribe();
    analyticsTicketsUnsubscribe = null;
  }
}

// Manual refresh function
async function refreshAnalyticsNow() {
  const btn = event.target.closest('button');
  if (!btn) return;

  // Add loading state
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2-8.83"></path></svg> Syncing...';

  try {
    await loadAnalytics();
    showToast('success', 'Synced', 'Analytics updated in real-time');
  } catch (error) {
    console.error('Error refreshing analytics:', error);
    showToast('error', 'Sync Failed', 'Could not update analytics');
  }

  // Restore button state
  btn.disabled = false;
  btn.innerHTML = originalHTML;
}

// ==================== EDIT EVENT ====================
function editEvent(eventId) {
  const event = adminEvents.find(e => e.id === eventId);
  if (!event) return;
  
  alert('Event editing coming soon');
}

// ==================== UTILITIES ====================

// ==================== GUEST LIST MANAGEMENT ====================
let allGuestTickets = [];
let filteredGuestTickets = [];
let guestListUnsubscribe = null;

async function loadGuestList() {
  try {
    console.log('📋 Loading guest list with real-time sync...');
    
    // Show loading state
    const container = document.getElementById('guestListContainer');
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: var(--space-2xl);">⏳ Loading guest list...</p>';
    }

    // Stop previous listener if exists
    if (guestListUnsubscribe) {
      guestListUnsubscribe();
    }

    // Set up real-time listener
    guestListUnsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      allGuestTickets = [];
      
      snapshot.forEach(doc => {
        allGuestTickets.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by latest first
      allGuestTickets.sort((a, b) => (b.createdAt || b.purchaseDate || 0) - (a.createdAt || a.purchaseDate || 0));
      
      // Populate event filter dropdown
      populateEventFilter();
      
      // Display all tickets
      filteredGuestTickets = [...allGuestTickets];
      displayGuestList(filteredGuestTickets);
      updateGuestListStats(filteredGuestTickets);
      
      console.log('✓ Real-time guest list synced:', allGuestTickets.length, 'tickets');
    }, (error) => {
      console.error('❌ Error listening to guest list:', error);
      const container = document.getElementById('guestListContainer');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: var(--space-2xl);">⚠️ Error syncing guest list</p>';
      }
    });

  } catch (error) {
    console.error('❌ Error loading guest list:', error);
    const container = document.getElementById('guestListContainer');
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: var(--space-2xl);">⚠️ Error loading guest list</p>';
    }
  }
}

function populateEventFilter() {
  const filterSelect = document.getElementById('guestListEventFilter');
  if (!filterSelect) return;

  // Get unique event names
  const events = [...new Set(allGuestTickets.map(t => t.eventName || t.eventTitle))].sort();
  
  // Clear and repopulate options
  filterSelect.innerHTML = '<option value="">All Events</option>';
  events.forEach(eventName => {
    if (eventName) {
      const option = document.createElement('option');
      option.value = eventName;
      option.textContent = eventName;
      filterSelect.appendChild(option);
    }
  });
}

function filterGuestList() {
  const eventFilter = document.getElementById('guestListEventFilter')?.value || '';
  const statusFilter = document.getElementById('guestListStatusFilter')?.value || '';
  const searchFilter = document.getElementById('guestListSearchInput')?.value.toLowerCase() || '';

  filteredGuestTickets = allGuestTickets.filter(ticket => {
    // Event filter
    if (eventFilter && (ticket.eventName || ticket.eventTitle) !== eventFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'used' && !ticket.used) return false;
    if (statusFilter === 'pending' && ticket.used) return false;

    // Search filter
    if (searchFilter) {
      const name = (ticket.customerName || '').toLowerCase();
      const email = (ticket.customerEmail || '').toLowerCase();
      const phone = (ticket.customerPhone || '').toLowerCase();
      return name.includes(searchFilter) || email.includes(searchFilter) || phone.includes(searchFilter);
    }

    return true;
  });

  displayGuestList(filteredGuestTickets);
  updateGuestListStats(filteredGuestTickets);
}

function displayGuestList(tickets) {
  const container = document.getElementById('guestListContainer');
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-2xl); color: var(--text-muted);">
        <p style="font-size: 1.125rem; margin-bottom: var(--space-sm);">📭 No guests found</p>
        <p style="font-size: 0.875rem;">Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  // Create responsive table
  let html = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--glass-border); background: var(--bg-tertiary);">
            <th style="padding: var(--space-md); text-align: left; font-weight: 600;">Name</th>
            <th style="padding: var(--space-md); text-align: left; font-weight: 600;">Email</th>
            <th style="padding: var(--space-md); text-align: left; font-weight: 600;">Phone</th>
            <th style="padding: var(--space-md); text-align: left; font-weight: 600;">Event</th>
            <th style="padding: var(--space-md); text-align: left; font-weight: 600;">Ticket Type</th>
            <th style="padding: var(--space-md); text-align: right; font-weight: 600;">Amount</th>
            <th style="padding: var(--space-md); text-align: center; font-weight: 600;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  tickets.forEach(ticket => {
    const statusBadge = ticket.used 
      ? '<span style="display: inline-block; padding: 4px 12px; background: rgba(34, 197, 94, 0.2); color: #22c55e; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">✓ Used</span>'
      : '<span style="display: inline-block; padding: 4px 12px; background: rgba(234, 179, 8, 0.2); color: #eab308; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">⏳ Pending</span>';

    html += `
      <tr style="border-bottom: 1px solid var(--glass-border); hover: background: var(--bg-tertiary);">
        <td style="padding: var(--space-md);">${ticket.customerName || '-'}</td>
        <td style="padding: var(--space-md);">${ticket.customerEmail || '-'}</td>
        <td style="padding: var(--space-md);">${ticket.customerPhone || '-'}</td>
        <td style="padding: var(--space-md);">${ticket.eventName || ticket.eventTitle || '-'}</td>
        <td style="padding: var(--space-md);">${ticket.ticketType || '-'}</td>
        <td style="padding: var(--space-md); text-align: right; font-weight: 600;">₹${Number(ticket.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding: var(--space-md); text-align: center;">${statusBadge}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function updateGuestListStats(tickets) {
  const usedCount = tickets.filter(t => t.used).length;
  const pendingCount = tickets.filter(t => !t.used).length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (Number(t.price || 0)), 0);

  const totalEl = document.getElementById('guestListTotalTickets');
  const usedEl = document.getElementById('guestListUsedTickets');
  const pendingEl = document.getElementById('guestListPendingTickets');
  const revenueEl = document.getElementById('guestListTotalRevenue');

  if (totalEl) totalEl.textContent = tickets.length;
  if (usedEl) usedEl.textContent = usedCount;
  if (pendingEl) pendingEl.textContent = pendingCount;
  if (revenueEl) revenueEl.textContent = '₹' + totalRevenue.toLocaleString('en-IN');
}

async function refreshGuestList() {
  const btn = event.target.closest('button');
  if (btn) {
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2-8.83"></path></svg> Refreshing...';
    
    await loadGuestList();
    
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    showToast('success', 'Refreshed', 'Guest list updated');
  }
}

function exportGuestListCSV() {
  if (filteredGuestTickets.length === 0) {
    showToast('info', 'No Data', 'No tickets to export');
    return;
  }

  // Prepare CSV data
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Name,Email,Phone,Event Name,Ticket Type,Price,Status,Purchase Date\n';

  filteredGuestTickets.forEach(ticket => {
    const status = ticket.used ? 'Used' : 'Pending';
    const purchaseDate = new Date(ticket.purchaseDate || ticket.createdAt || Date.now()).toLocaleDateString('en-IN');
    const row = [
      `"${ticket.customerName || ''}"`,
      `"${ticket.customerEmail || ''}"`,
      `"${ticket.customerPhone || ''}"`,
      `"${ticket.eventName || ticket.eventTitle || ''}"`,
      `"${ticket.ticketType || ''}"`,
      ticket.price || '0',
      status,
      purchaseDate
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `guest-list-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', 'Exported', 'Guest list downloaded as CSV');
}

function closeTicketModal() {

  const modal = document.getElementById('ticketModal');
  if (modal) modal.style.display = 'none';
}

function downloadTicket() {
  alert('Ticket download feature is available in user dashboard');
}

function showToast(type, title, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

console.log('✓ Admin Portal Ready');

// ==================== EXPORT FUNCTIONS TO WINDOW ====================
window.initializeAdmin = initializeAdmin;
window.showAdminLogin = showAdminLogin;
window.handleAdminLogin = handleAdminLogin;
window.logoutAdmin = logoutAdmin;
window.switchAdminTab = switchAdminTab;
window.handleCreateEvent = handleCreateEvent;
window.addTicketType = addTicketType;
window.removeTicketType = removeTicketType;
window.handleBannerUpload = handleBannerUpload;
window.removeBanner = removeBanner;
window.updateVenueOptions = updateVenueOptions;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.changeEventStatus = changeEventStatus;
window.loadAdminEvents = loadAdminEvents;
window.togglePeoplePermitted = togglePeoplePermitted;
window.closeTicketModal = closeTicketModal;
window.downloadTicket = downloadTicket;
window.showToast = showToast;
window.loadAnalytics = loadAnalytics;
window.startAnalyticsRefresh = startAnalyticsRefresh;
window.stopAnalyticsRefresh = stopAnalyticsRefresh;
window.refreshAnalyticsNow = refreshAnalyticsNow;
window.loadGuestList = loadGuestList;
window.filterGuestList = filterGuestList;
window.refreshGuestList = refreshGuestList;
window.exportGuestListCSV = exportGuestListCSV;

console.log('✓ All admin functions exported to window');

// Verify critical functions are accessible
if (typeof window.handleCreateEvent !== 'function') {
  console.error('ERROR: handleCreateEvent is not accessible!');
} else {
  console.log('✓ handleCreateEvent is available globally');
}

if (typeof window.switchAdminTab !== 'function') {
  console.error('ERROR: switchAdminTab is not accessible!');
} else {
  console.log('✓ switchAdminTab is available globally');
}

if (typeof window.addTicketType !== 'function') {
  console.error('ERROR: addTicketType is not accessible!');
} else {
  console.log('✓ addTicketType is available globally');
}