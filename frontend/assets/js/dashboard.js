async function initDashboard() {
    if (!localStorage.getItem("access_token")) {
        window.location.href = "/pages/auth.html";
        return;
    }

    await loadSummary();
    await loadDashboardPositions();
}

function goToPositions() {
    window.location.href = "/pages/positions.html";
}

async function loadSummary() {
    try {
        const data = await api("/portfolio/summary/");

        if (!data || data.length === 0) return;

        let totalInvested = 0;
        let currentValue = 0;
        let totalPnl = 0;

        data.forEach(item => {
            totalInvested += item.invested_value;
            currentValue += item.current_value;
            totalPnl += item.unrealized_pnl;
        });

        const pnlPct = (totalPnl / totalInvested) * 100;

        document.getElementById("current_value_display").innerText =
            formatCurrency(currentValue);

        document.getElementById("total_invested_display").innerText =
            formatCurrency(totalInvested);

        document.getElementById("unrealized_pnl_display").innerText =
            formatCurrency(totalPnl);

        document.getElementById("unrealized_pnl_pct_display").innerText =
            `(${pnlPct.toFixed(2)}%)`;

    } catch (err) {
        console.error("Summary load failed:", err.message);
    }
}

async function loadDashboardPositions() {
    try {
        const data = await api("/positions");

        const tbody = document.getElementById("positions_table_body");
        tbody.innerHTML = "";

        const top5 = data.slice(0, 5);

        top5.forEach(p => {
            const pnl = (p.last_price - p.avg_price) * p.quantity;
            const pnlPct = ((p.last_price - p.avg_price) / p.avg_price) * 100;

            const pnlColor = pnl >= 0 ? "text-secondary" : "text-tertiary";

            const row = `
                <tr class="hover:bg-surface-container-high transition-colors duration-150 group cursor-pointer">
                    <td class="py-5 px-6">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-headline font-bold text-primary">
                                ${p.symbol[0]}
                            </div>
                            <div>
                                <div class="font-headline font-semibold text-base group-hover:text-primary transition-colors">
                                    ${p.symbol}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="py-5 px-6 text-right font-medium">${p.quantity}</td>
                    <td class="py-5 px-6 text-right text-on-surface-variant">
                        ${formatCurrency(p.avg_price)}
                    </td>
                    <td class="py-5 px-6 text-right font-medium">
                        ${formatCurrency(p.last_price)}
                    </td>
                    <td class="py-5 px-6 text-right">
                        <div class="${pnlColor} font-semibold">
                            ${formatCurrency(pnl)}
                        </div>
                        <div class="text-xs ${pnlColor}/80 mt-0.5">
                            ${pnlPct.toFixed(2)}%
                        </div>
                    </td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (err) {
        console.error("Positions load failed:", err.message);
    }
}

function formatCurrency(value) {
    return "$" + Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}