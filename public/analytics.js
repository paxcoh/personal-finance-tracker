document.addEventListener("DOMContentLoaded", () => {
    let trendChartInstance = null;
    let categoryChartInstance = null;
    let incomeCategoryChartInstance = null;

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

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ============================================
    // LOAD ANALYTICS (Personal)
    // ============================================
    async function loadAnalytics(period = 'month') {
        try {
            const res = await fetch(`/api/analytics/overview?period=${period}`);
            const data = await res.json();
            
            if (!data.overview) {
                showPopupToast('No data available for this period', 'info');
                return;
            }

            const income = data.overview.totalIncome || 0;
            const expenses = data.overview.totalExpense || 0;
            document.getElementById('analytics-income').textContent = `$${income.toFixed(2)}`;
            document.getElementById('analytics-expenses').textContent = `$${expenses.toFixed(2)}`;
            document.getElementById('analytics-savings').textContent = `$${(income - expenses).toFixed(2)}`;
            document.getElementById('analytics-count').textContent = data.overview.totalTransactions || 0;

            updateTrendChart(data.monthlyData);
            updateCategoryChart(data.categoryData, 'expense');
            updateCategoryChart(data.categoryData, 'income', 'incomeCategoryChart');
            updateMonthlySummary(data.monthlyData);

        } catch (err) {
            console.error('Failed to load analytics:', err);
            showPopupToast('Failed to load analytics data', 'error');
        }
    }

    function updateTrendChart(monthlyData) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        if (trendChartInstance) {
            trendChartInstance.destroy();
        }

        const labels = monthlyData.map(d => d.month);
        const incomeData = monthlyData.map(d => d.income || 0);
        const expenseData = monthlyData.map(d => d.expense || 0);

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
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
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
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

    function updateCategoryChart(categoryData, type, chartId = 'categoryChart') {
        const ctx = document.getElementById(chartId).getContext('2d');
        const existingChart = chartId === 'categoryChart' ? categoryChartInstance : incomeCategoryChartInstance;
        if (existingChart) {
            existingChart.destroy();
        }

        const filteredData = categoryData.filter(d => d.type === type);
        const labels = filteredData.map(d => d.category);
        const values = filteredData.map(d => d.total || 0);

        const colors = [
            '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
            '#ef4444', '#6366f1', '#14b8a6', '#f472b6', '#f97316'
        ];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
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
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        if (chartId === 'categoryChart') {
            categoryChartInstance = chart;
        } else {
            incomeCategoryChartInstance = chart;
        }
    }

    function updateMonthlySummary(monthlyData) {
        const container = document.getElementById('monthly-summary');
        container.innerHTML = '';
        
        if (!monthlyData || monthlyData.length === 0) {
            container.innerHTML = `<p class="text-sm text-slate-400">No data available</p>`;
            return;
        }

        const recentMonths = monthlyData.slice(-6).reverse();
        recentMonths.forEach(month => {
            const div = document.createElement('div');
            const income = month.income || 0;
            const expense = month.expense || 0;
            const savings = income - expense;
            const savingsRate = income > 0 ? ((savings / income) * 100) : 0;

            div.className = 'flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl';
            div.innerHTML = `
                <div>
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${month.month}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">${savingsRate >= 0 ? '📈' : '📉'} ${Math.abs(savingsRate).toFixed(1)}% saved</span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-emerald-500 dark:text-emerald-400">+$${income.toFixed(2)}</span>
                    <span class="text-xs text-red-500 dark:text-red-400 ml-2">-$${expense.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    document.getElementById('period-select').addEventListener('change', (e) => {
        loadAnalytics(e.target.value);
    });

    loadAnalytics('month');

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTimeout(() => loadAnalytics(document.getElementById('period-select').value), 100);
        });
    }
});