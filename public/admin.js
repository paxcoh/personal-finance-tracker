
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

        const titles = {
            success: 'Success!',
            error: 'Error!',
            info: 'Information'
        };
        
        const finalTitle = title || titles[type] || 'Notification';
        
        const configs = {
            success: {
                icon: '✅',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                text: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-500/20',
                progress: 'bg-emerald-500',
                titleColor: 'text-emerald-700 dark:text-emerald-300'
            },
            error: {
                icon: '❌',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                text: 'text-red-600 dark:text-red-400',
                iconBg: 'bg-red-500/20',
                progress: 'bg-red-500',
                titleColor: 'text-red-700 dark:text-red-300'
            },
            info: {
                icon: 'ℹ️',
                bg: 'bg-indigo-500/10',
                border: 'border-indigo-500/30',
                text: 'text-indigo-600 dark:text-indigo-400',
                iconBg: 'bg-indigo-500/20',
                progress: 'bg-indigo-500',
                titleColor: 'text-indigo-700 dark:text-indigo-300'
            }
        };

        const config = configs[type] || configs.info;

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `
            toast-item pointer-events-auto
            bg-white dark:bg-slate-900/95
            backdrop-blur-xl
            border ${config.border}
            rounded-2xl
            shadow-2xl
            p-5
            flex items-start gap-4
            min-w-[320px] max-w-[440px] w-full
            transform scale-95 translate-y-4 opacity-0
            transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            relative overflow-hidden
            mx-4
        `;

        toast.innerHTML = `
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div class="h-full ${config.progress} rounded-full transition-all duration-[3500ms] ease-linear" style="width: 100%"></div>
            </div>
            <div class="flex-shrink-0 w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl">
                ${config.icon}
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold ${config.titleColor} mb-0.5">${finalTitle}</h4>
                <p class="text-sm ${config.text} opacity-90 leading-relaxed">${message}</p>
            </div>
            <button onclick="closeToast('${toastId}')" 
                    class="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200 flex items-center justify-center">
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
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }

        const timeoutId = setTimeout(() => {
            closeToast(toastId);
        }, 3500);

        toast.dataset.timeoutId = timeoutId;
    }

    window.closeToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }

        toast.classList.remove('scale-100', 'translate-y-0', 'opacity-100');
        toast.classList.add('scale-95', '-translate-y-4', 'opacity-0');

        setTimeout(() => {
            toast.remove();
            const container = document.getElementById('toast-container');
            const overlay = document.getElementById('toast-overlay');
            if (container && container.children.length === 0) {
                if (overlay) {
                    overlay.classList.remove('opacity-100', 'pointer-events-auto');
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                }
            }
        }, 400);
    }

    function closeAllToasts() {
        const container = document.getElementById('toast-container');
        if (container) {
            const toasts = container.querySelectorAll('.toast-item');
            toasts.forEach(toast => {
                window.closeToast(toast.id);
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllToasts();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('toast-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeAllToasts);
        }
    });

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
    }

    // Populate user listing
    async function loadUsersList() {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        const tbody = document.getElementById("admin-user-rows");
        tbody.innerHTML = "";

        users.forEach(u => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="tag ${u.role === 'admin' ? 'income' : 'expense'}">${u.role}</span></td>
                <td>
                    <button class="btn-inspect inspect-btn" data-id="${u.id}" data-name="${u.name}">Inspect Ledger</button>
                    ${u.role !== 'admin' ? `<button class="btn-cancel delete-user-btn" data-id="${u.id}" style="width: auto; margin: 0; padding: 6px 12px; font-size: 0.8rem; background-color: #ef4444; color: white; border: none;">Wipe Account</button>` : ''}
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
    }

    // Generate Dynamic Platform-Wide charts
    async function loadAnalyticsChart() {
        try {
            const res = await fetch('/api/admin/analytics');
            const analytics = await res.json();

            const ctx = document.getElementById('platformChart').getContext('2d');
            
            if (platformChart) {
                platformChart.destroy();
            }

            platformChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Platform Global Income', 'Platform Global Expense'],
                    datasets: [{
                        data: [analytics.totalIncome, analytics.totalExpense],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { family: 'Inter', size: 12, weight: '500' }
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
            const transactions = await res.json();

            document.getElementById("inspect-title").textContent = `Viewing Ledger: ${userName}`;
            const tbody = document.getElementById("inspect-transaction-rows");
            tbody.innerHTML = "";

            if (transactions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-gray);">This user has not registered any transactions yet.</td></tr>`;
            } else {
                transactions.forEach(t => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${t.date}</td>
                        <td>${t.category}</td>
                        <td><span class="tag ${t.type}">${t.type}</span></td>
                        <td style="color: ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
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
            showToast("Failed to load user transactions.", 'error', 'Audit Error');
        }
    }

    // Create New User Form Handler
    document.getElementById("admin-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("admin-reg-name").value;
        const email = document.getElementById("admin-reg-email").value;
        const password = document.getElementById("admin-reg-password").value;
        const role = document.getElementById("admin-reg-role").value;
        const feedback = document.getElementById("form-feedback");

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();
            if (res.ok) {
                feedback.style.color = "var(--success)";
                feedback.textContent = "New user account created successfully!";
                document.getElementById("admin-user-form").reset();
                loadAdminDashboard();
                showToast(`User ${name} created successfully!`, 'success', 'Account Created 🎉');
            } else {
                feedback.style.color = "var(--danger)";
                feedback.textContent = data.error || "Failed to provision account.";
                showToast(data.error || "Failed to provision account.", 'error', 'Creation Failed');
            }
        } catch (err) {
            showToast("Network error. Please try again.", 'error', 'Network Error');
        }
    });

    // Delete User and user transactions completely (Cascade deletion)
    async function purgeUserAccount(e) {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this user and all associated financial records permanently?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadAdminDashboard();
                document.getElementById("user-inspect-section").style.display = "none";
                showToast("User account and all records wiped successfully.", 'info', 'Account Deleted 🗑️');
            }
        } catch (err) {
            showToast("Failed to delete user account.", 'error', 'Deletion Failed');
        }
    }

    // Log Out Admin Session
    document.getElementById("btn-admin-logout").addEventListener("click", async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            showToast("Logged out successfully!", 'info', 'See You Soon 👋');
            setTimeout(() => {
                window.location.href = "/login.html";
            }, 500);
        } catch (err) {
            showToast("Logout failed. Please try again.", 'error', 'Logout Error');
        }
    });

    checkAdminAuth();
});