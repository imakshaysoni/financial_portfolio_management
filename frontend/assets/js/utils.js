function formatCurrency(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function formatPercent(value) {
    return (value || 0).toFixed(2) + "%";
}

function showError(msg) {
    console.error(msg);
    toast.error(msg);
}