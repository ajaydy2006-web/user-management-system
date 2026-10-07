// Global State
let authState = {
  user: 'admin',
  pass: 'admin123',
};
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let currentRoleFilter = '';
let currentStatusFilter = '';
let currentEditId = null;

const sampleNewUserJSON = JSON.stringify(
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    department: 'UI/UX Design',
    phone: '+1 555-0155',
    bio: 'Product Designer specializing in design systems and accessibility.',
  },
  null,
  2
);

// Helper to get Basic Auth Header
function getAuthHeader() {
  const credentials = `${authState.user}:${authState.pass}`;
  return 'Basic ' + btoa(credentials);
}

// Fetch helper wrapper
async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = performance.now();
  const res = await fetch(endpoint, options);
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { error: 'Invalid JSON response from server' };
  }

  return {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    data,
    duration,
  };
}

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupEventListeners();
  loadDashboardStats();
  loadUsersTable();
});

// Tab Navigation
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchToTab(tabId);
    });
  });
}

function switchToTab(tabId) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));

  const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  const activePage = document.getElementById(tabId);

  if (activeBtn) activeBtn.classList.add('active');
  if (activePage) activePage.classList.add('active');

  if (tabId === 'dashboard-tab') {
    loadDashboardStats();
  } else if (tabId === 'users-tab') {
    loadUsersTable();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Global Search
  const searchInput = document.getElementById('globalSearchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.trim();
      currentPage = 1;
      loadUsersTable();
    }, 300);
  });

  // Filters
  document.getElementById('roleFilter').addEventListener('change', (e) => {
    currentRoleFilter = e.target.value;
    currentPage = 1;
    loadUsersTable();
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    currentPage = 1;
    loadUsersTable();
  });

  // Refresh Buttons
  document.getElementById('btnRefreshStats').addEventListener('click', loadDashboardStats);
  document.getElementById('btnRefreshUsers').addEventListener('click', loadUsersTable);

  // Pagination
  document.getElementById('btnPrevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadUsersTable();
    }
  });

  document.getElementById('btnNextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadUsersTable();
    }
  });

  // Seed Data Button
  document.getElementById('btnSeedData').addEventListener('click', handleSeedData);

  // Modal Open & Close
  document.getElementById('btnOpenCreateModal').addEventListener('click', openCreateModal);
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);

  // User Form Submit
  document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

  // API Tester Send Request Button
  document.getElementById('btnSendRequest').addEventListener('click', handleSendTesterRequest);

  // Auth Pill Click to Edit
  document.getElementById('authPill').addEventListener('click', () => {
    const user = prompt('Enter Basic Auth Username:', authState.user);
    if (user !== null) {
      const pass = prompt('Enter Basic Auth Password:', authState.pass);
      if (pass !== null) {
        authState.user = user;
        authState.pass = pass;
        document.getElementById('authPillText').textContent = `Basic Auth: ${user}`;
        showToast('Basic Auth credentials updated', 'success');
        loadDashboardStats();
        loadUsersTable();
      }
    }
  });
}

// Load Dashboard Stats
async function loadDashboardStats() {
  const res = await apiFetch('/api/users/stats/summary');
  if (res.ok && res.data.success) {
    const { stats } = res.data;
    document.getElementById('statTotalUsers').textContent = stats.total || 0;
    document.getElementById('statActiveUsers').textContent = stats.status.active || 0;
    document.getElementById('statAdminUsers').textContent = stats.roles.admin || 0;
    document.getElementById('statPendingUsers').textContent = stats.status.pending || 0;
  }

  // Load Recent Users into Dashboard
  const recentRes = await apiFetch('/api/users?limit=5&sortBy=createdAt&order=desc');
  if (recentRes.ok && recentRes.data.success) {
    renderRecentUsersTable(recentRes.data.data);
  }
}

