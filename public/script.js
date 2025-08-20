// Global variables
let groups = [];
let contacts = [];
let scheduleItems = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadChannelInfo();
    loadGroups();
    loadContacts();
    loadSchedule();
    loadStats();
    loadSubgroups();
    initializeForms();
    setDefaultDateTime();
    startClock();
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load channel information
async function loadChannelInfo() {
    try {
        const response = await fetch('/api/channel-info');
        const data = await response.json();
        
        const channelInfo = document.getElementById('channelInfo');
        if (response.ok) {
            channelInfo.innerHTML = `
                <i class="fas fa-circle status-indicator connected"></i>
                <span>${data.user?.name || 'WhatsApp'} (${data.user?.id || 'Unknown'})</span>
            `;
        } else {
            channelInfo.innerHTML = `
                <i class="fas fa-circle status-indicator disconnected"></i>
                <span>Connection Error</span>
            `;
        }
    } catch (error) {
        console.error('Error loading channel info:', error);
        showToast('Failed to load channel information', 'error');
    }
}

// Load groups
async function loadGroups() {
    try {
        showLoading('Loading groups...');
        const response = await fetch('/api/groups');
        const data = await response.json();
        
        if (response.ok) {
            groups = data.groups || [];
            renderGroups();
            updateGroupSelect();
            showToast(`Loaded ${groups.length} groups`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load groups');
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load groups: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadGroups()">Retry</button>
            </div>
        `;
        showToast('Failed to load groups', 'error');
    } finally {
        hideLoading();
    }
}

// Load contacts
async function loadContacts() {
    try {
        showLoading('Loading contacts...');
        const response = await fetch('/api/contacts');
        const data = await response.json();
        
        if (response.ok) {
            contacts = data.contacts || [];
            renderContacts();
            updateContactSelect();
            showToast(`Loaded ${contacts.length} contacts`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load contacts');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        document.getElementById('contactsList').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load contacts: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadContacts()">Retry</button>
            </div>
        `;
        showToast('Failed to load contacts', 'error');
    } finally {
        hideLoading();
    }
}

// Load scheduled items
async function loadSchedule() {
    try {
        const response = await fetch('/api/schedule');
        const data = await response.json();
        
        if (response.ok) {
            scheduleItems = data.schedule || [];
            renderScheduleItems();
        } else {
            throw new Error(data.error || 'Failed to load schedule');
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('scheduleItems').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load schedule: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadSchedule()">Retry</button>
            </div>
        `;
        showToast('Failed to load schedule', 'error');
    }
}

// Render groups
function renderGroups() {
    const container = document.getElementById('groupsGrid');
    
    if (!container) {
        console.warn('groupsGrid element not found');
        return;
    }
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No groups found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = groups.map(group => `
        <div class="group-card" data-group-id="${group.id}">
            <div class="group-header">
                <h3>${escapeHtml(group.name)}</h3>
                <span class="participant-count">
                    <i class="fas fa-users"></i> ${group.participants}
                </span>
            </div>
            <div class="group-info">
                <p class="group-id">ID: ${group.id}</p>
                ${group.description ? `<p class="group-desc">${escapeHtml(group.description.substring(0, 100))}${group.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            <div class="group-actions">
                <button class="btn btn-small btn-primary" onclick="selectGroupForScheduling('${group.id}', '${escapeHtml(group.name)}')">
                    <i class="fas fa-calendar-plus"></i> Schedule
                </button>
            </div>
        </div>
    `).join('');
}

// Render contacts
function renderContacts() {
    const container = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <p>No contacts found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-item" data-contact-id="${contact.id}">
            <div class="contact-info">
                <h4>${escapeHtml(contact.name)}</h4>
                <p class="contact-phone">${contact.phone}</p>
                ${contact.is_business ? '<span class="business-badge">Business</span>' : ''}
            </div>
            <div class="contact-actions">
                <button class="btn btn-small btn-primary" onclick="selectContactForScheduling('${contact.id}', '${escapeHtml(contact.name)}')">
                    <i class="fas fa-calendar-plus"></i> Schedule
                </button>
            </div>
        </div>
    `).join('');
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        if (response.ok) {
            renderStats(stats);
        } else {
            throw new Error(stats.error || 'Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('statsGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load statistics: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadStats()">Retry</button>
            </div>
        `;
        showToast('Failed to load statistics', 'error');
    }
}

// Render statistics
function renderStats(stats) {
    const container = document.getElementById('statsGrid');
    
    container.innerHTML = `
        <div class="stat-card total">
            <div class="stat-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="stat-content">
                <h3>${stats.total}</h3>
                <p>Total Messages</p>
            </div>
        </div>
        
        <div class="stat-card success">
            <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
                <h3>${stats.sent_successfully}</h3>
                <p>Sent Successfully</p>
            </div>
        </div>
        
        <div class="stat-card error">
            <div class="stat-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-content">
                <h3>${stats.failed}</h3>
                <p>Failed</p>
            </div>
        </div>
        
        <div class="stat-card warning">
            <div class="stat-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
                <h3>${stats.scheduled}</h3>
                <p>Scheduled</p>
            </div>
        </div>
        
        <div class="stat-card info">
            <div class="stat-icon">
                <i class="fas fa-spinner"></i>
            </div>
            <div class="stat-content">
                <h3>${stats.processing}</h3>
                <p>Processing</p>
            </div>
        </div>
        
        ${stats.recent_failures.length > 0 ? `
            <div class="stat-card failures">
                <div class="stat-content full-width">
                    <h4><i class="fas fa-exclamation-triangle"></i> Recent Failures</h4>
                    <div class="failure-list">
                        ${stats.recent_failures.map(failure => `
                            <div class="failure-item">
                                <strong>${failure.group_id}</strong> (${failure.type})
                                <small>${failure.error}</small>
                                <span class="failure-time">${new Date(failure.failed_at).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

// Render scheduled items
function renderScheduleItems() {
    const container = document.getElementById('scheduleItems');
    
    if (scheduleItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <p>No scheduled messages</p>
            </div>
        `;
        return;
    }
    
    const sortedItems = [...scheduleItems].sort((a, b) => a.send_at - b.send_at);
    
    container.innerHTML = sortedItems.map(item => {
        const date = new Date(item.send_at * 1000);
        const status = item.runtime_status || 'pending';
        
        // Status icons and colors
        const statusConfig = {
            'sent_successfully': { icon: 'fas fa-check-circle', color: 'success', label: 'SENT' },
            'failed': { icon: 'fas fa-times-circle', color: 'error', label: 'FAILED' },
            'processing': { icon: 'fas fa-spinner fa-spin', color: 'warning', label: 'SENDING' },
            'scheduled': { icon: 'fas fa-clock', color: 'info', label: 'SCHEDULED' },
            'pending': { icon: 'fas fa-pause-circle', color: 'secondary', label: 'PENDING' }
        };
        
        const statusInfo = statusConfig[status] || statusConfig['pending'];
        
        return `
            <div class="schedule-item ${status}" data-item-id="${getTaskId(item)}">
                <div class="schedule-header">
                    <span class="schedule-type ${item.type}">${item.type.toUpperCase()}</span>
                    <span class="schedule-status ${statusInfo.color}">
                        <i class="${statusInfo.icon}"></i> ${statusInfo.label}
                    </span>
                </div>
                <div class="schedule-content">
                    <h4>To: ${item.group_id}</h4>
                    ${item.body ? `<p class="schedule-body">${escapeHtml(item.body.substring(0, 100))}${item.body.length > 100 ? '...' : ''}</p>` : ''}
                    ${item.poll_options ? `<p class="poll-options">Options: ${escapeHtml(item.poll_options)}</p>` : ''}
                    ${item.image_url ? `<p class="image-url">Image: ${item.image_url}</p>` : ''}
                    
                    ${item.message_id ? `<p class="message-id"><i class="fas fa-fingerprint"></i> Message ID: ${item.message_id}</p>` : ''}
                    ${item.error_details ? `<p class="error-details"><i class="fas fa-exclamation-triangle"></i> Error: ${escapeHtml(item.error_details)}</p>` : ''}
                    ${item.sent_at ? `<p class="sent-time"><i class="fas fa-paper-plane"></i> Sent: ${new Date(item.sent_at).toLocaleString()}</p>` : ''}
                </div>
                <div class="schedule-footer">
                    <span class="schedule-time">
                        <i class="fas fa-calendar"></i> ${item.scheduled_time || date.toLocaleString()}
                        ${item.time_until_send > 0 ? `<small>(in ${Math.floor(item.time_until_send / 60)}m ${item.time_until_send % 60}s)</small>` : ''}
                    </span>
                    ${status !== 'sent_successfully' && status !== 'processing' ? `
                        <div class="schedule-actions">
                            <button class="btn btn-small btn-secondary" onclick="editScheduleItem('${getTaskId(item)}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteScheduleItem('${getTaskId(item)}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Update group select dropdown
function updateGroupSelect() {
    const select = document.getElementById('groupSelect');
    select.innerHTML = '<option value="">Select a group</option>' + 
        groups.map(group => `<option value="${group.id}">${escapeHtml(group.name)} (${group.participants} members)</option>`).join('');
}

// Update contact select dropdown
function updateContactSelect() {
    const select = document.getElementById('contactSelect');
    select.innerHTML = '<option value="">Select a contact</option>' + 
        contacts.map(contact => `<option value="${contact.id}">${escapeHtml(contact.name)} (${contact.phone})</option>`).join('');
}

// Initialize forms
function initializeForms() {
    // Schedule form
    const scheduleForm = document.getElementById('scheduleForm');
    const messageType = document.getElementById('messageType');
    const targetType = document.getElementById('targetType');
    
    messageType.addEventListener('change', toggleMessageFields);
    targetType.addEventListener('change', toggleTargetSelection);
    
    scheduleForm.addEventListener('submit', handleScheduleSubmit);
    
    // Send Now button
    const sendNowBtn = document.getElementById('sendNowBtn');
    sendNowBtn.addEventListener('click', handleSendNow);
    
    // Test form
    const testForm = document.getElementById('testForm');
    testForm.addEventListener('submit', handleTestSubmit);
    
    // Subgroup form
    const subgroupForm = document.getElementById('subgroupForm');
    subgroupForm.addEventListener('submit', handleSubgroupSubmit);
    
    // Subgroup message form
    const subgroupMessageForm = document.getElementById('subgroupMessageForm');
    const subgroupMessageType = document.getElementById('subgroupMessageType');
    
    subgroupMessageType.addEventListener('change', toggleSubgroupMessageFields);
    subgroupMessageForm.addEventListener('submit', handleSubgroupMessageSubmit);
}

// Toggle message fields based on type
function toggleMessageFields() {
    const messageType = document.getElementById('messageType').value;
    const textFields = document.getElementById('textFields');
    const pollFields = document.getElementById('pollFields');
    const dpFields = document.getElementById('dpFields');
    
    // Hide all fields first
    textFields.style.display = 'none';
    pollFields.style.display = 'none';
    dpFields.style.display = 'none';
    
    // Show relevant fields
    switch (messageType) {
        case 'text':
            textFields.style.display = 'block';
            break;
        case 'poll':
            pollFields.style.display = 'block';
            break;
        case 'dp':
            dpFields.style.display = 'block';
            break;
    }
}

// Toggle target selection
function toggleTargetSelection() {
    const targetType = document.getElementById('targetType').value;
    const groupSelection = document.getElementById('schedulerGroupSelection');
    const contactSelection = document.getElementById('contactSelection');
    const manualIdInput = document.getElementById('manualIdInput');
    
    // Check if elements exist
    if (!groupSelection || !contactSelection || !manualIdInput) {
        console.warn('Some target selection elements not found');
        return;
    }
    
    // Hide all selections first
    groupSelection.style.display = 'none';
    contactSelection.style.display = 'none';
    manualIdInput.style.display = 'none';
    
    // Show relevant selection
    switch (targetType) {
        case 'group':
            groupSelection.style.display = 'block';
            break;
        case 'contact':
            contactSelection.style.display = 'block';
            break;
        case 'manual':
            manualIdInput.style.display = 'block';
            break;
    }
}

// Handle schedule form submission
async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    try {
        const isEditing = e.target.dataset.editingId;
        showLoading(isEditing ? 'Updating message...' : 'Scheduling message...');
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Get the correct group_id based on target type
        const targetType = data.targetType;
        let groupId;
        
        switch (targetType) {
            case 'group':
                groupId = document.getElementById('groupSelect').value;
                break;
            case 'contact':
                groupId = document.getElementById('contactSelect').value;
                break;
            case 'manual':
                groupId = document.getElementById('manualId').value;
                break;
        }
        
        if (!groupId) {
            throw new Error('Please select a target');
        }
        
        // Convert date and time to Unix timestamp treating input as IST
        const dateTimeString = `${data.date}T${data.time}:00+05:30`; // Explicitly mark as IST
        const dateTime = new Date(dateTimeString);
        const timestamp = Math.floor(dateTime.getTime() / 1000);
        
        const payload = {
            type: data.type,
            group_id: groupId,
            body: data.body || '',
            poll_options: data.poll_options || '',
            image_url: data.image_url || '',
            send_at: timestamp
        };
        
        let response;
        if (isEditing) {
            // Update existing item
            response = await fetch(`/api/schedule/${isEditing}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new item
            response = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(isEditing ? 'Message updated successfully!' : 'Message scheduled successfully!', 'success');
            
            // Reset form and editing state
            e.target.reset();
            delete e.target.dataset.editingId;
            
            // Reset submit button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Schedule Message';
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-primary');
            
            toggleMessageFields();
            toggleTargetSelection();
            loadSchedule();
        } else {
            throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'schedule'} message`);
        }
    } catch (error) {
        console.error('Error with schedule operation:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle send now functionality
async function handleSendNow() {
    try {
        showLoading('Sending message immediately...');
        
        const form = document.getElementById('scheduleForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Get the correct group_id based on target type
        const targetType = data.targetType;
        let groupId;
        
        switch (targetType) {
            case 'group':
                groupId = document.getElementById('groupSelect').value;
                break;
            case 'contact':
                groupId = document.getElementById('contactSelect').value;
                break;
            case 'manual':
                groupId = document.getElementById('manualId').value;
                break;
        }
        
        if (!groupId) {
            throw new Error('Please select a target');
        }
        
        if (!data.type) {
            throw new Error('Please select a message type');
        }
        
        const payload = {
            type: data.type,
            group_id: groupId,
            body: data.body || '',
            poll_options: data.poll_options || '',
            image_url: data.image_url || ''
        };
        
        const response = await fetch('/api/send-now', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`${data.type.toUpperCase()} message sent immediately!`, 'success');
            form.reset();
            toggleMessageFields();
            toggleTargetSelection();
        } else {
            throw new Error(result.error || 'Failed to send message immediately');
        }
    } catch (error) {
        console.error('Error sending immediate message:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Handle test form submission
async function handleTestSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading('Sending test message...');
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch('/api/test-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Test message sent successfully!', 'success');
            e.target.reset();
        } else {
            throw new Error(result.error || 'Failed to send test message');
        }
    } catch (error) {
        console.error('Error sending test message:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Edit schedule item
async function editScheduleItem(itemId) {
    try {
        // Find the item in the scheduleItems array
        const item = scheduleItems.find(scheduleItem => getTaskId(scheduleItem) === itemId);
        
        if (!item) {
            throw new Error('Schedule item not found');
        }
        
        // Check if item has already been sent
        if (item.sent === 'true' || item.status === 'success') {
            showToast('Cannot edit message that has already been sent', 'error');
            return;
        }
        
        // Switch to scheduler tab
        document.querySelector('[data-tab="scheduler"]').click();
        
        // Populate the form with existing data
        document.getElementById('messageType').value = item.type;
        document.getElementById('targetType').value = 'manual';
        document.getElementById('manualId').value = item.group_id;
        
        // Show appropriate fields based on message type
        showMessageFields(item.type);
        showTargetSelection('manual');
        
        // Fill in the specific fields
        if (item.type === 'text') {
            document.getElementById('messageBody').value = item.body || '';
        } else if (item.type === 'poll') {
            document.getElementById('pollQuestion').value = item.body || '';
            document.getElementById('pollOptions').value = item.poll_options || '';
        } else if (item.type === 'dp') {
            document.getElementById('imageUrl').value = item.image_url || '';
        }
        
        // Set date and time - convert from UTC epoch to IST
        const sendDate = new Date(parseInt(item.send_at) * 1000);
        
        const year = sendDate.getFullYear();
        const month = String(sendDate.getMonth() + 1).padStart(2, '0');
        const day = String(sendDate.getDate()).padStart(2, '0');
        const hours = String(sendDate.getHours()).padStart(2, '0');
        const minutes = String(sendDate.getMinutes()).padStart(2, '0');
        
        document.getElementById('scheduleDate').value = `${year}-${month}-${day}`;
        document.getElementById('scheduleTime').value = `${hours}:${minutes}`;
        
        // Store the item ID for updating
        const form = document.getElementById('scheduleForm');
        form.dataset.editingId = itemId;
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Message';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        showToast('Schedule item loaded for editing', 'info');
        
    } catch (error) {
        console.error('Error loading item for edit:', error);
        showToast(error.message || 'Failed to load item for editing', 'error');
    }
}

// Delete schedule item
async function deleteScheduleItem(itemId) {
    if (!confirm('Are you sure you want to delete this scheduled item?')) {
        return;
    }
    
    try {
        showLoading('Deleting item...');
        
        const response = await fetch(`/api/schedule/${itemId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Schedule item deleted successfully!', 'success');
            loadSchedule();
        } else {
            throw new Error(result.error || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Select group for scheduling
function selectGroupForScheduling(groupId, groupName) {
    // Switch to scheduler tab
    document.querySelector('[data-tab="scheduler"]').click();
    
    // Set target type to group
    document.getElementById('targetType').value = 'group';
    toggleTargetSelection();
    
    // Select the group
    document.getElementById('groupSelect').value = groupId;
    
    showToast(`Selected group: ${groupName}`, 'info');
}

// Select contact for scheduling
function selectContactForScheduling(contactId, contactName) {
    // Switch to scheduler tab
    document.querySelector('[data-tab="scheduler"]').click();
    
    // Set target type to contact
    document.getElementById('targetType').value = 'contact';
    toggleTargetSelection();
    
    // Select the contact
    document.getElementById('contactSelect').value = contactId;
    
    showToast(`Selected contact: ${contactName}`, 'info');
}

// Set default date and time
function setDefaultDateTime() {
    // Get current time in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const tomorrow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000);
    
    // Format date for input field (YYYY-MM-DD)
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    document.getElementById('scheduleDate').value = `${year}-${month}-${day}`;
    document.getElementById('scheduleTime').value = '09:00';
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTaskId(item) {
    return `${item.type}_${item.group_id}_${item.send_at}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    overlay.querySelector('p').textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Global variables for subgroups
let subgroups = [];

// Load subgroups
async function loadSubgroups() {
    try {
        const response = await fetch('/api/subgroups');
        const data = await response.json();
        
        if (response.ok) {
            subgroups = data.subgroups || [];
            renderSubgroups();
            renderGroupSelection();
            updateSubgroupSelect();
        } else {
            throw new Error(data.error || 'Failed to load subgroups');
        }
    } catch (error) {
        console.error('Error loading subgroups:', error);
        document.getElementById('subgroupsList').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load subgroups: ${error.message}</p>
                <button class="btn btn-secondary" onclick="loadSubgroups()">Retry</button>
            </div>
        `;
        showToast('Failed to load subgroups', 'error');
    }
}

// Render subgroups list
function renderSubgroups() {
    const container = document.getElementById('subgroupsList');
    
    if (subgroups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <p>No sub-groups created yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subgroups.map(subgroup => `
        <div class="subgroup-item" data-subgroup-id="${subgroup.subgroup_id}">
            <div class="subgroup-header">
                <h3>${escapeHtml(subgroup.subgroup_name)}</h3>
                <span class="group-count">
                    <i class="fas fa-users"></i> ${subgroup.group_ids.length} groups
                </span>
            </div>
            <div class="subgroup-content">
                ${subgroup.description ? `<p class="subgroup-desc">${escapeHtml(subgroup.description)}</p>` : ''}
                <div class="group-ids">
                    <strong>Groups:</strong> ${subgroup.group_ids.join(', ')}
                </div>
                <div class="subgroup-meta">
                    <small>Created: ${new Date(subgroup.created_at).toLocaleDateString()}</small>
                </div>
            </div>
            <div class="subgroup-actions">
                <button class="btn btn-small btn-primary" onclick="selectSubgroupForMessaging('${subgroup.subgroup_id}', '${escapeHtml(subgroup.subgroup_name)}')">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteSubgroup('${subgroup.subgroup_id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Render group selection checkboxes
function renderGroupSelection() {
    const container = document.getElementById('subgroupGroupSelection');
    
    if (!container) {
        console.warn('subgroupGroupSelection element not found');
        return;
    }
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No groups available</p>
                <button class="btn btn-secondary" onclick="loadGroups()">Load Groups</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="group-checkboxes">
            ${groups.map(group => `
                <label class="checkbox-label">
                    <input type="checkbox" name="group_ids" value="${group.id}">
                    <span class="checkbox-text">
                        <strong>${escapeHtml(group.name)}</strong>
                        <small>(${group.participants} members)</small>
                    </span>
                </label>
            `).join('')}
        </div>
    `;
}

// Update subgroup select dropdown
function updateSubgroupSelect() {
    const select = document.getElementById('subgroupSelect');
    select.innerHTML = '<option value="">Select a sub-group</option>' + 
        subgroups.map(subgroup => `<option value="${subgroup.subgroup_id}">${escapeHtml(subgroup.subgroup_name)} (${subgroup.group_ids.length} groups)</option>`).join('');
}

// Select subgroup for messaging
function selectSubgroupForMessaging(subgroupId, subgroupName) {
    // Switch to subgroups tab if not already there
    const tabButton = document.querySelector('[data-tab="subgroups"]');
    const tabContent = document.getElementById('subgroups');
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate subgroups tab
    tabButton.classList.add('active');
    tabContent.classList.add('active');
    
    // Select the subgroup in the dropdown
    document.getElementById('subgroupSelect').value = subgroupId;
    
    // Scroll to messaging form
    document.querySelector('.subgroup-message-form').scrollIntoView({ behavior: 'smooth' });
    
    showToast(`Selected sub-group: ${subgroupName}`, 'success');
}

// Delete subgroup
async function deleteSubgroup(subgroupId) {
    if (!confirm('Are you sure you want to delete this sub-group?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/subgroups/${subgroupId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sub-group deleted successfully', 'success');
            loadSubgroups(); // Reload the list
        } else {
            throw new Error(data.error || 'Failed to delete sub-group');
        }
    } catch (error) {
        console.error('Error deleting subgroup:', error);
        showToast('Failed to delete sub-group: ' + error.message, 'error');
    }
}

// Toggle subgroup message fields based on type
function toggleSubgroupMessageFields() {
    const messageType = document.getElementById('subgroupMessageType').value;
    const textFields = document.getElementById('subgroupTextFields');
    const pollFields = document.getElementById('subgroupPollFields');
    const imageFields = document.getElementById('subgroupImageFields');
    
    // Hide all fields first
    textFields.style.display = 'none';
    pollFields.style.display = 'none';
    imageFields.style.display = 'none';
    
    // Show relevant fields
    switch (messageType) {
        case 'text':
            textFields.style.display = 'block';
            break;
        case 'poll':
            pollFields.style.display = 'block';
            break;
        case 'dp':
            imageFields.style.display = 'block';
            break;
    }
}

// Handle subgroup form submission
async function handleSubgroupSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedGroups = Array.from(document.querySelectorAll('input[name="group_ids"]:checked')).map(cb => cb.value);
    
    if (selectedGroups.length === 0) {
        showToast('Please select at least one group', 'error');
        return;
    }
    
    const subgroupData = {
        name: formData.get('name'),
        description: formData.get('description'),
        group_ids: selectedGroups
    };
    
    try {
        const response = await fetch('/api/subgroups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subgroupData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sub-group created successfully!', 'success');
            e.target.reset();
            // Uncheck all checkboxes
            document.querySelectorAll('input[name="group_ids"]').forEach(cb => cb.checked = false);
            loadSubgroups(); // Reload the list
        } else {
            throw new Error(data.error || 'Failed to create sub-group');
        }
    } catch (error) {
        console.error('Error creating subgroup:', error);
        showToast('Failed to create sub-group: ' + error.message, 'error');
    }
}

// Handle subgroup message form submission
async function handleSubgroupMessageSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subgroupId = formData.get('subgroup_id');
    const messageType = formData.get('type');
    
    // Convert date and time to Unix timestamp treating input as IST
    const dateTimeString = formData.get('send_at') + ':00+05:30'; // Explicitly mark as IST
    const sendAtDate = new Date(dateTimeString);
    const sendAtEpoch = Math.floor(sendAtDate.getTime() / 1000);
    
    if (!subgroupId) {
        showToast('Please select a sub-group', 'error');
        return;
    }
    
    const messageData = {
        type: messageType,
        send_at: sendAtEpoch
    };
    
    // Add type-specific fields
    switch (messageType) {
        case 'text':
            messageData.body = formData.get('body') || document.getElementById('subgroupMessageBody').value;
            if (!messageData.body) {
                showToast('Please enter a message', 'error');
                return;
            }
            break;
        case 'poll':
            messageData.body = formData.get('poll_question') || document.getElementById('subgroupPollQuestion').value;
            messageData.poll_options = formData.get('poll_options') || document.getElementById('subgroupPollOptions').value;
            if (!messageData.body || !messageData.poll_options) {
                showToast('Please enter poll question and options', 'error');
                return;
            }
            break;
        case 'dp':
            messageData.image_url = formData.get('image_url') || document.getElementById('subgroupImageUrl').value;
            if (!messageData.image_url) {
                showToast('Please enter image URL', 'error');
                return;
            }
            break;
    }
    
    try {
        const response = await fetch(`/api/subgroups/${subgroupId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Message scheduled for ${data.scheduled_count} groups!`, 'success');
            e.target.reset();
            loadSchedule(); // Reload schedule to show new items
        } else {
            throw new Error(data.error || 'Failed to schedule message');
        }
    } catch (error) {
        console.error('Error scheduling subgroup message:', error);
        showToast('Failed to schedule message: ' + error.message, 'error');
    }
}

// Send subgroup message immediately
async function sendSubgroupImmediately() {
    const form = document.getElementById('subgroupMessageForm');
    const formData = new FormData(form);
    const subgroupId = formData.get('subgroup_id');
    const messageType = formData.get('type');
    
    if (!subgroupId) {
        showToast('Please select a sub-group', 'error');
        return;
    }
    
    const messageData = {
        type: messageType,
        send_at: Math.floor(Date.now() / 1000), // Current timestamp
        send_immediately: true
    };
    
    // Add type-specific fields
    switch (messageType) {
        case 'text':
            messageData.body = formData.get('body') || document.getElementById('subgroupMessageBody').value;
            if (!messageData.body) {
                showToast('Please enter a message', 'error');
                return;
            }
            break;
        case 'poll':
            messageData.body = formData.get('poll_question') || document.getElementById('subgroupPollQuestion').value;
            messageData.poll_options = formData.get('poll_options') || document.getElementById('subgroupPollOptions').value;
            if (!messageData.body || !messageData.poll_options) {
                showToast('Please enter poll question and options', 'error');
                return;
            }
            break;
        case 'dp':
            messageData.image_url = formData.get('image_url') || document.getElementById('subgroupImageUrl').value;
            if (!messageData.image_url) {
                showToast('Please enter image URL', 'error');
                return;
            }
            break;
    }
    
    try {
        showLoading('Sending message immediately to all groups...');
        
        const response = await fetch(`/api/subgroups/${subgroupId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Message sent immediately to ${data.scheduled_count} groups!`, 'success');
            form.reset();
            loadSchedule(); // Reload schedule to show sent items
        } else {
            throw new Error(data.error || 'Failed to send message immediately');
        }
    } catch (error) {
        console.error('Error sending immediate subgroup message:', error);
        showToast('Failed to send message immediately: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Start and update real-time clock
function startClock() {
    function updateClock() {
        const now = new Date();
        const timeDisplay = document.getElementById('timeDisplay');
        
        if (timeDisplay) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            };
            
            timeDisplay.textContent = now.toLocaleString('en-IN', options) + ' IST';
        }
    }
    
    // Update immediately
    updateClock();
    
    // Update every second
    setInterval(updateClock, 1000);
}