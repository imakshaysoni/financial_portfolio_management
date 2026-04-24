async function initPositions() {
    try {
        const data = await api("/positions");
        renderPositions(data);
    } catch (e) {
        showError("Failed to load positions");
    }
}

function renderPositions(data) {
    const tbody = document.getElementById("positions_table_body");
    if (!tbody) return;

    tbody.innerHTML = "";

    data.forEach(p => {
        tbody.innerHTML += `
        <tr class="hover:bg-surface-container-high">
            <td class="py-4 px-6">${p.symbol}</td>
            <td class="py-4 px-6 text-right">${p.quantity}</td>
            <td class="py-4 px-6 text-right">${p.avg_price}</td>
            <td class="py-4 px-6 text-right">${p.last_price}</td>
            <td class="py-4 px-6 text-right">
                ${formatCurrency(p.unrealized_pnl)}
            </td>
        </tr>`;
    });
}

//
let ALL_POSITIONS = [];
let FILTERED_POSITIONS = [];

let CURRENT_PAGE = 1;
const PAGE_SIZE = 5;

let CURRENT_FILTER = "all"; // all | profit | loss
let SEARCH_QUERY = "";

let REFRESH_INTERVAL = null;
let IS_FETCHING = false;

async function loadPositions() {
    try {
        const data = await api("/positions");

        ALL_POSITIONS = data.map(p => {
            const marketValue = p.quantity * p.last_price;
            const pnl = (p.last_price - p.avg_price) * p.quantity;
            const pnlPct = ((p.last_price - p.avg_price) / p.avg_price) * 100;

            return {
                ...p,
                marketValue,
                pnl,
                pnlPct
            };
        });

        applyFilters();

    } catch (err) {
        alert(err.message);
    }
}

function applyFilters() {
    FILTERED_POSITIONS = ALL_POSITIONS.filter(p => {

        const matchSearch = p.symbol.toLowerCase().includes(SEARCH_QUERY);

        let matchFilter = true;
        if (CURRENT_FILTER === "profit") matchFilter = p.pnl >= 0;
        if (CURRENT_FILTER === "loss") matchFilter = p.pnl < 0;

        return matchSearch && matchFilter;
    });

    CURRENT_PAGE = 1;
    renderPositions();
}

function renderPositions() {
    const tbody = document.getElementById("positions_table_body");
    tbody.innerHTML = "";

    const start = (CURRENT_PAGE - 1) * PAGE_SIZE;
    const pageData = FILTERED_POSITIONS.slice(start, start + PAGE_SIZE);

    const totalPortfolio = FILTERED_POSITIONS.reduce(
        (sum, p) => sum + p.marketValue, 0
    );

    pageData.forEach(p => {
        const allocation = totalPortfolio ? (p.marketValue / totalPortfolio) * 100 : 0;
        const isProfit = p.pnl >= 0;

        tbody.insertAdjacentHTML("beforeend", `
        <tr class="hover:bg-surface-container-high transition-colors group cursor-pointer">

            <td class="px-6 py-4 sticky left-0 bg-surface-container-low group-hover:bg-surface-container-high z-10">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-xs font-bold">
                        ${p.symbol[0]}
                    </div>
                    <div>
                        <div class="font-medium">${p.symbol}</div>
                        <div class="text-xs text-on-surface-variant">Equity</div>
                    </div>
                </div>
            </td>

            <td class="px-6 py-4 text-right">${p.quantity}</td>
            <td class="px-6 py-4 text-right">₹${p.avg_price}</td>
            <td class="px-6 py-4 text-right">₹${p.last_price}</td>
            <td class="px-6 py-4 text-right">₹${p.marketValue.toFixed(2)}</td>

            <td class="px-6 py-4 text-right">
                <span class="${isProfit ? 'text-secondary' : 'text-tertiary'}">
                    ${isProfit ? '+' : ''}₹${p.pnl.toFixed(2)}
                </span>
            </td>

            <td class="px-6 py-4 text-right">
                ${allocation.toFixed(1)}%
            </td>
        </tr>
        `);
    });

    updatePagination();
}

function nextPage() {
    const totalPages = Math.ceil(FILTERED_POSITIONS.length / PAGE_SIZE);
    if (CURRENT_PAGE < totalPages) {
        CURRENT_PAGE++;
        renderPositions();
    }
}

