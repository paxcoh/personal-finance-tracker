document.addEventListener("DOMContentLoaded", () => {
    let platformChart = null;

    // ============================================
    // ENHANCED TOAST NOTIFICATION SYSTEM
    // ============================================
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
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Secure Layout Access Guard
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user.role === 'admin') {
                loadAdminDashboard();
                showToast('Welcome to Admin Panel!', 'success', 'Admin Access Granted 🔐');
            } else {
                window.location.href = "/index.html";
            }
        } catch (error) {
            window.location.href = "/login.html";
        }
    }

    function loadAdminDashboard() {
        loadUsersList();
        loadAnalyticsChart();
        loadAdminStats();
    }

    // Load Admin Statistics
    async function loadAdminStats() {
        try {
            const res = await fetch('/api/admin/stats');
            const stats = await res.json();
            // You can add stats cards to the admin panel if needed
            console.log('Admin Stats:', stats);
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        }
    }

    // Populate user listing
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
                        <td colspan="5" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            No users registered yet.
                        </td>
                    </tr>
                `;
                return;
            }

            users.forEach(u => {
                const row = document.createElement("tr");
                row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all";
                const totalAmount = (u.total_income || 0) - (u.total_expense || 0);
                row.innerHTML = `
                    <td class="py-3 text-sm font-medium text-slate-600 dark:text-slate-300">#${u.id}</td>
                    <td class="py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">${u.name || 'N/A'}</td>
                    <td class="py-3 text-sm text-slate-600 dark:text-slate-300">${u.email || 'N/A'}</td>
                    <td class="py-3 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin' 
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' 
                            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        }">
                            ${u.role || 'user'}
                        </span>
                        <span class="ml-2 text-xs text-slate-400">${u.transaction_count || 0} txns</span>
                    </td>
                    <td class="py-3 text-sm text-right">
                        <button class="inspect-btn text-indigo-500 hover:text-indigo-400 font-semibold transition-all mr-3" data-id="${u.id}" data-name="${u.name}">
                            Inspect
                        </button>
                        ${u.role !== 'admin' ? `<button class="delete-user-btn text-red-500 hover:text-red-400 font-semibold transition-all" data-id="${u.id}">
                            Delete
                        </button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Register Action triggers
            document.querySelectorAll(".inspect-btn").forEach(btn => {
                btn.addEventListener("click", inspectUserTransactions);
            });
            document.querySelectorAll(".delete-user-btn").forEach(btn => {
                btn.addEventListener("click", purgeUserAccount);
            });
        } catch (err) {
            console.error('Failed to load users:', err);
            showToast('Failed to load users list', 'error');
        }
    }

    // Generate Dynamic Platform-Wide charts
    async function loadAnalyticsChart() {
        try {
            const res = await fetch('/api/admin/analytics');
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const data = await res.json();

            const ctx = document.getElementById('platformChart');
            if (!ctx) return;
            
            if (platformChart) {
                platformChart.destroy();
            }

            // Check if we have data
            const hasData = data.monthlyData && data.monthlyData.length > 0;
            
            if (!hasData) {
                // Show empty state
                platformChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['No Data Available'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#94a3b8'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
                return;
            }

            // Calculate totals from monthly data
            let totalIncome = 0;
            let totalExpense = 0;
            data.monthlyData.forEach(month => {
                totalIncome += month.income || 0;
                totalExpense += month.expense || 0;
            });

            platformChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Platform Global Income', 'Platform Global Expense'],
                    datasets: [{
                        data: [totalIncome, totalExpense],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 3,
                        borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
                                font: { family: 'Inter', size: 12, weight: '500' },
                                padding: 20
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Failed to load analytics chart:", err);
            showToast("Failed to load analytics chart.", 'error', 'Chart Error');
        }
    }

    // Inspect user records
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
            showToast(`Viewing transactions for ${userName}`, 'info', 'Audit Mode 🔍');
        } catch (err) {
            console.error('Failed to load user transactions:', err);
            showToast("Failed to load user transactions.", 'error', 'Audit Error');
        }
    }

    // Create New User Form Handler
    document.getElementById("admin-user-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("admin-reg-name").value;
        const email = document.getElementById("admin-reg-email").value;
        const password = document.getElementById("admin-reg-password").value;
        const role = document.getElementById("admin-reg-role").value;
        const feedback = document.getElementById("form-feedback");

        if (!name || !email || !password) {
            showToast('All fields are required', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
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
                showToast(`User ${name} created successfully!`, 'success', 'Account Created 🎉');
            } else {
                if (feedback) {
                    feedback.style.color = "#ef4444";
                    feedback.textContent = data.error || "Failed to provision account.";
                }
                showToast(data.error || "Failed to provision account.", 'error', 'Creation Failed');
            }
        } catch (err) {
            console.error('Failed to create user:', err);
            showToast("Network error. Please try again.", 'error', 'Network Error');
        }
    });

    // Delete User and user transactions completely
    async function purgeUserAccount(e) {
        const id = e.target.getAttribute("data-id");
        if (!confirm("⚠️ Are you sure you want to delete this user and all associated financial records permanently?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadUsersList();
                document.getElementById("user-inspect-section").style.display = "none";
                showToast("User account and all records wiped successfully.", 'info', 'Account Deleted 🗑️');
            } else {
                showToast("Failed to delete user account.", 'error', 'Deletion Failed');
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
            showToast("Failed to delete user account.", 'error', 'Deletion Failed');
        }
    }

    // Log Out Admin Session
    document.getElementById("btn-admin-logout")?.addEventListener("click", async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            showToast("Logged out successfully!", 'info', 'See You Soon 👋');
            setTimeout(() => {
                window.location.href = "/login.html";
            }, 500);
        } catch (err) {
            console.error('Logout failed:', err);
            showToast("Logout failed. Please try again.", 'error', 'Logout Error');
        }
    });

    // Check admin auth on load
    checkAdminAuth();

    // Re-render icons after any DOM updates
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 100);
    }
});