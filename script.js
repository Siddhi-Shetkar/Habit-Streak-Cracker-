// Initial Data & Quotes
const quotes = [
    "Small daily improvements are the key to staggering long-term results.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Chains of habit are too light to be felt until they are too heavy to be broken."
];

const defaultBadges = [
    { id: 'streak-3', title: 'Getting Started', desc: '3 Day Streak', icon: 'fa-fire' },
    { id: 'streak-7', title: 'On a Roll', desc: '7 Day Streak', icon: 'fa-fire-flame-curved' },
    { id: 'streak-30', title: 'Unstoppable', desc: '30 Day Streak', icon: 'fa-meteor' },
    { id: 'master', title: 'Habit Master', desc: 'Complete all habits in a day', icon: 'fa-crown' }
];

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let theme = localStorage.getItem('theme') || 'dark';
let completionChart = null;
let currentHabitIdToDelete = null;
let editMode = false;

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const greetingEl = document.getElementById('greeting');
const currentDateEl = document.getElementById('current-date');
const quoteEl = document.getElementById('daily-quote');

const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statToday = document.getElementById('stat-today');
const statOverall = document.getElementById('stat-overall');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const sortSelect = document.getElementById('sort-select');

const habitsContainer = document.getElementById('habits-container');
const emptyState = document.getElementById('empty-state');
const emptyAddBtn = document.getElementById('empty-add-btn');
const addHabitBtn = document.getElementById('add-habit-btn');

const habitModal = document.getElementById('habit-modal');
const habitForm = document.getElementById('habit-form');
const deleteModal = document.getElementById('delete-modal');
const achievementsModal = document.getElementById('achievements-modal');

const iconSelector = document.getElementById('icon-selector');
const colorSelector = document.getElementById('color-selector');
const habitIconInput = document.getElementById('habit-icon');
const habitColorInput = document.getElementById('habit-color');
const modalTitle = document.getElementById('modal-title');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

// Initialize
function init() {
    initTheme();
    updateHeader();
    setupEventListeners();
    renderHabits();
    updateStats();
    renderChart();
    
    // Set daily quote
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// Theme Handling
function initTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
    initTheme();
    renderChart(); // re-render for grid colors
}

// Header Info
function updateHeader() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good Evening!';
    if (hour < 12) greeting = 'Good Morning!';
    else if (hour < 18) greeting = 'Good Afternoon!';
    
    greetingEl.textContent = greeting;
    
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
}

// Event Listeners
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    
    addHabitBtn.addEventListener('click', () => openHabitModal());
    emptyAddBtn.addEventListener('click', () => openHabitModal());
    
    // Close Modals
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.querySelector('.close-achievements-btn').addEventListener('click', () => {
        achievementsModal.classList.add('hidden');
    });
    
    document.getElementById('achievements-btn').addEventListener('click', openAchievements);
    
    // Selectors
    iconSelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'I') {
            document.querySelectorAll('#icon-selector i').forEach(i => i.classList.remove('selected'));
            e.target.classList.add('selected');
            habitIconInput.value = e.target.dataset.icon;
        }
    });
    
    colorSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
            e.target.classList.add('selected');
            habitColorInput.value = e.target.dataset.color;
        }
    });
    
    // Form Submit
    habitForm.addEventListener('submit', handleHabitSubmit);
    
    // Delete Modal
    document.querySelector('.cancel-delete-btn').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        currentHabitIdToDelete = null;
    });
    
    document.querySelector('.confirm-delete-btn').addEventListener('click', confirmDeleteHabit);
    
    // Filters & Search
    searchInput.addEventListener('input', renderHabits);
    filterCategory.addEventListener('change', renderHabits);
    sortSelect.addEventListener('change', renderHabits);
}

// Modal Logic
function openHabitModal(habit = null) {
    habitForm.reset();
    document.querySelectorAll('#icon-selector i').forEach(i => i.classList.remove('selected'));
    document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
    
    if (habit) {
        editMode = true;
        modalTitle.textContent = 'Edit Habit';
        document.getElementById('habit-id').value = habit.id;
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-category').value = habit.category;
        document.getElementById('habit-frequency').value = habit.frequency;
        
        habitIconInput.value = habit.icon;
        habitColorInput.value = habit.color;
        
        const iconEl = document.querySelector(`#icon-selector i[data-icon="${habit.icon}"]`);
        if (iconEl) iconEl.classList.add('selected');
        
        const colorEl = document.querySelector(`.color-option[data-color="${habit.color}"]`);
        if (colorEl) colorEl.classList.add('selected');
        
    } else {
        editMode = false;
        modalTitle.textContent = 'Add New Habit';
        habitIconInput.value = 'fa-book';
        habitColorInput.value = '#3b82f6';
        document.querySelector('#icon-selector i[data-icon="fa-book"]').classList.add('selected');
        document.querySelector('.color-option[data-color="#3b82f6"]').classList.add('selected');
    }
    
    habitModal.classList.remove('hidden');
}

function closeModals() {
    habitModal.classList.add('hidden');
    deleteModal.classList.add('hidden');
    editMode = false;
}

