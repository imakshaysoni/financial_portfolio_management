async function initSummary() {
    try {
        const data = await api("/portfolio/summary/");
        renderSummary(data);
    } catch (e) {
        showError("Failed to load summary");
    }
}

function renderSummary(data) {
    if (!data || !data.length) return;

    const d = data[0];

    const current = document.getElementById("current_value_display");
    const invested = document.getElementById("total_invested_display");
    const pnl = document.getElementById("unrealized_pnl_display");

    if (current) current.textContent = formatCurrency(d.current_value);
    if (invested) invested.textContent = formatCurrency(d.invested_value);
    if (pnl) {
        pnl.textContent = formatCurrency(d.unrealized_pnl);
        pnl.style.color = d.unrealized_pnl >= 0 ? "#4edea3" : "#ff4d4d";
    }
}