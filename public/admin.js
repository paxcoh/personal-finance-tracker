document.addEventListener("DOMContentLoaded", () => {
    // Initial Render of Icons
    lucide.createIcons();
    let platformChart = null;

    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user.role === 'admin') {
                loadAdminDashboard();
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

    async function loadUsersList() {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        const tbody = document.getElementById("admin-user-rows");
        tbody.innerHTML = "";

        users.forEach(u => {
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all";
            row.innerHTML = `
                <td class="py-4 text-sm font-medium text-slate-500 dark:text-slate-400">${u.id}</td>
                <td class="py-4 text-sm font-semibold text-slate-800 dark:text-slate-100">${u.name}</td>
                <td class="py-4 text-sm text-slate-600 dark:text-slate-300">${u.email}</td>
                <td class="py-4 text-sm">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        u.role === 'admin' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    }">
                        ${u.role}
                    </span>
                </td>
                <td class="py-4 text-sm text-right space-x-2">
                    <button class="inspect-btn text-indigo-500 hover:text-indigo-400 font-semibold transition-all mr-3" data-id="${u.id}" data-name="${u.name}">
                        Inspect Ledger
                    </button>
                    ${u.role !== 'admin' ? `
                        <button class="delete-user-btn text-red-500 hover:text-red-400 font-semibold transition-all" data-id="${u.id}">
                            Wipe Account
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll(".inspect-btn").forEach(btn => {
            btn.addEventListener("click", inspectUserTransactions);
        });
        document.querySelectorAll(".delete-user-btn").forEach(btn => {
            btn.addEventListener("click", purgeUserAccount);
        });
    }

    async function loadAnalyticsChart() {
        try {
            const res = await fetch('/api/admin/analytics');
            const analytics = await res.json();

            const ctx = document.getElementById('platformChart').getContext('2d');
            
            if (platformChart) {
                platformChart.destroy();
            }

            // Adapt text/grid colors matching current dark/light state
            const isDark = document.documentElement.classList.contains('dark');
            const labelColor = isDark ? '#94a3b8' : '#64748b';
            const gridColor = isDark ? '#1e293b' : '#e2e8f0';

            platformChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Global Inflow ($)', 'Global Outflow ($)'],
                    datasets: [{
                        data: [analytics.totalIncome, analytics.totalExpense],
                        backgroundColor: ['#10b981', '#f43f5e'],
                        borderWidth: isDark ? 3 : 2,
                        borderColor: isDark ? '#0f172a' : '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: labelColor,
                                font: { family: 'Inter', size: 12, weight: '500' }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Failed to load analytics chart:", err);
        }
    }

    async function inspectUserTransactions(e) {
        const userId = e.target.getAttribute("data-id");
        const userName = e.target.getAttribute("data-name");

        const res = await fetch(`/api/admin/users/${userId}/transactions`);
        const transactions = await res.json();

        document.getElementById("inspect-title").innerHTML = `
            <i data-lucide="shield-alert" class="text-indigo-500 w-5 h-5"></i> Auditing Ledger: ${userName}
        `;
        const tbody = document.getElementById("inspect-transaction-rows");
        tbody.innerHTML = "";

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        This user hasn't registered any transactions yet.
                    </td>
                </tr>
            `;
        } else {
            transactions.forEach(t => {
                const row = document.createElement("tr");
                row.className = "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all";
                row.innerHTML = `
                    <td class="py-4 text-sm font-medium text-slate-600 dark:text-slate-300">${t.date}</td>
                    <td class="py-4 text-sm font-semibold text-slate-800 dark:text-slate-100">${t.category}</td>
                    <td class="py-4 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            t.type === 'income' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        }">
                            ${t.type}
                        </span>
                    </td>
                    <td class="py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                        ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        
        lucide.createIcons();
        const auditPanel = document.getElementById("user-inspect-section");
        auditPanel.classList.remove("hidden");
        auditPanel.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById("admin-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("admin-reg-name").value;
        const email = document.getElementById("admin-reg-email").value;
        const password = document.getElementById("admin-reg-password").value;
        const role = document.getElementById("admin-reg-role").value;
        const feedback = document.getElementById("form-feedback");

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();
        if (res.ok) {
            feedback.className = "mt-4 text-sm font-medium text-emerald-500";
            feedback.textContent = "New user account created successfully!";
            document.getElementById("admin-user-form").reset();
            loadAdminDashboard();
        } else {
            feedback.className = "mt-4 text-sm font-medium text-red-500";
            feedback.textContent = data.error || "Failed to provision account.";
        }
    });

    async function purgeUserAccount(e) {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this user and all associated financial records permanently?")) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadAdminDashboard();
            document.getElementById("user-inspect-section").classList.add("hidden");
        }
    }

    document.getElementById("btn-admin-logout").addEventListener("click", async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = "/login.html";
    });

    // Re-render chart on theme switches dynamically
    document.getElementById('theme-toggle').addEventListener('click', () => {
        setTimeout(loadAnalyticsChart, 100);
    });

    checkAdminAuth();
});