// Habit Logic
function handleHabitSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('habit-id').value || Date.now().toString();
    const name = document.getElementById('habit-name').value.trim();
    const category = document.getElementById('habit-category').value;
    const frequency = document.getElementById('habit-frequency').value;
    const icon = habitIconInput.value;
    const color = habitColorInput.value;
    
    if (editMode) {
        const index = habits.findIndex(h => h.id === id);
        if (index > -1) {
            habits[index] = { ...habits[index], name, category, frequency, icon, color };
            showToast('Habit updated successfully!');
        }
    } else {
        const newHabit = {
            id, name, category, frequency, icon, color,
            createdAt: new Date().toISOString(),
            history: {} // 'YYYY-MM-DD': true
        };
        habits.push(newHabit);
        showToast('Habit added successfully!');
    }
    
    saveHabits();
    closeModals();
    renderHabits();
    updateStats();
    renderChart();
}

function openDeleteModal(id) {
    currentHabitIdToDelete = id;
    deleteModal.classList.remove('hidden');
}

function confirmDeleteHabit() {
    if (currentHabitIdToDelete) {
        habits = habits.filter(h => h.id !== currentHabitIdToDelete);
        saveHabits();
        closeModals();
        renderHabits();
        updateStats();
        renderChart();
        showToast('Habit deleted.', true);
        currentHabitIdToDelete = null;
    }
}

function toggleDay(habitId, dateStr) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    if (habit.history[dateStr]) {
        delete habit.history[dateStr];
    } else {
        habit.history[dateStr] = true;
    }
    
    saveHabits();
    renderHabits(); // re-render to update UI & streaks
    updateStats();
    renderChart();
    checkAchievements(dateStr);
}

