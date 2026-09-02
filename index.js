const STORAGE_KEYS = {
  appState: 'shareAPlateState',
  users: 'shareAPlateUsers',
  listings: 'shareAPlateListings',
  dispatches: 'shareAPlateDispatches',
  menuItems: 'shareAPlateMenuItems',
};

const initialMenu = [
  { name: 'Paneer Masala & Rice', qty: 80, prodTime: '2h', expiryTime: '4h' },
  { name: 'Chicken Rolls', qty: 15, prodTime: '1h', expiryTime: '3h' },
  { name: 'Sandwiches', qty: 10, prodTime: '1h', expiryTime: '12h' },
  { name: 'Veg Biryani', qty: 50, prodTime: '3h', expiryTime: '4h' },
  { name: 'Fruit Boxes', qty: 30, prodTime: '1h', expiryTime: '8h' }
];

const seededListings = [
  {
    id: 'listing-1',
    title: 'Royal Banquet Caterers',
    item: 'Paneer Masala & Rice',
    quantity: 80,
    type: 'catering',
    priority: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    donor: 'Royal Banquet Caterers',
    status: 'active',
    pin: null,
    category: 'A',
    coords: [28.6139, 77.2090],
    address: 'Connaught Place, Delhi'
  },
  {
    id: 'listing-2',
    title: 'City Central Kitchen',
    item: 'Chicken Rolls',
    quantity: 15,
    type: 'meal',
    priority: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    donor: 'City Central Kitchen',
    status: 'active',
    pin: null,
    category: 'A',
    coords: [28.6205, 77.2150],
    address: 'Karol Bagh, Delhi'
  },
  {
    id: 'listing-3',
    title: 'Apex Bakery',
    item: 'Packaged Sandwiches',
    quantity: 10,
    type: 'packaged',
    priority: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    donor: 'Apex Bakery',
    status: 'active',
    pin: null,
    category: 'B',
    coords: [28.5512, 77.2107],
    address: 'Dwarka, Delhi'
  }
];

function getDefaultState() {
  return {
    currentView: 'view-1',
    currentUser: null,
    users: [],
    listings: [],
    dispatches: [],
    menuItems: [],
    pendingDonor: null,
    lastClaimedPin: null,
    credits: 150000
  };
}

function readStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedData() {
  const users = readStorage(STORAGE_KEYS.users, []);
  const listings = readStorage(STORAGE_KEYS.listings, []);
  const dispatches = readStorage(STORAGE_KEYS.dispatches, []);
  const menuItems = readStorage(STORAGE_KEYS.menuItems, []);

  if (!users.length) saveStorage(STORAGE_KEYS.users, []);
  if (!listings.length) saveStorage(STORAGE_KEYS.listings, seededListings);
  if (!dispatches.length) saveStorage(STORAGE_KEYS.dispatches, []);
  if (!menuItems.length) saveStorage(STORAGE_KEYS.menuItems, initialMenu);

  const state = readStorage(STORAGE_KEYS.appState, null);
  if (!state) {
    saveStorage(STORAGE_KEYS.appState, getDefaultState());
  }
}

function getState() {
  return readStorage(STORAGE_KEYS.appState, getDefaultState());
}

function setState(nextState) {
  saveStorage(STORAGE_KEYS.appState, nextState);
}

function updateCurrentUserInfo() {
  const state = getState();
  const profileInitial = document.getElementById('profileInitial');
  if (profileInitial) {
    profileInitial.textContent = state.currentUser ? state.currentUser.name.charAt(0).toUpperCase() : 'R';
  }

  const creditsBadge = document.getElementById('creditsBadge');
  if (creditsBadge) {
    creditsBadge.textContent = `Karma Credits: ${Number(state.credits || 150000).toLocaleString('en-IN', { maximumFractionDigits: 3 })}`;
  }
}