function renderRecentUsersTable(users) {
  const tbody = document.getElementById('recentUsersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No users found. Click "Seed Sample Users" to populate!</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar">${getInitials(u.name)}</div>
          <div class="user-info">
            <span class="user-name">${escapeHtml(u.name)}</span>
            <span class="user-email">${escapeHtml(u.email)}</span>
          </div>
        </div>
      </td>
      <td><span class="badge-role role-${u.role}">${u.role}</span></td>
      <td><span class="badge-status status-${u.status}">${u.status}</span></td>
      <td>${escapeHtml(u.department || 'N/A')}</td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join('');
}

// Load Users Directory Table with Pagination
async function loadUsersTable() {
  let url = `/api/users?page=${currentPage}&limit=10`;
  if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
  if (currentRoleFilter) url += `&role=${currentRoleFilter}`;
  if (currentStatusFilter) url += `&status=${currentStatusFilter}`;

  const res = await apiFetch(url);
  const tbody = document.getElementById('usersTableBody');

  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell text-rose">Error ${res.status}: ${escapeHtml(
      res.data.message || 'Unauthorized or server error'
    )}</td></tr>`;
    showToast(res.data.message || 'Failed to load users', 'error');
    return;
  }

  const { data, total, page, totalPages: pages } = res.data;
  currentPage = page;
  totalPages = pages;

  document.getElementById('paginationInfo').textContent = `Showing ${data.length} of ${total} total users`;
  document.getElementById('currentPageDisplay').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('btnPrevPage').disabled = currentPage <= 1;
  document.getElementById('btnNextPage').disabled = currentPage >= totalPages;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No users match your criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (u) => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar">${getInitials(u.name)}</div>
          <div class="user-info">
            <span class="user-name">${escapeHtml(u.name)}</span>
            <span class="user-email">${escapeHtml(u.email)}</span>
          </div>
        </div>
      </td>
      <td><span class="badge-role role-${u.role}">${u.role}</span></td>
      <td><span class="badge-status status-${u.status}">${u.status}</span></td>
      <td>${escapeHtml(u.department || 'N/A')}</td>
      <td>${escapeHtml(u.phone || 'N/A')}</td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td class="text-right">
        <button class="btn btn-icon btn-small" onclick="openEditModal('${u._id}')" title="Edit User">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn btn-icon btn-small text-rose" onclick="handleDeleteUser('${u._id}', '${escapeJsString(u.name)}')" title="Delete User">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join('');
}

// Modal Form Actions
function openCreateModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Create New User';
  document.getElementById('userForm').reset();
  document.getElementById('userIdInput').value = '';
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('inputPassword').required = true;
  document.getElementById('userModal').classList.add('active');
}

async function openEditModal(id) {
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit User Record';
  document.getElementById('userModal').classList.add('active');

  const res = await apiFetch(`/api/users/${id}`);
  if (res.ok && res.data.success) {
    const user = res.data.data;
    document.getElementById('userIdInput').value = user._id;
    document.getElementById('inputName').value = user.name || '';
    document.getElementById('inputEmail').value = user.email || '';
    document.getElementById('inputRole').value = user.role || 'user';
    document.getElementById('inputStatus').value = user.status || 'active';
    document.getElementById('inputDepartment').value = user.department || '';
    document.getElementById('inputPhone').value = user.phone || '';
    document.getElementById('inputBio').value = user.bio || '';

    // Password optional on update
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('inputPassword').required = false;
    document.getElementById('inputPassword').value = '';
    document.getElementById('inputPassword').placeholder = 'Leave blank to keep current password';
  } else {
    showToast('Failed to fetch user details', 'error');
    closeModal();
  }
}

function closeModal() {
  document.getElementById('userModal').classList.remove('active');
}

async function handleUserFormSubmit(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById('inputName').value.trim(),
    email: document.getElementById('inputEmail').value.trim(),
    role: document.getElementById('inputRole').value,
    status: document.getElementById('inputStatus').value,
    department: document.getElementById('inputDepartment').value.trim(),
    phone: document.getElementById('inputPhone').value.trim(),
    bio: document.getElementById('inputBio').value.trim(),
  };

  const passwordVal = document.getElementById('inputPassword').value.trim();
  if (passwordVal) {
    payload.password = passwordVal;
  }

  let endpoint = '/api/users';
  let method = 'POST';

  if (currentEditId) {
    endpoint = `/api/users/${currentEditId}`;
    method = 'PUT';
  }

  const res = await apiFetch(endpoint, method, payload);
  if (res.ok && res.data.success) {
    showToast(currentEditId ? 'User updated successfully!' : 'User created successfully!', 'success');
    closeModal();
    loadDashboardStats();
    loadUsersTable();
  } else {
    showToast(res.data.message || 'Operation failed', 'error');
  }
}

async function handleDeleteUser(id, name) {
  if (confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
    const res = await apiFetch(`/api/users/${id}`, 'DELETE');
    if (res.ok && res.data.success) {
      showToast(`User "${name}" deleted.`, 'success');
      loadDashboardStats();
      loadUsersTable();
    } else {
      showToast(res.data.message || 'Failed to delete user', 'error');
    }
  }
}

async function handleSeedData() {
  const res = await apiFetch('/api/users/seed', 'POST');
  if (res.ok && res.data.success) {
    showToast(res.data.message, 'success');
    loadDashboardStats();
    loadUsersTable();
  } else {
    showToast('Failed to seed sample data', 'error');
  }
}

// API Tester Console Actions
function setPreset(method, url, jsonBody) {
  document.getElementById('apiMethod').value = method;
  document.getElementById('apiUrl').value = url;
  document.getElementById('requestBodyJson').value = jsonBody;
}

async function handleSendTesterRequest() {
  const method = document.getElementById('apiMethod').value;
  const url = document.getElementById('apiUrl').value.trim();
  const bodyText = document.getElementById('requestBodyJson').value.trim();
  const customUser = document.getElementById('authUsername').value.trim();
  const customPass = document.getElementById('authPassword').value.trim();

  // Temporarily update auth credentials for tester
  const prevUser = authState.user;
  const prevPass = authState.pass;
  if (customUser) authState.user = customUser;
  if (customPass) authState.pass = customPass;

  let bodyPayload = null;
  if (bodyText && (method === 'POST' || method === 'PUT')) {
    try {
      bodyPayload = JSON.parse(bodyText);
    } catch (err) {
      document.getElementById('responseJsonOutput').textContent = '// Error: Request body is not valid JSON!';
      document.getElementById('resStatusBadge').className = 'status-code-badge status-404';
      document.getElementById('resStatusBadge').textContent = '400 Bad Request';
      // Restore auth
      authState.user = prevUser;
      authState.pass = prevPass;
      return;
    }
  }

  const res = await apiFetch(url, method, bodyPayload);

  // Restore global auth state
  authState.user = prevUser;
  authState.pass = prevPass;

  const resBadge = document.getElementById('resStatusBadge');
  resBadge.textContent = `${res.status} ${res.statusText || ''}`;
  resBadge.className = `status-code-badge status-${res.status}`;

  document.getElementById('resTimeBadge').textContent = `${res.duration} ms`;
  document.getElementById('responseJsonOutput').textContent = JSON.stringify(res.data, null, 2);
}

// Quick action execution from Dashboard
function quickExecute(method, url) {
  switchToTab('tester-tab');
  setPreset(method, url, method === 'POST' && url === '/api/users' ? sampleNewUserJSON : '');
  handleSendTesterRequest();
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Utilities
function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJsString(str) {
  return String(str).replace(/'/g, "\\'");
}
