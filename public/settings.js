document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    // POPUP TOAST NOTIFICATION SYSTEM
    // ============================================
    function showPopupToast(message, type = 'success', title = '') {
        const container = document.getElementById('toast-container');
        const overlay = document.getElementById('toast-overlay');
        if (!container) return;

        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        const toastId = 'popup-toast-' + Date.now();

        const titles = {
            success: '🎉 Success!',
            error: '❌ Error!',
            info: 'ℹ️ Information'
        };
        
        const finalTitle = title || titles[type] || 'Notification';
        
        const configs = {
            success: {
                icon: '✅',
                border: 'border-emerald-500/40',
                text: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-500/20',
                progress: 'bg-emerald-500',
                titleColor: 'text-emerald-700 dark:text-emerald-300',
                bg: 'bg-white dark:bg-slate-900/95'
            },
            error: {
                icon: '❌',
                border: 'border-red-500/40',
                text: 'text-red-600 dark:text-red-400',
                iconBg: 'bg-red-500/20',
                progress: 'bg-red-500',
                titleColor: 'text-red-700 dark:text-red-300',
                bg: 'bg-white dark:bg-slate-900/95'
            },
            info: {
                icon: 'ℹ️',
                border: 'border-indigo-500/40',
                text: 'text-indigo-600 dark:text-indigo-400',
                iconBg: 'bg-indigo-500/20',
                progress: 'bg-indigo-500',
                titleColor: 'text-indigo-700 dark:text-indigo-300',
                bg: 'bg-white dark:bg-slate-900/95'
            }
        };

        const config = configs[type] || configs.info;

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `
            popup-toast pointer-events-auto ${config.bg}
            backdrop-blur-xl border ${config.border}
            rounded-2xl shadow-2xl p-6
            flex items-start gap-5
            min-w-[340px] max-w-[460px] w-full
            transform scale-95 translate-y-8 opacity-0
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            relative overflow-hidden
            mx-4
        `;

        toast.innerHTML = `
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div class="h-full ${config.progress} rounded-full transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
            </div>
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center text-3xl shadow-inner">
                ${config.icon}
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
                <h4 class="text-base font-bold ${config.titleColor} mb-1">${finalTitle}</h4>
                <p class="text-sm ${config.text} opacity-90 leading-relaxed">${message}</p>
            </div>
            <button onclick="closePopupToast('${toastId}')" 
                    class="flex-shrink-0 w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200 flex items-center justify-center -mt-1 -mr-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('scale-95', 'translate-y-8', 'opacity-0');
            toast.classList.add('scale-100', 'translate-y-0', 'opacity-100');
        });

        const progressBar = toast.querySelector('.h-full');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 150);
        }

        const timeoutId = setTimeout(() => {
            closePopupToast(toastId);
        }, 4000);

        toast.dataset.timeoutId = timeoutId;
    }

    window.closePopupToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }

        toast.classList.remove('scale-100', 'translate-y-0', 'opacity-100');
        toast.classList.add('scale-95', '-translate-y-8', 'opacity-0');

        setTimeout(() => {
            toast.remove();
            const container = document.getElementById('toast-container');
            const overlay = document.getElementById('toast-overlay');
            if (container && container.children.length === 0 && overlay) {
                overlay.classList.remove('opacity-100', 'pointer-events-auto');
                overlay.classList.add('opacity-0', 'pointer-events-none');
            }
        }, 500);
    };

    function closeAllPopupToasts() {
        document.querySelectorAll('.popup-toast').forEach(t => closePopupToast(t.id));
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllPopupToasts();
    });

    document.getElementById('toast-overlay')?.addEventListener('click', closeAllPopupToasts);

    lucide.createIcons();

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

    async function loadProfile() {
        try {
            const res = await fetch('/api/user/profile');
            const user = await res.json();
            if (res.ok) {
                document.getElementById('profile-name').value = user.name;
                document.getElementById('profile-email').value = user.email;
                document.getElementById('avatar-display').textContent = user.avatar || '👤';
                document.getElementById('user-avatar').textContent = user.avatar || '👤';
                document.getElementById('pref-currency').value = user.currency || 'USD';
                document.getElementById('pref-theme').value = user.theme || 'dark';
                document.getElementById('pref-language').value = user.language || 'en';
                document.getElementById('pref-notifications').checked = user.notifications === 1;
                document.getElementById('budget-limit').value = user.budget_limit || '';
                loadSavingsGoals();
            }
        } catch (err) {
            showPopupToast('Failed to load profile', 'error');
        }
    }

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

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const email = document.getElementById('profile-email').value;
        const avatar = document.getElementById('avatar-display').textContent;
        
        const data = { name, email, avatar };
        
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                document.getElementById('user-avatar').textContent = avatar;
                document.getElementById('user-display-name').textContent = name;
                showPopupToast('Profile updated successfully!', 'success');
            } else {
                const err = await res.json();
                showPopupToast(err.error || 'Failed to update profile', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    });

    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (newPass !== confirm) {
            showPopupToast('Passwords do not match', 'error');
            return;
        }
        if (newPass.length < 6) {
            showPopupToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: current, newPassword: newPass })
            });
            if (res.ok) {
                showPopupToast('Password changed successfully!', 'success');
                document.getElementById('password-form').reset();
            } else {
                const err = await res.json();
                showPopupToast(err.error || 'Failed to change password', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    });

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
                showPopupToast('Preferences saved!', 'success');
                if (data.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (data.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                }
            } else {
                showPopupToast('Failed to save preferences', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    });

    window.saveBudgetLimit = async function() {
        const amount = document.getElementById('budget-limit').value;
        if (!amount || amount <= 0) {
            showPopupToast('Please enter a valid amount', 'error');
            return;
        }
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budget_limit: parseFloat(amount) })
            });
            if (res.ok) {
                showPopupToast('Budget limit saved!', 'success');
            } else {
                showPopupToast('Failed to save budget limit', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    };

    window.changeAvatar = function() {
        const emojis = ['👤', '😊', '😎', '🤩', '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐧', '🐦', '🐤', '🦄', '🐬', '🐳', '🐋', '🦋', '🐝', '🐞', '🌈', '⭐', '🌙', '🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃'];
        
        const current = document.getElementById('avatar-display').textContent;
        const avatarGrid = document.createElement('div');
        avatarGrid.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';
        avatarGrid.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Choose Your Avatar</h3>
                <div class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2">
                    ${emojis.map(emoji => `
                        <button onclick="selectAvatar('${emoji}')" 
                                class="text-2xl p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all ${emoji === current ? 'bg-indigo-100 dark:bg-indigo-950/50 ring-2 ring-indigo-500' : ''}">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
                <div class="flex gap-3 mt-4">
                    <button onclick="closeAvatarModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl transition-all">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(avatarGrid);
    };

    window.selectAvatar = function(emoji) {
        document.getElementById('avatar-display').textContent = emoji;
        closeAvatarModal();
        document.getElementById('profile-form').dispatchEvent(new Event('submit'));
    };

    window.closeAvatarModal = function() {
        const modal = document.querySelector('.fixed.inset-0.z-\\[9999\\]');
        if (modal) modal.remove();
    };

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
                showPopupToast('Savings goal created!', 'success');
                closeGoalModal();
                loadSavingsGoals();
            } else {
                showPopupToast('Failed to create goal', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    });

    window.deleteGoal = async function(id) {
        if (!confirm('Delete this savings goal?')) return;
        try {
            const res = await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showPopupToast('Goal deleted', 'info');
                loadSavingsGoals();
            } else {
                showPopupToast('Failed to delete goal', 'error');
            }
        } catch {
            showPopupToast('Network error', 'error');
        }
    };

    window.exportData = function(format) {
        if (format === 'csv') {
            window.location.href = '/api/export/transactions';
            showPopupToast('Exporting transactions...', 'info');
        } else {
            showPopupToast('PDF export coming soon!', 'info');
        }
    };

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
                showPopupToast('Account deleted successfully', 'info');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                showPopupToast(data.error || 'Failed to delete account', 'error');
            }
        })
        .catch(() => {
            showPopupToast('Network error', 'error');
        });
    };

    loadProfile();
    showSection('profile');
});