function switchView(viewId) {
  const state = getState();
  state.currentView = viewId;
  setState(state);

  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('active', el.id === viewId);
  });

  document.querySelectorAll('.toolbar-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('open');
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function createUser(payload) {
  const users = readStorage(STORAGE_KEYS.users, []);
  const user = { id: generateId('user'), ...payload };
  users.push(user);
  saveStorage(STORAGE_KEYS.users, users);
  return user;
}

function addMenuItem(item) {
  const menuItems = readStorage(STORAGE_KEYS.menuItems, initialMenu);
  const match = menuItems.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
  if (!match) {
    menuItems.push(item);
    saveStorage(STORAGE_KEYS.menuItems, menuItems);
  }
}

function getDisplayNameForUser(user) {
  if (!user) return 'R';
  return (user.name || user.orgName || user.userId || 'R').trim().charAt(0).toUpperCase();
}

function renderMenuOptions() {
  const select = document.getElementById('dispatchMenuSelect');
  const menuItems = readStorage(STORAGE_KEYS.menuItems, initialMenu);
  select.innerHTML = menuItems
    .map((item, index) => `<option value="${index}">${item.name} (${item.qty})</option>`)
    .join('');
}

function populateToolbarButtons(buttons) {
  const toolbarInner = document.getElementById('toolbarInner');
  if (!toolbarInner || !buttons) return;
  toolbarInner.innerHTML = buttons.map((label, index) => `
    <button class="toolbar-btn ${index === 0 ? 'active' : ''}" data-view="view-${index + 1}">${label}</button>
  `).join('');
}

function populateNav(items) {
  const nav = document.getElementById('navLinks');
  if (!nav || !items) return;
  nav.innerHTML = items.map((item) => `<a href="#">${item}</a>`).join('');
}

function populateImpactStats(stats) {
  const mainValue = document.getElementById('impactMainValue');
  const mainLabel = document.getElementById('impactMainLabel');
  const grid = document.getElementById('impactStatsGrid');
  if (!stats || !mainValue || !mainLabel || !grid) return;

  const [primary, ...rest] = stats;
  mainValue.textContent = primary.value;
  mainLabel.textContent = primary.label;

  grid.innerHTML = rest.map((item) => `
    <div class="mini-stat">
      <strong>${item.value}</strong>
      <span>${item.label}</span>
    </div>
  `).join('');
}

function populateForms(config) {
  const labels = {
    beneficiaryTypeLabel: config.beneficiary.typeLabel,
    beneficiaryIdLabel: config.beneficiary.idLabel,
    beneficiarySubmitBtn: config.beneficiary.submit,
    donorTypeLabel: config.donor.typeLabel,
    donorIdLabel: config.donor.idLabel,
    donorSubmitBtn: config.donor.submit,
    loginTitle: config.login.title,
    loginUserLabel: config.login.userLabel,
    loginPasswordLabel: config.login.passwordLabel,
    loginSubmitBtn: config.login.submit,
    dispatchTitle: config.dispatch.title,
    dispatchMenuLabel: config.dispatch.menuLabel,
    dispatchQuantityLabel: config.dispatch.quantityLabel,
    dispatchWindowLabel: config.dispatch.windowLabel,
    priorityLabel: config.dispatch.priorityLabel,
    dispatchSubmitBtn: config.dispatch.submit,
  };

  Object.entries(labels).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  });

  const beneficiarySelect = document.getElementById('beneficiaryType');
  beneficiarySelect.innerHTML = '<option value="">Select</option>' + config.beneficiary.options.map((option) => `
    <option>${option}</option>
  `).join('');

  const donorSelect = document.getElementById('donorType');
  donorSelect.innerHTML = '<option value="">Select</option>' + config.donor.options.map((option) => `
    <option>${option}</option>
  `).join('');

  document.getElementById('beneficiaryId').placeholder = config.beneficiary.idPlaceholder;
  document.getElementById('donorId').placeholder = config.donor.idPlaceholder;
}

