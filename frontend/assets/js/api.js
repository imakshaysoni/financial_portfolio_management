// assets/js/api.js
async function api(path, method="GET", body=null) {
    const token = localStorage.getItem("access_token");

    const res = await fetch(CONFIG.BASE_URL + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: "Bearer " + token })
        },
        body: body ? JSON.stringify(body) : null
    });

    const data = await res.json();

    // 🔥 central error handling
    if (!res.ok) {
        throw new Error(data.detail || "API Error");
    }

    return data;
}