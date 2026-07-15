document.addEventListener("DOMContentLoaded", () => {
    let platformChart = null;

    // Secure Layout Access Guard
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user.role === 'admin') {
                loadAdminDashboard();
            } else {
                // Boot standard users back to standard dashboard
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
        }
    }

    // Inspect user records
    async function inspectUserTransactions(e) {
        const userId = e.target.getAttribute("data-id");
        const userName = e.target.getAttribute("data-name");

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
    }

    // Create New User Form Handler
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
            feedback.style.color = "var(--success)";
            feedback.textContent = "New user account created successfully!";
            document.getElementById("admin-user-form").reset();
            loadAdminDashboard();
        } else {
            feedback.style.color = "var(--danger)";
            feedback.textContent = data.error || "Failed to provision account.";
        }
    });

    // Delete User and user transactions completely (Cascade deletion)
    async function purgeUserAccount(e) {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this user and all associated financial records permanently?")) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadAdminDashboard();
            document.getElementById("user-inspect-section").style.display = "none";
        }
    }

    // Log Out Admin Session
    document.getElementById("btn-admin-logout").addEventListener("click", async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = "/login.html";
    });

    checkAdminAuth();
});