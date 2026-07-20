document.addEventListener("DOMContentLoaded", () => {
    let systemTrendChart = null;
    let systemCategoryChart = null;
    let userActivityChart = null;

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

    // ===== CHECK SUPER ADMIN AUTH =====
    async function checkSuperAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user.role === 'admin' && data.user.isSuperAdmin === 1) {
                document.getElementById("user-display-name").textContent = data.user.name;
                document.getElementById("user-avatar").textContent = data.user.avatar || '👤';
                loadSuperAdminDashboard();
            } else if (data.authenticated) {
                // Logged in but not Super Admin - redirect to dashboard
                window.location.replace("/index.html");
            } else {
                window.location.replace("/login.html");
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.replace("/login.html");
        }
    }

    // ============================================
    // LOAD SUPER ADMIN DASHBOARD (FIXED)
    // ============================================
    async function loadSuperAdminDashboard() {
        try {
            const res = await fetch('/api/super-admin/analytics');
            
            // Check if response is ok
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            // Ensure we have data structure even if empty
            const safeData = {
                systemStats: data.systemStats || { totalIncome: 0, totalExpense: 0, totalTransactions: 0, activeUsers: 0 },
                monthlyData: data.monthlyData || [],
                topCategories: data.topCategories || [],
                userActivity: data.userActivity || [],
                topUsers: data.topUsers || []
            };

            // Update stats
            document.getElementById('sa-total-income').textContent = `$${(safeData.systemStats.totalIncome || 0).toFixed(2)}`;
            document.getElementById('sa-total-expenses').textContent = `$${(safeData.systemStats.totalExpense || 0).toFixed(2)}`;
            document.getElementById('sa-net-savings').textContent = `$${((safeData.systemStats.totalIncome || 0) - (safeData.systemStats.totalExpense || 0)).toFixed(2)}`;
            document.getElementById('sa-total-users').textContent = safeData.systemStats.activeUsers || 0;

            // Update charts
            updateSystemTrendChart(safeData.monthlyData);
            updateSystemCategoryChart(safeData.topCategories);
            updateUserActivityChart(safeData.userActivity);
            updateTopUsersList(safeData.topUsers);

            // If no data, show a friendly message
            if (safeData.monthlyData.length === 0 && safeData.topCategories.length === 0) {
                showPopupToast('No transaction data available yet. Start adding transactions!', 'info', '📊 No Data');
            }

        } catch (err) {
            console.error('Failed to load super admin dashboard:', err);
            showPopupToast('Failed to load system analytics. Please try again.', 'error', '❌ Error');
            
            // Show empty state
            document.getElementById('sa-total-income').textContent = '$0.00';
            document.getElementById('sa-total-expenses').textContent = '$0.00';
            document.getElementById('sa-net-savings').textContent = '$0.00';
            document.getElementById('sa-total-users').textContent = '0';
            
            // Create empty charts
            updateSystemTrendChart([]);
            updateSystemCategoryChart([]);
            updateUserActivityChart([]);
            updateTopUsersList([]);
        }
    }

    // ============================================
    // SYSTEM TREND CHART
    // ============================================
    function updateSystemTrendChart(monthlyData) {
        const ctx = document.getElementById('systemTrendChart');
        if (!ctx) return;
        
        if (systemTrendChart) systemTrendChart.destroy();

        if (!monthlyData || monthlyData.length === 0) {
            systemTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['No Data Available'],
                    datasets: [
                        { label: 'Income', data: [0], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Expenses', data: [0], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                        },
                        x: {
                            ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                        }
                    }
                }
            });
            return;
        }

        const labels = monthlyData.map(d => d.month);
        const incomeData = monthlyData.map(d => d.income || 0);
        const expenseData = monthlyData.map(d => d.expense || 0);

        systemTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'System Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'System Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
                            font: { size: 11 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                            callback: function(value) { return '$' + value.toLocaleString(); }
                        }
                    },
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
                        }
                    }
                }
            }
        });
    }

    // ============================================
    // SYSTEM CATEGORY CHART
    // ============================================
    function updateSystemCategoryChart(topCategories) {
        const ctx = document.getElementById('systemCategoryChart');
        if (!ctx) return;
        
        if (systemCategoryChart) systemCategoryChart.destroy();

        if (!topCategories || topCategories.length === 0) {
            systemCategoryChart = new Chart(ctx, {
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
                            labels: {
                                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
                            }
                        }
                    }
                }
            });
            return;
        }

        const expenseCategories = topCategories.filter(c => c.type === 'expense');
        
        if (expenseCategories.length === 0) {
            systemCategoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Expense Data'],
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
                            labels: {
                                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
                            }
                        }
                    }
                }
            });
            return;
        }

        const labels = expenseCategories.map(c => c.category);
        const values = expenseCategories.map(c => c.total || 0);

        const colors = [
            '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
            '#ef4444', '#6366f1', '#14b8a6', '#f472b6', '#f97316'
        ];

        systemCategoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
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
                            font: { size: 10 },
                            padding: 15
                        }
                    }
                }
            }
        });
    }

    // ============================================
    // USER ACTIVITY CHART
    // ============================================
    function updateUserActivityChart(userActivity) {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx) return;
        
        if (userActivityChart) userActivityChart.destroy();

        if (!userActivity || userActivity.length === 0) {
            userActivityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['No Data Available'],
                    datasets: [{ 
                        label: 'Registrations', 
                        data: [0], 
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: {
                            labels: {
                                color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                        },
                        x: {
                            ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                        }
                    }
                }
            });
            return;
        }

        const labels = userActivity.map(d => d.date);
        const registrations = userActivity.map(d => d.registrations || 0);

        userActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Registrations',
                    data: registrations,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
                            font: { size: 11 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // ============================================
    // TOP USERS LIST
    // ============================================
    function updateTopUsersList(topUsers) {
        const container = document.getElementById('top-users-list');
        if (!container) return;
        container.innerHTML = '';

        if (!topUsers || topUsers.length === 0) {
            container.innerHTML = `
                <div class="text-center text-slate-400 dark:text-slate-500 text-sm py-4">
                    No users found
                </div>
            `;
            return;
        }

        const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f472b6', '#f97316'];

        topUsers.forEach((user, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-950/60 transition-all';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background-color: ${colors[index % colors.length]}">
                        ${index + 1}
                    </span>
                    <div>
                        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">${user.name || 'Unknown'}</p>
                        <p class="text-xs text-slate-400">${user.email || 'No email'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">${user.transactionCount || 0} txns</p>
                    <p class="text-xs ${(user.netSavings || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}">
                        ${(user.netSavings || 0) >= 0 ? '+' : ''}$${(user.netSavings || 0).toFixed(2)}
                    </p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================
    checkSuperAdminAuth();

    // Re-render charts on theme change
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            setTimeout(() => {
                loadSuperAdminDashboard();
            }, 300);
        });
    }
});