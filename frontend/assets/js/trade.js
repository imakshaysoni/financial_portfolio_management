async function placeTrade(type) {
    const symbol = document.getElementById("symbol")?.value;
    const quantity = Number(document.getElementById("qty")?.value);
    const price = Number(document.getElementById("price")?.value);

    if (!symbol || !quantity || !price) {
        showError("Please fill all fields");
        return;
    }

    try {
        await api("/transactions", "POST", {
            symbol,
            quantity,
            price,
            type
        });

        alert("Trade executed");

        // refresh related views
        if (typeof initPositions === "function") initPositions();
        if (typeof initTransactions === "function") initTransactions();
        if (typeof initSummary === "function") initSummary();

    } catch (e) {
        showError("Trade failed");
    }
}

function goToTrade() {
    window.location.href = "/pages/execute_trade.html";
}

// 👇 expose globally
window.goToTrade = goToTrade;