// Rendering
function renderHabits() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterCat = filterCategory.value;
    const sortType = sortSelect.value;
    
    let filtered = habits.filter(h => {
        const matchSearch = h.name.toLowerCase().includes(searchTerm);
        const matchCat = filterCat === 'all' || h.category === filterCat;
        return matchSearch && matchCat;
    });
    
    filtered.sort((a, b) => {
        if (sortType === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortType === 'name') return a.name.localeCompare(b.name);
        
        const statsA = calculateStats(a);
        const statsB = calculateStats(b);
        if (sortType === 'streak') return statsB.highestStreak - statsA.highestStreak;
        if (sortType === 'completion') return statsB.completionRate - statsA.completionRate;
        return 0;
    });
    
    habitsContainer.innerHTML = '';
    
    if (habits.length === 0) {
        emptyState.classList.remove('hidden');
        document.querySelector('.controls-bar').style.display = 'none';
    } else if (filtered.length === 0) {
        emptyState.classList.add('hidden');
        document.querySelector('.controls-bar').style.display = 'flex';
        habitsContainer.innerHTML = '<p class="subtitle" style="text-align:center;width:100%;padding:2rem;">No habits match your filters.</p>';
    } else {
        emptyState.classList.add('hidden');
        document.querySelector('.controls-bar').style.display = 'flex';
        
        filtered.forEach(habit => {
            const stats = calculateStats(habit);
            const card = document.createElement('div');
            card.className = 'habit-card glass';
            
            // Build 30 days grid
            const today = new Date();
            let daysHtml = '';
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const isCompleted = habit.history[dateStr] ? 'completed' : '';
                const isToday = i === 0 ? 'today' : '';
                
                let bgStyle = isCompleted ? `style="background: ${habit.color}"` : '';
                
                daysHtml += `<div class="day-box ${isCompleted} ${isToday}" ${bgStyle} onclick="toggleDay('${habit.id}', '${dateStr}')" title="${dateStr}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>`;
            }
            
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-main-info">
                        <div class="habit-icon" style="background: ${habit.color}">
                            <i class="fa-solid ${habit.icon}"></i>
                        </div>
                        <div class="habit-details">
                            <h3>${habit.name}</h3>
                            <span class="category-badge">${habit.category}</span>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="action-btn" onclick="editHabit('${habit.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete" onclick="openDeleteModal('${habit.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="habit-stats">
                    <div class="mini-stat" title="Current Streak"><i class="fa-solid fa-fire" style="color: #ef4444"></i> <span>${stats.currentStreak}</span></div>
                    <div class="mini-stat" title="Highest Streak"><i class="fa-solid fa-trophy" style="color: #f59e0b"></i> <span>${stats.highestStreak}</span></div>
                    <div class="mini-stat" title="Total Days"><i class="fa-solid fa-calendar-check" style="color: #10b981"></i> <span>${stats.totalCompleted}</span></div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-header">
                        <span>30-Day Completion</span>
                        <span>${stats.completionRate}%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${stats.completionRate}%; background: ${habit.color}"></div>
                    </div>
                </div>
                
                <button class="calendar-toggle" onclick="toggleCalendar(this, '${habit.id}')">
                    <span>View Calendar</span> <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="calendar-container" id="cal-${habit.id}">
                    <div class="days-grid">
                        ${daysHtml}
                    </div>
                </div>
            `;
            habitsContainer.appendChild(card);
        });
    }
}

// Global functions for inline onclicks
window.editHabit = (id) => {
    const h = habits.find(h => h.id === id);
    if (h) openHabitModal(h);
};

window.openDeleteModal = openDeleteModal;
window.toggleDay = toggleDay;

window.toggleCalendar = (btn, id) => {
    const cal = document.getElementById(`cal-${id}`);
    btn.classList.toggle('open');
    if (cal.classList.contains('active')) {
        cal.classList.remove('active');
        btn.querySelector('span').textContent = 'View Calendar';
    } else {
        cal.classList.add('active');
        btn.querySelector('span').textContent = 'Hide Calendar';
    }
};

// Utilities
function calculateStats(habit) {
    let currentStreak = 0;
    let highestStreak = 0;
    let totalCompleted = Object.keys(habit.history).length;
    
    // Calculate Streaks
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let tempStreak = 0;
    
    // Check back from today or yesterday
    let dateToCheck = new Date(today);
    const todayStr = dateToCheck.toISOString().split('T')[0];
    
    dateToCheck.setDate(dateToCheck.getDate() - 1);
    const yesterdayStr = dateToCheck.toISOString().split('T')[0];
    
    // Calculate Current
    let d = new Date(today);
    while (true) {
        let str = d.toISOString().split('T')[0];
        if (habit.history[str]) {
            currentStreak++;
            d.setDate(d.getDate() - 1);
        } else {
            // if today is missed but yesterday isn't, streak isn't broken yet.
            if (str === todayStr) {
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
    }
    
    // Calculate Highest
    const sortedDates = Object.keys(habit.history).sort();
    tempStreak = 0;
    let prevDate = null;
    
    for (let date of sortedDates) {
        if (!prevDate) {
            tempStreak = 1;
        } else {
            const p = new Date(prevDate);
            const c = new Date(date);
            const diffTime = Math.abs(c - p);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }
        if (tempStreak > highestStreak) highestStreak = tempStreak;
        prevDate = date;
    }
    
    // 30 days completion rate
    let thirtyDaysCompleted = 0;
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        if (habit.history[date.toISOString().split('T')[0]]) {
            thirtyDaysCompleted++;
        }
    }
    const completionRate = Math.round((thirtyDaysCompleted / 30) * 100);
    
    return { currentStreak, highestStreak, totalCompleted, completionRate };
}

function updateStats() {
    statTotal.textContent = habits.length;
    
    const active = habits.filter(h => {
        const stats = calculateStats(h);
        return stats.currentStreak > 0;
    });
    statActive.textContent = active.length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    let completedToday = 0;
    habits.forEach(h => {
        if (h.history[todayStr]) completedToday++;
    });
    
    const todayPerc = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
    statToday.textContent = todayPerc + '%';
    
    let overallRate = 0;
    if (habits.length) {
        const totalRates = habits.reduce((acc, h) => acc + calculateStats(h).completionRate, 0);
        overallRate = Math.round(totalRates / habits.length);
    }
    statOverall.textContent = overallRate + '%';
}

function renderChart() {
    const ctx = document.getElementById('completionChart');
    if (!ctx) return;
    
    if (completionChart) {
        completionChart.destroy();
    }
    
    const today = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dateStr = d.toISOString().split('T')[0];
        let completed = 0;
        habits.forEach(h => {
            if (h.history[dateStr]) completed++;
        });
        
        data.push(habits.length ? Math.round((completed / habits.length) * 100) : 0);
    }
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    
    completionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion %',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => context.raw + '%'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Achievements & Gamification
function checkAchievements(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if all habits done today
    if (dateStr === todayStr && habits.length > 0) {
        const allDone = habits.every(h => h.history[todayStr]);
        if (allDone) {
            triggerConfetti();
            unlockBadge('master');
            showToast('Amazing! All habits completed today! 🎉');
        }
    }
    
    // Check Streaks Badges
    habits.forEach(h => {
        const stats = calculateStats(h);
        if (stats.currentStreak >= 30) unlockBadge('streak-30');
        else if (stats.currentStreak >= 7) unlockBadge('streak-7');
        else if (stats.currentStreak >= 3) unlockBadge('streak-3');
    });
}

function triggerConfetti() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
}

function unlockBadge(badgeId) {
    let unlocked = JSON.parse(localStorage.getItem('badges')) || [];
    if (!unlocked.includes(badgeId)) {
        unlocked.push(badgeId);
        localStorage.setItem('badges', JSON.stringify(unlocked));
    }
}

function openAchievements() {
    const container = document.getElementById('badges-container');
    const unlocked = JSON.parse(localStorage.getItem('badges')) || [];
    
    container.innerHTML = '';
    defaultBadges.forEach(badge => {
        const isEarned = unlocked.includes(badge.id);
        container.innerHTML += `
            <div class="badge-card ${isEarned ? 'earned' : ''}">
                <i class="fa-solid ${badge.icon} badge-icon"></i>
                <div class="badge-title">${badge.title}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
    });
    
    achievementsModal.classList.remove('hidden');
}

// Start
document.addEventListener('DOMContentLoaded', init);