function prevPage() {
    if (CURRENT_PAGE > 1) {
        CURRENT_PAGE--;
        renderPositions();
    }
}

function handleSearch(value) {
    SEARCH_QUERY = value.toLowerCase();
    applyFilters();
}

function setFilter(type) {
    CURRENT_FILTER = type;

    // 🔥 update UI active state
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("bg-surface-bright", "text-on-surface");
        btn.classList.add("text-on-surface-variant");
    });

    event.target.classList.add("bg-surface-bright", "text-on-surface");

    applyFilters();
}

function exportCSV() {
    const rows = FILTERED_POSITIONS.map(p => ({
        Symbol: p.symbol,
        Quantity: p.quantity,
        AvgPrice: p.avg_price,
        LastPrice: p.last_price,
        PnL: p.pnl
    }));

    const csv = [
        Object.keys(rows[0]).join(","),
        ...rows.map(r => Object.values(r).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "positions.csv";
    a.click();
}

function goToPage(page) {
    CURRENT_PAGE = page;
    renderPositions();
}

function renderPaginationNumbers() {
    const container = document.getElementById("paginationNumbers");
    if (!container) return;

    container.innerHTML = "";

    const totalPages = Math.ceil(FILTERED_POSITIONS.length / PAGE_SIZE);
    if (totalPages <= 1) return;

    const createBtn = (page) => `
        <button onclick="goToPage(${page})"
            class="w-8 h-8 flex items-center justify-center rounded-md font-label text-sm
            ${page === CURRENT_PAGE
                ? 'bg-surface-container-highest text-on-surface font-medium'
                : 'text-on-surface-variant hover:bg-surface-bright hover:text-on-surface'}
            transition-colors">
            ${page}
        </button>
    `;

    const addEllipsis = () => {
        container.insertAdjacentHTML(
            "beforeend",
            `<span class="text-on-surface-variant text-sm px-1">...</span>`
        );
    };

    // ✅ Always show first page
    container.insertAdjacentHTML("beforeend", createBtn(1));

    // 👉 Left dots
    if (CURRENT_PAGE > 3) {
        addEllipsis();
    }

    // 👉 Middle pages (current -1, current, current +1)
    const start = Math.max(2, CURRENT_PAGE - 1);
    const end = Math.min(totalPages - 1, CURRENT_PAGE + 1);

    for (let i = start; i <= end; i++) {
        container.insertAdjacentHTML("beforeend", createBtn(i));
    }

    // 👉 Right dots
    if (CURRENT_PAGE < totalPages - 2) {
        addEllipsis();
    }

    // ✅ Always show last page
    if (totalPages > 1) {
        container.insertAdjacentHTML("beforeend", createBtn(totalPages));
    }
}

function updatePagination() {
    const totalPages = Math.ceil(FILTERED_POSITIONS.length / PAGE_SIZE);

    const prev = document.getElementById("prevBtn");
    const next = document.getElementById("nextBtn");

    if (prev) prev.disabled = CURRENT_PAGE === 1;
    if (next) next.disabled = CURRENT_PAGE === totalPages;
}

async function refreshPositions() {
    if (IS_FETCHING) return; // 🚫 prevent overlap

    try {
        IS_FETCHING = true;

        const data = await api("/positions");

        // update ONLY data, not UI state
        ALL_POSITIONS = data.map(p => {
            const marketValue = p.quantity * p.last_price;
            const pnl = (p.last_price - p.avg_price) * p.quantity;
            const pnlPct = ((p.last_price - p.avg_price) / p.avg_price) * 100;

            return { ...p, marketValue, pnl, pnlPct };
        });

        // 🔥 reapply existing filters/search/page
        applyFilters();

    } catch (err) {
        console.error("Refresh failed:", err.message);
    } finally {
        IS_FETCHING = false;
    }
}

function startAutoRefresh() {
    if (REFRESH_INTERVAL) return;

    REFRESH_INTERVAL = setInterval(refreshPositions, 5000);
}

function stopAutoRefresh() {
    if (REFRESH_INTERVAL) {
        clearInterval(REFRESH_INTERVAL);
        REFRESH_INTERVAL = null;
    }
}