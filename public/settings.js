document.addEventListener("DOMContentLoaded", () => {
    // Toast System
    function showToast(message, type = 'success', title = '') {
        const container = document.getElementById('toast-container');
        const overlay = document.getElementById('toast-overlay');
        if (!container) return;

        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        const toastId = 'toast-' + Date.now();
        const titles = { success: 'Success!', error: 'Error!', info: 'Information' };
        const finalTitle = title || titles[type] || 'Notification';
        
        const configs = {
            success: { icon: '✅', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/20', progress: 'bg-emerald-500', titleColor: 'text-emerald-700 dark:text-emerald-300' },
            error: { icon: '❌', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/20', progress: 'bg-red-500', titleColor: 'text-red-700 dark:text-red-300' },
            info: { icon: 'ℹ️', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-500/20', progress: 'bg-indigo-500', titleColor: 'text-indigo-700 dark:text-indigo-300' }
        };
        const config = configs[type] || configs.info;

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `
            toast-item pointer-events-auto bg-white dark:bg-slate-900/95 backdrop-blur-xl
            border ${config.border} rounded-2xl shadow-2xl p-5 flex items-start gap-4
            min-w-[320px] max-w-[440px] w-full transform scale-95 translate-y-4 opacity-0
            transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            relative overflow-hidden mx-4
        `;
        toast.innerHTML = `
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div class="h-full ${config.progress} rounded-full transition-all duration-[3500ms] ease-linear" style="width: 100%"></div>
            </div>
            <div class="flex-shrink-0 w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl">${config.icon}</div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold ${config.titleColor} mb-0.5">${finalTitle}</h4>
                <p class="text-sm ${config.text} opacity-90 leading-relaxed">${message}</p>
            </div>
            <button onclick="closeToast('${toastId}')" class="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('scale-95', 'translate-y-4', 'opacity-0');
            toast.classList.add('scale-100', 'translate-y-0', 'opacity-100');
        });

        const progressBar = toast.querySelector('.h-full');
        if (progressBar) {
            setTimeout(() => { progressBar.style.width = '0%'; }, 100);
        }

        const timeoutId = setTimeout(() => { closeToast(toastId); }, 3500);
        toast.dataset.timeoutId = timeoutId;
    }

    window.closeToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;
        if (toast.dataset.timeoutId) clearTimeout(parseInt(toast.dataset.timeoutId));
        toast.classList.remove('scale-100', 'translate-y-0', 'opacity-100');
        toast.classList.add('scale-95', '-translate-y-4', 'opacity-0');
        setTimeout(() => {
            toast.remove();
            const container = document.getElementById('toast-container');
            const overlay = document.getElementById('toast-overlay');
            if (container && container.children.length === 0 && overlay) {
                overlay.classList.remove('opacity-100', 'pointer-events-auto');
                overlay.classList.add('opacity-0', 'pointer-events-none');
            }
        }, 400);
    };

    function closeAllToasts() {
        document.querySelectorAll('.toast-item').forEach(t => closeToast(t.id));
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllToasts(); });
    document.getElementById('toast-overlay')?.addEventListener('click', closeAllToasts);

    // Render Icons
    lucide.createIcons();

    // Navigation
    window.showSection = function(sectionId) {
        document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('hidden'));
        document.getElementById(`section-${sectionId}`).classList.remove('hidden');
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        const clickedBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('bg-indigo-600', 'text-white');
            clickedBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
        }
    };

    // Load Profile
    async function loadProfile() {
        try {
            const res = await fetch('/api/user/profile');
            const user = await res.json();
            if (res.ok) {
                document.getElementById('profile-name').value = user.name;
                document.getElementById('profile-email').value = user.email;
                document.getElementById('avatar-display').textContent = user.avatar || '👤';
                document.getElementById('pref-currency').value = user.currency || 'USD';
                document.getElementById('pref-theme').value = user.theme || 'dark';
                document.getElementById('pref-language').value = user.language || 'en';
                document.getElementById('pref-notifications').checked = user.notifications === 1;
                document.getElementById('budget-limit').value = user.budget_limit || '';
                loadSavingsGoals();
            }
        } catch (err) {
            showToast('Failed to load profile', 'error');
        }
    }

    // Load Savings Goals
    async function loadSavingsGoals() {
        try {
            const res = await fetch('/api/savings-goals');
            const goals = await res.json();
            const container = document.getElementById('savings-goals-list');
            container.innerHTML = '';
            if (goals.length === 0) {
                container.innerHTML = `<p class="text-sm text-slate-400">No savings goals yet. Create your first goal!</p>`;
                return;
            }
            goals.forEach(goal => {
                const progress = goal.current_amount / goal.target_amount * 100;
                const div = document.createElement('div');
                div.className = 'bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3';
                div.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">${goal.name}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">${goal.status}</span>
                        </div>
                        <button onclick="deleteGoal(${goal.id})" class="text-red-500 hover:text-red-600 text-sm">Delete</button>
                    </div>
                    <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>$${goal.current_amount.toFixed(2)} raised</span>
                        <span>$${goal.target_amount.toFixed(2)} goal</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div class="bg-indigo-500 h-2 rounded-full transition-all" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            console.error('Failed to load goals:', err);
        }
    }

    // Profile Form
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            avatar: document.getElementById('avatar-display').textContent
        };
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Profile updated successfully!', 'success');
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to update profile', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // Password Form
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (newPass !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (newPass.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: current, newPassword: newPass })
            });
            if (res.ok) {
                showToast('Password changed successfully!', 'success');
                document.getElementById('password-form').reset();
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to change password', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // Preferences Form
    document.getElementById('preferences-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            currency: document.getElementById('pref-currency').value,
            theme: document.getElementById('pref-theme').value,
            language: document.getElementById('pref-language').value,
            notifications: document.getElementById('pref-notifications').checked ? 1 : 0
        };
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Preferences saved!', 'success');
                // Apply theme immediately
                if (data.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (data.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                }
            } else {
                showToast('Failed to save preferences', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // Save Budget Limit
    window.saveBudgetLimit = async function() {
        const amount = document.getElementById('budget-limit').value;
        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budget_limit: parseFloat(amount) })
            });
            if (res.ok) {
                showToast('Budget limit saved!', 'success');
            } else {
                showToast('Failed to save budget limit', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    };

    // Change Avatar
    window.changeAvatar = function() {
        const emojis = ['👤', '😊', '😎', '🤩', '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐧', '🐦', '🐤', '🦄', '🐬', '🐳', '🐋', '🦋', '🐝', '🐞', '🌈', '⭐', '🌙', '🌸', '🌺', '🌻', '🌹'];
        const current = document.getElementById('avatar-display').textContent;
        let newAvatar = current;
        while (newAvatar === current) {
            newAvatar = emojis[Math.floor(Math.random() * emojis.length)];
        }
        document.getElementById('avatar-display').textContent = newAvatar;
        // Auto-save profile with new avatar
        document.getElementById('profile-form').dispatchEvent(new Event('submit'));
    };

    // Goal Modal
    window.showAddGoalModal = function() {
        document.getElementById('goal-modal').classList.remove('hidden');
    };

    window.closeGoalModal = function() {
        document.getElementById('goal-modal').classList.add('hidden');
        document.getElementById('goal-form').reset();
    };

    document.getElementById('goal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('goal-name').value;
        const target_amount = parseFloat(document.getElementById('goal-target').value);
        const deadline = document.getElementById('goal-deadline').value;

        try {
            const res = await fetch('/api/savings-goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, target_amount, deadline })
            });
            if (res.ok) {
                showToast('Savings goal created!', 'success');
                closeGoalModal();
                loadSavingsGoals();
            } else {
                showToast('Failed to create goal', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // Delete Goal
    window.deleteGoal = async function(id) {
        if (!confirm('Delete this savings goal?')) return;
        try {
            const res = await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Goal deleted', 'info');
                loadSavingsGoals();
            } else {
                showToast('Failed to delete goal', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    };

    // Export Data
    window.exportData = function(format) {
        if (format === 'csv') {
            window.location.href = '/api/export/transactions';
            showToast('Exporting transactions...', 'info');
        } else {
            showToast('PDF export coming soon!', 'info');
        }
    };

    // Delete Account
    window.deleteAccount = function() {
        const confirmed = confirm('⚠️ Are you sure you want to delete your account? This action is irreversible and will delete ALL your data!');
        if (!confirmed) return;

        const password = prompt('Please enter your password to confirm account deletion:');
        if (!password) return;

        fetch('/api/user/delete-account', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Account deleted successfully', 'info');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                showToast(data.error || 'Failed to delete account', 'error');
            }
        })
        .catch(() => {
            showToast('Network error', 'error');
        });
    };

    // Initialize
    loadProfile();

    // Show first section by default
    showSection('profile');
});