function loadSiteContent() {
  return fetch('./data/site-data.json')
    .then((response) => response.json())
    .then((data) => {
      const app = data.app;
      const forms = data.forms;

      document.getElementById('brandName').textContent = app.name;
      document.getElementById('brandMark').textContent = app.brandMark;
      document.getElementById('eyebrow').textContent = app.eyebrow;
      document.getElementById('heroTitle').textContent = app.tagline;
      document.getElementById('heroSubtitle').textContent = app.heroSubtitle;

      populateToolbarButtons(data.toolbar.buttons);
      populateNav(app.navLinks);
      populateImpactStats(app.impactStats);
      populateForms(forms);

      document.querySelectorAll('.toolbar-btn').forEach((button) => {
        button.addEventListener('click', () => switchView(button.dataset.view));
      });
    });
}

function renderFeed() {
  const feed = document.getElementById('feedList');
  const listings = readStorage(STORAGE_KEYS.listings, seededListings);

  if (!feed) return;

  const sorted = [...listings].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return new Date(a.expiresAt) - new Date(b.expiresAt);
  });

  feed.innerHTML = sorted.map((listing) => {
    const timeLeft = getCountdownText(listing.expiresAt);
    const tagClass = listing.priority ? 'priority' : listing.type === 'packaged' ? 'packaged' : 'meal';
    const label = listing.priority ? '⚡ Priority' : listing.type === 'packaged' ? 'Packaged' : 'Prepared';
    return `
      <div class="listing-card ${listing.priority ? 'priority' : ''}">
        <div class="listing-head">
          <div>
            <strong>${listing.title}</strong>
          </div>
          <span class="tag ${tagClass}">${label}</span>
        </div>
        <div style="color: var(--muted); margin: 8px 0;">
          ${listing.item} • ${listing.quantity} meals
        </div>
        <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 0.8rem; color: var(--muted);">
          <span>Pickup: ${timeLeft}</span>
          <span>${listing.address || 'Delhi'}</span>
        </div>
        <button class="claim-btn" data-id="${listing.id}">Claim Meals</button>
      </div>
    `;
  }).join('');
}

function renderMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  if (window.shareAPlateMap) {
    window.shareAPlateMap.remove();
  }

  const map = L.map('map').setView([28.6139, 77.2090], 12);
  window.shareAPlateMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  listings.forEach((listing) => {
    const color = listing.priority ? '#f59e0b' : listing.type === 'packaged' ? '#10b981' : '#f97316';
    const marker = L.circleMarker(listing.coords, {
      radius: listing.priority ? 12 : 10,
      color: '#fff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.9
    }).addTo(map);

    marker.bindPopup(`
      <div>
        <strong>${listing.title}</strong><br />
        ${listing.item}<br />
        Qty: ${listing.quantity}<br />
        ${listing.priority ? 'Priority catering batch' : 'Community dispatch'}
      </div>
    `);
  });

  const routeLine = [
    [28.6139, 77.2090],
    [28.6205, 77.2150],
    [28.5512, 77.2107]
  ];

  L.polyline(routeLine, {
    color: '#10b981',
    weight: 3,
    opacity: 0.7,
    dashArray: '10, 12'
  }).addTo(map);
}

function getCountdownText(targetTs) {
  const diff = targetTs - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
}

function renderHub() {
  const hubList = document.getElementById('hubList');
  if (!hubList) return;

  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  hubList.innerHTML = listings.map((listing) => `
    <div class="hub-card">
      <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center;">
        <strong>${listing.title}</strong>
        <span class="tag ${listing.priority ? 'priority' : listing.type === 'packaged' ? 'packaged' : 'meal'}">${listing.priority ? 'Priority' : listing.type}</span>
      </div>
      <div style="margin-top: 8px; color: var(--muted);">${listing.item} • ${listing.quantity} meals</div>
      <div style="margin-top: 14px; font-size: 0.85rem; color: var(--muted);">PIN: ${listing.pin || 'Awaiting claim'}</div>
      <div class="hub-actions">
        <button class="hub-btn a" data-category="A" data-id="${listing.id}">Category A</button>
        <button class="hub-btn b" data-category="B" data-id="${listing.id}">Category B</button>
        <button class="hub-btn c" data-category="C" data-id="${listing.id}">Category C</button>
      </div>
    </div>
  `).join('');
}

