// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("transaction-form");
//     const tableBody = document.getElementById("transaction-rows");
//     const balanceEl = document.getElementById("total-balance");
//     const incomeEl = document.getElementById("total-income");
//     const expenseEl = document.getElementById("total-expenses");

//     // Set form date input default to today
//     document.getElementById("date").value = new Date().toISOString().split('T')[0];

//     // Fetch transactions from the backend server
//     async function loadTransactions() {
//         const response = await fetch('/api/transactions');
//         const transactions = await response.json();
//         updateUI(transactions);
//     }

//     // Refresh dashboard values and rebuild the history list
//     function updateUI(transactions) {
//         tableBody.innerHTML = "";
//         let totalIncome = 0;
//         let totalExpense = 0;

//         transactions.forEach(t => {
//             if (t.type === 'income') totalIncome += t.amount;
//             if (t.type === 'expense') totalExpense += t.amount;

//             const row = document.createElement("tr");
//             row.innerHTML = `
//                 <td>${t.date}</td>
//                 <td>${t.category}</td>
//                 <td><span class="tag ${t.type}">${t.type}</span></td>
//                 <td style="color: ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
//                     ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
//                 </td>
//                 <td><button class="delete-btn" data-id="${t.id}">Delete</button></td>
//             `;
//             tableBody.appendChild(row);
//         });

//         const currentBalance = totalIncome - totalExpense;

//         balanceEl.textContent = `${currentBalance < 0 ? '-' : ''}$${Math.abs(currentBalance).toFixed(2)}`;
//         incomeEl.textContent = `$${totalIncome.toFixed(2)}`;
//         expenseEl.textContent = `$${totalExpense.toFixed(2)}`;

//         // Attach action events to dynamic buttons
//         document.querySelectorAll(".delete-btn").forEach(btn => {
//             btn.addEventListener("click", deleteTransaction);
//         });
//     }

//     // Add transaction via API
//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         const type = document.getElementById("type").value;
//         const category = document.getElementById("category").value;
//         const amount = document.getElementById("amount").value;
//         const date = document.getElementById("date").value;

//         const response = await fetch('/api/transactions', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ type, category, amount, date })
//         });

//         if (response.ok) {
//             form.reset();
//             document.getElementById("date").value = new Date().toISOString().split('T')[0];
//             loadTransactions();
//         }
//     });

//     // Delete transaction via API
//     async function deleteTransaction(e) {
//         const id = e.target.getAttribute("data-id");
//         const response = await fetch(`/api/transactions/${id}`, {
//             method: 'DELETE'
//         });

//         if (response.ok) {
//             loadTransactions();
//         }
//     }

//     loadTransactions();
// });




document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("transaction-form");
    const tableBody = document.getElementById("transaction-rows");
    const balanceEl = document.getElementById("total-balance");
    const incomeEl = document.getElementById("total-income");
    const expenseEl = document.getElementById("total-expenses");
    
    // Edit flow elements
    const editIdInput = document.getElementById("edit-id");
    const submitBtn = document.getElementById("btn-submit");
    const cancelBtn = document.getElementById("btn-cancel");

    // Set form date input default to today
    document.getElementById("date").value = new Date().toISOString().split('T')[0];

    // Fetch transactions from the backend server
    async function loadTransactions() {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        updateUI(transactions);
    }

    // Refresh dashboard values and rebuild the history list
    function updateUI(transactions) {
        tableBody.innerHTML = "";
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.category}</td>
                <td><span class="tag ${t.type}">${t.type}</span></td>
                <td style="color: ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
                    ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                </td>
                <td>
                    <button class="edit-btn" data-id="${t.id}" data-type="${t.type}" data-category="${t.category}" data-amount="${t.amount}" data-date="${t.date}">Edit</button>
                    <button class="delete-btn" data-id="${t.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        const currentBalance = totalIncome - totalExpense;

        balanceEl.textContent = `${currentBalance < 0 ? '-' : ''}$${Math.abs(currentBalance).toFixed(2)}`;
        incomeEl.textContent = `$${totalIncome.toFixed(2)}`;
        expenseEl.textContent = `$${totalExpense.toFixed(2)}`;

        // Attach action events to dynamic buttons
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", deleteTransaction);
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", startEditTransaction);
        });
    }

    // Enter Edit Mode (Populate form & change colors to Yellow)
    function startEditTransaction(e) {
        const btn = e.target;
        editIdInput.value = btn.getAttribute("data-id");
        
        document.getElementById("type").value = btn.getAttribute("data-type");
        document.getElementById("category").value = btn.getAttribute("data-category");
        document.getElementById("amount").value = btn.getAttribute("data-amount");
        document.getElementById("date").value = btn.getAttribute("data-date");

        // Swap button styles to yellow edit state
        submitBtn.textContent = "Update Transaction";
        submitBtn.classList.add("editing");
        cancelBtn.style.display = "block";
    }

    // Exit Edit Mode and Reset Form
    function cancelEdit() {
        form.reset();
        editIdInput.value = "";
        document.getElementById("date").value = new Date().toISOString().split('T')[0];
        
        // Restore standard button styling
        submitBtn.textContent = "Save Transaction";
        submitBtn.classList.remove("editing");
        cancelBtn.style.display = "none";
    }

    cancelBtn.addEventListener("click", cancelEdit);

    // Save or Update transaction via API
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;
        const amount = document.getElementById("amount").value;
        const date = document.getElementById("date").value;
        const editId = editIdInput.value;

        let url = '/api/transactions';
        let method = 'POST';

        // Switch payload configurations if editing
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

    // Delete transaction via API
    async function deleteTransaction(e) {
        const id = e.target.getAttribute("data-id");
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTransactions();
        }
    }

    loadTransactions();
});