document.addEventListener("DOMContentLoaded", () => {
    // Render Icons immediately
    lucide.createIcons();

    const form = document.getElementById("transaction-form");
    const tableBody = document.getElementById("transaction-rows");
    const balanceEl = document.getElementById("total-balance");
    const incomeEl = document.getElementById("total-income");
    const expenseEl = document.getElementById("total-expenses");
    
    const editIdInput = document.getElementById("edit-id");
    const submitBtn = document.getElementById("btn-submit");
    const cancelBtn = document.getElementById("btn-cancel");

    // Standard Default Date set to Today
    document.getElementById("date").value = new Date().toISOString().split('T')[0];

    async function checkAuthSession() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                document.getElementById("user-display-name").textContent = data.user.name;
                
                if (data.user.role === 'admin') {
                    document.getElementById("admin-nav-btn").style.display = "flex";
                }
                loadTransactions(); 
            } else {
                window.location.href = "/login.html"; 
            }
        } catch (error) {
            window.location.href = "/login.html";
        }
    }

    document.getElementById("btn-logout").addEventListener("click", async () => {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = "/login.html";
            }
        } catch (error) {
            console.error("Sign out processing error:", error);
        }
    });

    async function loadTransactions() {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        updateUI(transactions);
    }

    function updateUI(transactions) {
        tableBody.innerHTML = "";
        let totalIncome = 0;
        let totalExpense = 0;

        if (transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No transactions registered yet. Record your first log on the left.
                    </td>
                </tr>
            `;
        } else {
            transactions.forEach(t => {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpense += t.amount;

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
                    <td class="py-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                        ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                    </td>
                    <td class="py-4 text-sm text-right space-x-2">
                        <button class="edit-btn text-indigo-500 hover:text-indigo-400 font-semibold transition-all" data-id="${t.id}" data-type="${t.type}" data-category="${t.category}" data-amount="${t.amount}" data-date="${t.date}">
                            Edit
                        </button>
                        <button class="delete-btn text-red-500 hover:text-red-400 font-semibold transition-all" data-id="${t.id}">
                            Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        const currentBalance = totalIncome - totalExpense;

        balanceEl.textContent = `${currentBalance < 0 ? '-' : ''}$${Math.abs(currentBalance).toFixed(2)}`;
        incomeEl.textContent = `+$${totalIncome.toFixed(2)}`;
        expenseEl.textContent = `-$${totalExpense.toFixed(2)}`;

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", deleteTransaction);
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", startEditTransaction);
        });
    }

    function startEditTransaction(e) {
        const btn = e.target;
        editIdInput.value = btn.getAttribute("data-id");
        
        document.getElementById("type").value = btn.getAttribute("data-type");
        document.getElementById("category").value = btn.getAttribute("data-category");
        document.getElementById("amount").value = btn.getAttribute("data-amount");
        document.getElementById("date").value = btn.getAttribute("data-date");

        document.getElementById("form-title").textContent = "Edit Transaction";
        submitBtn.textContent = "Update Transaction";
        submitBtn.className = "w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-[0.98]";
        cancelBtn.classList.remove("hidden");
    }

    function cancelEdit() {
        form.reset();
        editIdInput.value = "";
        document.getElementById("date").value = new Date().toISOString().split('T')[0];
        
        document.getElementById("form-title").textContent = "New Transaction";
        submitBtn.textContent = "Save Transaction";
        submitBtn.className = "w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]";
        cancelBtn.classList.add("hidden");
    }

    cancelBtn.addEventListener("click", cancelEdit);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;
        const amount = document.getElementById("amount").value;
        const date = document.getElementById("date").value;
        const editId = editIdInput.value;

        let url = '/api/transactions';
        let method = 'POST';

        if (editId) {
            url = `/api/transactions/${editId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, category, amount, date })
        });

        if (response.ok) {
            cancelEdit();
            loadTransactions();
        }
    });

    async function deleteTransaction(e) {
        const id = e.target.getAttribute("data-id");
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTransactions();
        }
    }

    checkAuthSession();
});