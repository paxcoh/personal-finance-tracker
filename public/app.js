document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const form = document.getElementById("transaction-form");
    const tableBody = document.getElementById("transaction-rows");
    const balanceEl = document.getElementById("total-balance");
    const incomeEl = document.getElementById("total-income");
    const expenseEl = document.getElementById("total-expenses");
    
    const editIdInput = document.getElementById("edit-id");
    const submitBtn = document.getElementById("btn-submit");
    const cancelBtn = document.getElementById("btn-cancel");

    document.getElementById("date").value = new Date().toISOString().split('T')[0];

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

    // ============================================
    // CHECK AUTH SESSION - FIXED
    // ============================================
    async function checkAuthSession() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                // User is logged in - show dashboard
                document.getElementById("user-display-name").textContent = data.user.name;
                document.getElementById("user-avatar").textContent = data.user.avatar || '👤';
                
                if (data.user.role === 'admin') {
                    document.getElementById("admin-nav-btn").style.display = "flex";
                }
                loadTransactions();
            } else {
                // Not logged in - redirect to login
                window.location.replace("/login.html");
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.replace("/login.html");
        }
    }

    // ============================================
    // LOGOUT
    // ============================================
    document.getElementById("btn-logout").addEventListener("click", async () => {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                showPopupToast("Logged out successfully!", "info", "👋 See You Soon");
                setTimeout(() => {
                    window.location.replace("/login.html");
                }, 800);
            }
        } catch (error) {
            console.error("Sign out processing error:", error);
        }
    });

    // ============================================
    // LOAD TRANSACTIONS
    // ============================================
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
                        <button class="edit-btn text-indigo-500 hover:text-indigo-400 font-semibold transition-all mr-3" data-id="${t.id}" data-type="${t.type}" data-category="${t.category}" data-amount="${t.amount}" data-date="${t.date}">
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
            showPopupToast(editId ? "Transaction updated successfully!" : "Transaction created successfully!", "success", editId ? "✏️ Updated!" : "🎉 Created!");
        } else {
            showPopupToast("Failed to process transaction.", "error", "❌ Oops!");
        }
    });

    async function deleteTransaction(e) {
        const id = e.target.getAttribute("data-id");
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTransactions();
            showPopupToast("Transaction deleted successfully.", "info", "🗑️ Deleted");
        } else {
            showPopupToast("Failed to delete transaction.", "error", "❌ Oops!");
        }
    }

    checkAuthSession();
});