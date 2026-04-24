async function initTransactions() {
    try {
        const data = await api("/transactions");
        renderTransactions(data);
    } catch (e) {
        showError("Failed to load transactions");
    }
}

// assets/js/transactions.js

window.submitTransaction = async function () {

    const symbol = document.getElementById("symbol").value;
    const quantity = Number(document.getElementById("quantity").value);
    const price = Number(document.getElementById("price").value);

    const type = document.querySelector('input[name="tx_type"]:checked')?.value;

    if (!symbol || !quantity || !price) {
        toast.info("Please fill all fields");
        return;
    }

    try {
        const res = await api("/transactions", "POST", {
            symbol,
            quantity,
            price,
            type
        });

        if (res) {
            toast.success("Transaction created successfully");
        }

    } catch (err) {
        console.error(err);
        toast.error(err);

    }
    document.getElementById("symbol").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("price").value = "";

setTimeout(() => {
  window.location.reload();
}, 1500); // 1.5 seconds delay
};

let ALL_TRANSACTIONS = [];
let CURRENT_PAGE = 1;
const PAGE_SIZE = 5;
let CURRENT_FILTER = "all"; // all | buy | sell\
let CURRENT_SEARCH = "";
let CURRENT_SORT = "date_desc";

let SORT_FIELD = "date";
let SORT_DIRECTION = "desc"; // desc | a

async function loadTransactions() {
    try {
        ALL_TRANSACTIONS = await api("/transactions", "GET");

        // newest first
        ALL_TRANSACTIONS.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        CURRENT_PAGE = 1;
        renderTransactions();

    } catch (err) {
        console.error(err);
        toast.error("Failed to load transactions");
    }
}

function renderTransactions() {
    const tbody = document.getElementById("transactions_table_body");
    tbody.innerHTML = "";

    let data = [...ALL_TRANSACTIONS];

    // 🔍 SEARCH
    if (CURRENT_SEARCH) {
        data = data.filter(tx =>
            tx.symbol.toUpperCase().includes(CURRENT_SEARCH)
        );
    }

    // 🎯 FILTER
    if (CURRENT_FILTER !== "all") {
        data = data.filter(tx => tx.type === CURRENT_FILTER);
    }

    // 🔃 SORT
    if (SORT_FIELD === "date") {
    data.sort((a, b) =>
        SORT_DIRECTION === "desc"
            ? new Date(b.created_at) - new Date(a.created_at)
            : new Date(a.created_at) - new Date(b.created_at)
    );
}

if (SORT_FIELD === "price") {
    data.sort((a, b) =>
        SORT_DIRECTION === "desc"
            ? b.price - a.price
            : a.price - b.price
    );
}

if (SORT_FIELD === "qty") {
    data.sort((a, b) =>
        SORT_DIRECTION === "desc"
            ? b.quantity - a.quantity
            : a.quantity - b.quantity
    );
}

    // 📄 PAGINATION
    const start = (CURRENT_PAGE - 1) * PAGE_SIZE;
    const pageData = data.slice(start, start + PAGE_SIZE);

    pageData.forEach(tx => {
        const isBuy = tx.type === "buy";

        tbody.innerHTML += `
        <tr class="group hover:bg-surface-container-high transition-colors">
            <td class="py-4 px-4 text-xs">TX-${tx.id}</td>
            <td class="py-4 px-4">${tx.symbol}</td>
            <td class="py-4 px-4 ${isBuy ? "text-secondary" : "text-tertiary"}">
                ${tx.type.toUpperCase()}
            </td>
            <td class="py-4 px-4 text-right">${tx.quantity}</td>
            <td class="py-4 px-4 text-right">₹${tx.price}</td>
            <td class="py-4 px-4 text-right text-xs">
                ${formatDate(tx.created_at)}
            </td>
        </tr>
        `;
    });

    updatePagination(data.length);
}