function renderDashboardMetrics() {
  const pending = readStorage(STORAGE_KEYS.listings, seededListings).filter((listing) => listing.status === 'active').length;
  const pendingEl = document.getElementById('pendingRequests');
  if (pendingEl) pendingEl.textContent = pending;

  const statusList = document.getElementById('statusList');
  if (statusList) {
    const counts = {
      inspection: 1,
      active: Math.max(1, pending),
      completed: 0
    };
    const items = [
      { label: 'Under Inspection', value: counts.inspection, cls: 'inspection' },
      { label: 'Active on Feed', value: counts.active, cls: 'active' },
      { label: 'Completed', value: counts.completed, cls: 'completed' },
    ];
    statusList.innerHTML = items.map((item) => `
      <div class="status-item"><span>${item.label}</span><span class="dot ${item.cls}"></span></div>
    `).join('');
  }

  updateCurrentUserInfo();
}

function renderUserDetailForm() {
  const state = getState();
  if (!state.pendingDonor) return;
  const user = state.pendingDonor;
  document.getElementById('orgName').value = user.orgName || '';
  document.getElementById('orgAddress').value = user.address || '';
  document.getElementById('operatingHours').value = user.operatingHours || '';
  document.getElementById('userId').value = user.userId || '';
  document.getElementById('password').value = user.password || '';
  document.getElementById('donationType').value = user.donationType || 'Food';
  document.getElementById('donationInfo').value = user.donationInfo || '';
}

function setRoleAndLogin(user) {
  const state = getState();
  state.currentUser = user;
  state.credits = state.credits || 150000;
  setState(state);
  updateCurrentUserInfo();
}

function handleBeneficiaryRegister(event) {
  event.preventDefault();
  const role = 'beneficiary';
  const user = createUser({
    name: 'Beneficiary',
    role,
    type: document.getElementById('beneficiaryType').value,
    registrationNumber: document.getElementById('beneficiaryId').value,
    userId: `beneficiary-${Date.now()}`,
    password: 'demo123',
    createdAt: Date.now(),
  });
  setRoleAndLogin(user);
  showToast('Beneficiary account created.');
  switchView('view-4');
}

function handleDonorRegister(event) {
  event.preventDefault();
  const donorType = document.getElementById('donorType').value;
  const donorId = document.getElementById('donorId').value;

  const state = getState();
  state.pendingDonor = {
    name: donorType,
    role: 'donor',
    donorType,
    businessId: donorId,
    orgName: '',
    address: '',
    operatingHours: '',
    userId: '',
    password: '',
    donationType: 'Food',
    donationInfo: '',
    createdAt: Date.now(),
  };
  setState(state);
  switchView('view-2');
  document.getElementById('donorDetailCard').classList.remove('hidden');
  document.getElementById('inspectionState').classList.add('hidden');
}

function handleDonorDetailedRegister(event) {
  event.preventDefault();
  const state = getState();
  const donor = state.pendingDonor || {
    role: 'donor',
    name: 'Community Donor',
  };

  donor.orgName = document.getElementById('orgName').value;
  donor.address = document.getElementById('orgAddress').value;
  donor.operatingHours = document.getElementById('operatingHours').value;
  donor.userId = document.getElementById('userId').value;
  donor.password = document.getElementById('password').value;
  donor.donationType = document.getElementById('donationType').value;
  donor.donationInfo = document.getElementById('donationInfo').value;
  donor.status = 'under_inspection';
  donor.name = donor.orgName || donor.name;

  const user = createUser({
    ...donor,
    createdAt: Date.now(),
    inspectionStatus: 'under_inspection'
  });

  state.currentUser = user;
  state.pendingDonor = user;
  state.credits = 150000;
  setState(state);

  document.getElementById('donorDetailCard').classList.add('hidden');
  document.getElementById('inspectionState').classList.remove('hidden');
  showToast('Donor registration submitted for inspection.');
}

