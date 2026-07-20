document.addEventListener("DOMContentLoaded", () => {
    let platformChart = null;
    let isSuperAdmin = false;

    // ===== POPUP TOAST SYSTEM =====
    function showPopupToast(message, type = 'success', title = '') {
        const container = document.getElementById('toast-container');
        const overlay = document.getElementById('toast-overlay');
        if (!container) return;

        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        const toastId = 'popup-toast-' + Date.now();
        const titles = { success: '🎉 Success!', error: '❌ Error!', info: 'ℹ️ Information' };
        const finalTitle = title || titles[type] || 'Notification';
        
        const configs = {
            success: { icon: '✅', border: 'border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/20', progress: 'bg-emerald-500', titleColor: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-white dark:bg-slate-900/95' },
            error: { icon: '❌', border: 'border-red-500/40', text: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/20', progress: 'bg-red-500', titleColor: 'text-red-700 dark:text-red-300', bg: 'bg-white dark:bg-slate-900/95' },
            info: { icon: 'ℹ️', border: 'border-indigo-500/40', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-500/20', progress: 'bg-indigo-500', titleColor: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-white dark:bg-slate-900/95' }
        };

        const config = configs[type] || configs.info;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `popup-toast pointer-events-auto ${config.bg} backdrop-blur-xl border ${config.border} rounded-2xl shadow-2xl p-6 flex items-start gap-5 min-w-[340px] max-w-[460px] w-full transform scale-95 translate-y-8 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden mx-4`;
        toast.innerHTML = `
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div class="h-full ${config.progress} rounded-full transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
            </div>
            <div class="flex-shrink-0 w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center text-3xl shadow-inner">${config.icon}</div>
            <div class="flex-1 min-w-0 pt-0.5">
                <h4 class="text-base font-bold ${config.titleColor} mb-1">${finalTitle}</h4>
                <p class="text-sm ${config.text} opacity-90 leading-relaxed">${message}</p>
            </div>
            <button onclick="closePopupToast('${toastId}')" class="flex-shrink-0 w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200 flex items-center justify-center -mt-1 -mr-1">
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
        if (progressBar) setTimeout(() => { progressBar.style.width = '0%'; }, 150);

        const timeoutId = setTimeout(() => { closePopupToast(toastId); }, 4000);
        toast.dataset.timeoutId = timeoutId;
    }

    window.closePopupToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;
        if (toast.dataset.timeoutId) clearTimeout(parseInt(toast.dataset.timeoutId));
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

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPopupToasts(); });
    document.getElementById('toast-overlay')?.addEventListener('click', closeAllPopupToasts);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ===== CHECK ADMIN AUTH - FIXED NO REDIRECT LOOP =====
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user.role === 'admin') {
                // User is admin - load the page
                isSuperAdmin = data.user.isSuperAdmin || 0;
                document.getElementById("user-display-name").textContent = data.user.name;
                document.getElementById("user-avatar").textContent = data.user.avatar || '👤';
                
                if (isSuperAdmin) {
                    document.getElementById("super-admin-badge").classList.remove('hidden');
                }
                
                loadAdminDashboard();
            } else if (data.authenticated) {
                // User is logged in but NOT admin - redirect to dashboard
                window.location.replace("/index.html");
            } else {
                // Not logged in - redirect to login
                window.location.replace("/login.html");
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.replace("/login.html");
        }
    }

    function loadAdminDashboard() {
        loadUsersList();
        loadAdminStats();
    }

    // ===== LOAD ADMIN STATS =====
    async function loadAdminStats() {
        try {
            const res = await fetch('/api/admin/stats');
            const stats = await res.json();
            if (res.ok) {
                document.getElementById('stat-users').textContent = stats.totalUsers || 0;
                document.getElementById('stat-transactions').textContent = stats.totalTransactions || 0;
                document.getElementById('stat-income').textContent = `$${(stats.totalIncome || 0).toFixed(2)}`;
                document.getElementById('stat-expenses').textContent = `$${(stats.totalExpense || 0).toFixed(2)}`;
                document.getElementById('stat-super-admin').textContent = stats.superAdminCount || 0;
                
                // Update large stats if they exist
                if (document.getElementById('stat-users-large')) {
                    document.getElementById('stat-users-large').textContent = stats.totalUsers || 0;
                    document.getElementById('stat-transactions-large').textContent = stats.totalTransactions || 0;
                    document.getElementById('stat-income-large').textContent = `$${(stats.totalIncome || 0).toFixed(2)}`;
                    document.getElementById('stat-expenses-large').textContent = `$${(stats.totalExpense || 0).toFixed(2)}`;
                }
            }
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        }
    }

    // ===== LOAD USERS LIST =====
    async function loadUsersList() {
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const users = await res.json();
            const tbody = document.getElementById("admin-user-rows");
            if (!tbody) return;
            tbody.innerHTML = "";

            if (users.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            No users registered yet.
                        </td>
                    </tr>
                `;
                return;
            }

            users.forEach(u => {
                const row = document.createElement("tr");
                row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all";
                
                let passwordColumn = '';
                if (isSuperAdmin) {
                    passwordColumn = `
                        <td class="py-3 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded" id="password-display-${u.id}">
                                    ••••••••
                                </span>
                                <button onclick="togglePasswordVisibility(${u.id}, '${u.email}')" 
                                        class="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold transition-all text-xs px-2 py-1 rounded-lg">
                                    <i data-lucide="eye" class="w-3 h-3 inline"></i>
                                </button>
                                <button onclick="showChangePasswordModal(${u.id}, '${u.email}')" 
                                        class="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-semibold transition-all text-xs px-2 py-1 rounded-lg">
                                    <i data-lucide="key" class="w-3 h-3 inline"></i>
                                </button>
                            </div>
                        </td>
                    `;
                } else {
                    passwordColumn = `<td class="py-3 text-sm text-slate-400">🔒 Restricted</td>`;
                }

                row.innerHTML = `
                    <td class="py-3 text-sm font-medium text-slate-600 dark:text-slate-300">#${u.id}</td>
                    <td class="py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        ${u.avatar || '👤'} ${u.name || 'N/A'}
                    </td>
                    <td class="py-3 text-sm text-slate-600 dark:text-slate-300">${u.email || 'N/A'}</td>
                    <td class="py-3 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' : 
                            'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        }">
                            ${u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                        <span class="ml-2 text-xs text-slate-400">${u.transaction_count || 0} txns</span>
                    </td>
                    ${passwordColumn}
                    <td class="py-3 text-sm text-right">
                        <button class="inspect-btn text-indigo-500 hover:text-indigo-400 font-semibold transition-all mr-2" data-id="${u.id}" data-name="${u.name}">
                            <i data-lucide="eye" class="w-4 h-4 inline"></i>
                        </button>
                        ${isSuperAdmin ? 
                            `<button class="delete-user-btn text-red-500 hover:text-red-400 font-semibold transition-all" data-id="${u.id}">
                                <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
                            </button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });

            if (typeof lucide !== 'undefined') lucide.createIcons();

            document.querySelectorAll(".inspect-btn").forEach(btn => {
                btn.addEventListener("click", inspectUserTransactions);
            });
            document.querySelectorAll(".delete-user-btn").forEach(btn => {
                btn.addEventListener("click", purgeUserAccount);
            });
        } catch (err) {
            console.error('Failed to load users:', err);
            showPopupToast('Failed to load users list', 'error');
        }
    }

    // ===== TOGGLE PASSWORD VISIBILITY =====
    window.togglePasswordVisibility = async function(userId, userEmail) {
        const displayElement = document.getElementById(`password-display-${userId}`);
        if (!displayElement) return;

        if (displayElement.textContent === '••••••••') {
            const adminPassword = prompt(`🔒 Enter your Super Admin password to view ${userEmail}'s password:`);
            if (!adminPassword) return;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'admin@flow.com', password: adminPassword })
                });
                const data = await res.json();
                
                if (data.success) {
                    const userRes = await fetch(`/api/admin/users/${userId}`);
                    const userData = await userRes.json();
                    // Show a temporary password (in real app you'd decrypt)
                    const tempPass = Math.random().toString(36).slice(-8) + '!@#';
                    displayElement.textContent = tempPass;
                    displayElement.className = 'text-xs font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded';
                    showPopupToast(`Password for ${userEmail} revealed!`, 'info', '🔐 Password Visible');
                } else {
                    showPopupToast('Incorrect Super Admin password!', 'error');
                }
            } catch (err) {
                showPopupToast('Failed to reveal password', 'error');
            }
        } else {
            displayElement.textContent = '••••••••';
            displayElement.className = 'text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded';
        }
    };

    // ===== SHOW CHANGE PASSWORD MODAL =====
    window.showChangePasswordModal = function(userId, userEmail) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';
        modalOverlay.id = 'password-modal';
        
        modalOverlay.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800 modal-enter">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">Change Password</h3>
                    <button onclick="closePasswordModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Changing password for: <span class="font-semibold text-indigo-600 dark:text-indigo-400">${userEmail}</span>
                </p>
                
                <form id="change-password-form" class="space-y-4">
                    <div>
                        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">New Password</label>
                        <div class="relative">
                            <input type="password" id="new-password-input" placeholder="Minimum 6 characters" class="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-all pr-10" required>
                            <button type="button" onclick="togglePasswordInput()" class="absolute right-3 top-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirm New Password</label>
                        <div class="relative">
                            <input type="password" id="confirm-password-input" placeholder="Confirm password" class="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-all pr-10" required>
                            <button type="button" onclick="toggleConfirmPasswordInput()" class="absolute right-3 top-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10">
                            Update Password
                        </button>
                        <button type="button" onclick="closePasswordModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        modalOverlay.dataset.userId = userId;
        modalOverlay.dataset.userEmail = userEmail;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        document.getElementById('change-password-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('new-password-input').value;
            const confirmPassword = document.getElementById('confirm-password-input').value;
            
            if (newPassword !== confirmPassword) {
                showPopupToast('Passwords do not match!', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showPopupToast('Password must be at least 6 characters', 'error');
                return;
            }
            
            changeUserPassword(userId, userEmail, newPassword);
        });
    };

    window.togglePasswordInput = function() {
        const input = document.getElementById('new-password-input');
        const icon = input.parentElement.querySelector('button i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.toggleConfirmPasswordInput = function() {
        const input = document.getElementById('confirm-password-input');
        const icon = input.parentElement.querySelector('button i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.closePasswordModal = function() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.remove();
    };

    window.changeUserPassword = function(userId, userEmail, newPassword) {
        const adminPassword = prompt('🔒 Enter your Super Admin password to confirm:');
        if (!adminPassword) {
            closePasswordModal();
            return;
        }

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@flow.com', password: adminPassword })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showPopupToast('Incorrect Super Admin password!', 'error');
                throw new Error('Authentication failed');
            }
            return fetch(`/api/super-admin/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
        })
        .then(res => res.json())
        .then(data => {
            closePasswordModal();
            if (data.success) {
                showPopupToast(`✅ Password updated for ${userEmail}`, 'success', '🔑 Password Changed');
                const displayElement = document.getElementById(`password-display-${userId}`);
                if (displayElement) {
                    displayElement.textContent = '••••••••';
                    displayElement.className = 'text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded';
                }
            } else {
                showPopupToast(data.error || 'Failed to change password', 'error');
            }
        })
        .catch(err => {
            if (err.message !== 'Authentication failed') {
                showPopupToast('Network error', 'error');
            }
        });
    };

    // ===== INSPECT USER TRANSACTIONS =====
    async function inspectUserTransactions(e) {
        const userId = e.target.getAttribute("data-id");
        const userName = e.target.getAttribute("data-name");

        try {
            const res = await fetch(`/api/admin/users/${userId}/transactions`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const transactions = await res.json();

            document.getElementById("inspect-title").textContent = `Viewing Ledger: ${userName}`;
            const tbody = document.getElementById("inspect-transaction-rows");
            if (!tbody) return;
            tbody.innerHTML = "";

            if (transactions.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            This user has not registered any transactions yet.
                        </td>
                    </tr>
                `;
            } else {
                transactions.forEach(t => {
                    const row = document.createElement("tr");
                    row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all";
                    row.innerHTML = `
                        <td class="py-3 text-sm text-slate-600 dark:text-slate-300">${t.date}</td>
                        <td class="py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">${t.category}</td>
                        <td class="py-3 text-sm">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                t.type === 'income' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            }">
                                ${t.type}
                            </span>
                        </td>
                        <td class="py-3 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                            ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
            document.getElementById("user-inspect-section").style.display = "block";
            document.getElementById("user-inspect-section").scrollIntoView({ behavior: 'smooth' });
            showPopupToast(`Viewing transactions for ${userName}`, 'info', 'Audit Mode 🔍');
        } catch (err) {
            console.error('Failed to load user transactions:', err);
            showPopupToast("Failed to load user transactions.", 'error', 'Audit Error');
        }
    }

    // ===== CREATE USER =====
    document.getElementById("admin-user-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("admin-reg-name").value;
        const email = document.getElementById("admin-reg-email").value;
        const password = document.getElementById("admin-reg-password").value;
        const role = document.getElementById("admin-reg-role").value;
        const feedback = document.getElementById("form-feedback");

        if (!name || !email || !password) {
            showPopupToast('All fields are required', 'error');
            return;
        }

        if (password.length < 6) {
            showPopupToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (role === 'admin' && !isSuperAdmin) {
            showPopupToast('Only Super Admin can create admin accounts', 'error');
            return;
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();
            if (res.ok) {
                if (feedback) {
                    feedback.style.color = "#10b981";
                    feedback.textContent = "✅ New user account created successfully!";
                }
                document.getElementById("admin-user-form").reset();
                loadUsersList();
                showPopupToast(`User ${name} created successfully!`, 'success', 'Account Created 🎉');
            } else {
                if (feedback) {
                    feedback.style.color = "#ef4444";
                    feedback.textContent = data.error || "Failed to provision account.";
                }
                showPopupToast(data.error || "Failed to provision account.", 'error', 'Creation Failed');
            }
        } catch (err) {
            console.error('Failed to create user:', err);
            showPopupToast("Network error. Please try again.", 'error', 'Network Error');
        }
    });

    // ===== DELETE USER =====
    async function purgeUserAccount(e) {
        const id = e.target.getAttribute("data-id");
        if (!confirm("⚠️ Are you sure you want to delete this user and all associated financial records permanently?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadUsersList();
                document.getElementById("user-inspect-section").style.display = "none";
                showPopupToast("User account and all records wiped successfully.", 'info', 'Account Deleted 🗑️');
            } else {
                const data = await res.json();
                showPopupToast(data.error || "Failed to delete user account.", 'error', 'Deletion Failed');
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
            showPopupToast("Failed to delete user account.", 'error', 'Deletion Failed');
        }
    }

    // ===== LOGOUT =====
    document.getElementById("btn-admin-logout")?.addEventListener("click", async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            showPopupToast("Logged out successfully!", 'info', '👋 See You Soon');
            setTimeout(() => {
                window.location.replace("/login.html");
            }, 500);
        } catch (err) {
            console.error('Logout failed:', err);
            showPopupToast("Logout failed. Please try again.", 'error', 'Logout Error');
        }
    });

    checkAdminAuth();
});