function nextPage() {
    const total = getFilteredData().length;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    if (CURRENT_PAGE < totalPages) {
        CURRENT_PAGE++;
        renderTransactions();
    }
}

function prevPage() {
    if (CURRENT_PAGE > 1) {
        CURRENT_PAGE--;
        renderTransactions();
    }
}

function getFilteredCount() {
    if (CURRENT_FILTER === "all") return ALL_TRANSACTIONS.length;
    return ALL_TRANSACTIONS.filter(tx => tx.type === CURRENT_FILTER).length;
}

function getFilteredData() {
    let data = [...ALL_TRANSACTIONS];

    if (CURRENT_SEARCH) {
        data = data.filter(tx =>
            tx.symbol.toUpperCase().includes(CURRENT_SEARCH)
        );
    }

    if (CURRENT_FILTER !== "all") {
        data = data.filter(tx => tx.type === CURRENT_FILTER);
    }

    return data;
}

function updatePagination(total) {
    const label = document.querySelector(".mt-6 span");

    const start = (CURRENT_PAGE - 1) * PAGE_SIZE + 1;
    const end = Math.min(CURRENT_PAGE * PAGE_SIZE, total);

    label.textContent = `Showing ${start}-${end} of ${total} entries`;
}
function toggleDropdown(id) {
    document.querySelectorAll("#filterMenu, #sortMenu").forEach(el => {
        if (el.id !== id) el.classList.add("hidden");
    });

    document.getElementById(id).classList.toggle("hidden");
}

// close on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest(".relative")) {
        document.querySelectorAll("#filterMenu, #sortMenu")
            .forEach(el => el.classList.add("hidden"));
    }
});

function setFilter(value) {
    CURRENT_FILTER = value;
    CURRENT_PAGE = 1;

    document.getElementById("filterLabel").innerText =
        value.charAt(0).toUpperCase() + value.slice(1);

    document.getElementById("filterMenu").classList.add("hidden");

    renderTransactions();
}

function setSortField(field) {
    if (SORT_FIELD === field) {
        // 🔁 toggle direction
        SORT_DIRECTION = SORT_DIRECTION === "desc" ? "asc" : "desc";
    } else {
        SORT_FIELD = field;
        SORT_DIRECTION = "desc"; // default
    }

    CURRENT_PAGE = 1;

    updateSortLabel();
    document.getElementById("sortMenu").classList.add("hidden");

    renderTransactions();
}
function updateSortLabel() {
    const arrow = SORT_DIRECTION === "desc" ? "↓" : "↑";

    const labelMap = {
        date: "Date",
        price: "Price",
        qty: "Qty"
    };

    document.getElementById("sortLabel").innerText =
        labelMap[SORT_FIELD] + " " + arrow;
}


function handleSearch() {
    CURRENT_SEARCH = document.getElementById("searchInput").value.toUpperCase();
    CURRENT_PAGE = 1;
    renderTransactions();
}

function handleFilter() {
    CURRENT_FILTER = document.getElementById("filterSelect").value;
    CURRENT_PAGE = 1;
    renderTransactions();
}

function handleSort() {
    CURRENT_SORT = document.getElementById("sortSelect").value;
    CURRENT_PAGE = 1;
    renderTransactions();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}
//
async function loadStocks() {
    try {
        const stocks = await api("/stocks");

        const select = document.getElementById("symbol");
        select.innerHTML = `<option value="">Select Symbol</option>`;

        stocks.forEach(s => {
            select.innerHTML += `
                <option value="${s.symbol}">
                    ${s.symbol}
                </option>
            `;
        });

    } catch (err) {
        console.error("Failed to load stocks:", err.message);
    }
}

let currentSymbol = "";

async function handleSymbolChange() {
    const symbol = document.getElementById("symbol").value;
    currentSymbol = symbol;

    const res = await api(`/price?symbol=${symbol}`);

    if (currentSymbol === symbol) {
        document.getElementById("price").value = res.price;
    }
}