function handleAdminOverride() {
  const state = getState();
  const user = state.currentUser;
  if (user) {
    user.status = 'active';
    user.inspectionStatus = 'active';
    state.currentUser = user;
    setState(state);
    const users = readStorage(STORAGE_KEYS.users, []);
    const index = users.findIndex((entry) => entry.id === user.id);
    if (index >= 0) {
      users[index] = user;
      saveStorage(STORAGE_KEYS.users, users);
    }
    showToast('Inspection approved. Dashboard unlocked.');
    switchView('view-3');
    renderDashboardMetrics();
  }
}

function handleLogin(event) {
  event.preventDefault();
  const userId = document.getElementById('loginUserId').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const users = readStorage(STORAGE_KEYS.users, []);
  const match = users.find((user) => user.userId === userId && user.password === password);

  if (!match) {
    showToast('Invalid login');
    return;
  }

  const state = getState();
  state.currentUser = match;
  setState(state);
  closeModal('loginModal');
  showToast('Welcome back!');

  switchView(match.role === 'donor' ? 'view-3' : 'view-4');
}

function collectMenuEntries() {
  const rows = [...document.querySelectorAll('#menuBuilder .form-row')];
  const items = rows.map((row) => {
    const name = row.querySelector('.menu-name')?.value || '';
    const qty = row.querySelector('.menu-qty')?.value || 0;
    const prodTime = row.querySelector('.menu-prod')?.value || '1h';
    const expiryTime = row.querySelector('.menu-expiry')?.value || '4h';
    if (!name.trim()) return null;
    return { name: name.trim(), qty: Number(qty) || 1, prodTime, expiryTime };
  }).filter(Boolean);
  return items;
}

function handleAddMenuRow() {
  const menuBuilder = document.getElementById('menuBuilder');
  const clone = document.createElement('div');
  clone.className = 'form-row';
  clone.innerHTML = `
    <div class="form-group">
      <label>Food Item Name</label>
      <input class="menu-name" placeholder="Rice Bowl" />
    </div>
    <div class="form-group">
      <label>Default Qty</label>
      <input class="menu-qty" type="number" min="1" value="20" />
    </div>
    <div class="form-group">
      <label>Production Time</label>
      <input class="menu-prod" placeholder="1.5 hours" />
    </div>
    <div class="form-group">
      <label>Expiry Time</label>
      <input class="menu-expiry" placeholder="3 hours" />
    </div>
  `;
  menuBuilder.appendChild(clone);
}

function handleDispatchSubmit(event) {
  event.preventDefault();
  const menuItems = readStorage(STORAGE_KEYS.menuItems, initialMenu);
  const selectedIndex = document.getElementById('dispatchMenuSelect').value;
  const chosen = menuItems[Number(selectedIndex)] || menuItems[0];
  const qty = Number(document.getElementById('dispatchQty').value) || chosen.qty;
  const priority = document.getElementById('priorityBatch').checked;
  const windowLabel = document.getElementById('dispatchWindow').value || '2 hours';

  const expiresAt = Date.now() + (priority ? 3 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000);

  const dispatch = {
    id: generateId('dispatch'),
    title: (getState().currentUser && getState().currentUser.orgName) || 'Community Donor',
    item: chosen.name,
    quantity: qty,
    type: priority ? 'catering' : 'meal',
    priority,
    expiresAt,
    category: priority ? 'A' : 'A',
    status: 'active',
    donor: (getState().currentUser && getState().currentUser.orgName) || 'Community Donor',
    coords: [28.6139 + (Math.random() - 0.5) * 0.08, 77.2090 + (Math.random() - 0.5) * 0.08],
    address: 'South Delhi'
  };

  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  listings.push(dispatch);
  saveStorage(STORAGE_KEYS.listings, listings);

  const state = getState();
  if (priority) {
    state.credits = Number(state.credits || 150000) + (qty * 3);
  }
  setState(state);

  renderFeed();
  renderMap();
  renderHub();
  renderDashboardMetrics();
  updateCurrentUserInfo();
  closeModal('dispatchModal');
  showToast(priority ? 'Priority catering batch dispatched with 3x EcoCredits.' : 'Dispatch submitted for review.');
}

function handleClaim(listingId) {
  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  const target = listings.find((item) => item.id === listingId);
  if (!target) return;

  const pin = generatePin();
  target.pin = pin;
  target.status = 'claimed';
  saveStorage(STORAGE_KEYS.listings, listings);

  showToast(`Pin generated: ${pin}`);
  renderFeed();
  renderHub();
}

function handleHubCategoryClick(event) {
  const button = event.target.closest('.hub-btn');
  if (!button) return;
  const id = button.dataset.id;
  const category = button.dataset.category;
  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  const listing = listings.find((item) => item.id === id);
  if (!listing) return;
  listing.category = category;
  listing.status = category === 'C' ? 'diverted' : 'reviewed';
  saveStorage(STORAGE_KEYS.listings, listings);
  showToast(`Batch classified as Category ${category}.`);
  renderHub();
}

function handlePinComplete() {
  const input = document.getElementById('pinInput');
  const pin = input.value.trim();
  const listings = readStorage(STORAGE_KEYS.listings, seededListings);
  const match = listings.find((item) => item.pin && item.pin === pin);
  if (!match) {
    showToast('Incorrect or missing PIN.');
    return;
  }

  const state = getState();
  state.credits = Number(state.credits || 150000) + 1500;
  setState(state);
  match.status = 'completed';
  match.pin = null;
  saveStorage(STORAGE_KEYS.listings, listings);
  input.value = '';
  updateCurrentUserInfo();
  renderDashboardMetrics();
  renderFeed();
  renderHub();
  showToast('Transaction completed and EcoCredits awarded.');
}

function setJoinRole(role) {
  const toggle = document.getElementById('joinRoleToggle');
  const tabs = document.querySelectorAll('.join-role-option');
  const panels = document.querySelectorAll('.join-panel');

  if (!toggle || !tabs.length || !panels.length) return;

  toggle.style.setProperty('--slider-position', role === 'donor' ? '50%' : '0%');

  tabs.forEach((tab) => {
    const isActive = tab.dataset.joinRole === role;
    tab.classList.toggle('active', isActive);
  });

  panels.forEach((panel) => {
    const isActive = panel.id === (role === 'donor' ? 'donorForm' : 'beneficiaryForm');
    panel.classList.toggle('active', isActive);
  });
}

function bindEvents() {
  document.getElementById('joinUsBtn').addEventListener('click', () => {
    switchView('view-join');
  });

  document.querySelectorAll('.join-role-option').forEach((tab) => {
    tab.addEventListener('click', () => setJoinRole(tab.dataset.joinRole));
  });

  document.getElementById('loginLink').addEventListener('click', () => openModal('loginModal'));
  document.getElementById('beneficiaryForm').addEventListener('submit', handleBeneficiaryRegister);
  document.getElementById('donorForm').addEventListener('submit', handleDonorRegister);
  document.getElementById('donorDetailForm').addEventListener('submit', handleDonorDetailedRegister);
  document.getElementById('approveInspectionBtn').addEventListener('click', handleAdminOverride);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('addMenuRow').addEventListener('click', handleAddMenuRow);
  document.getElementById('dispatchForm').addEventListener('submit', handleDispatchSubmit);
  document.getElementById('openDispatchBtn').addEventListener('click', () => openModal('dispatchModal'));
  document.getElementById('completePinBtn').addEventListener('click', handlePinComplete);
  document.getElementById('dispatchModal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('dispatchModal')) closeModal('dispatchModal');
  });
  document.getElementById('loginModal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('loginModal')) closeModal('loginModal');
  });
  document.getElementById('feedList').addEventListener('click', (event) => {
    const button = event.target.closest('.claim-btn');
    if (!button) return;
    handleClaim(button.dataset.id);
  });

  document.getElementById('hubList').addEventListener('click', handleHubCategoryClick);
}

async function init() {
  ensureSeedData();
  await loadSiteContent();
  renderMenuOptions();
  renderFeed();
  renderMap();
  renderHub();
  renderDashboardMetrics();
  updateCurrentUserInfo();
  bindEvents();
  setJoinRole('beneficiary');
  switchView(getState().currentView || 'view-1');
}

document.addEventListener('DOMContentLoaded', init);
