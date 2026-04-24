const toast = {
  show(message, type = "info", duration = 3000) {
    const container = document.getElementById("toast-container");

    const styles = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500"
    };

  const icons = {
      success: "check_circle",
      error: "error",
      info: "info"
    };

    const toastEl = document.createElement("div");

    toastEl.className = `
      ${styles[type] || styles.info}
      text-white px-4 py-3 rounded-lg shadow-lg
      flex items-center gap-3 min-w-[260px]
      animate-slide-in transition-all duration-300
    `;

    toastEl.innerHTML = `
      <span class="material-symbols-outlined text-lg">
        ${icons[type] || icons.info}
      </span>

      <span class="text-sm font-medium">${message}</span>

      <button class="ml-auto text-white/80 hover:text-white">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    `;

    // Close manually
    toastEl.querySelector("button").onclick = () => {
      removeToast(toastEl);
    };

    container.appendChild(toastEl);

    // Auto remove
    setTimeout(() => {
      removeToast(toastEl);
    }, duration);
  },

  success(msg) {
    this.show(msg, "success");
  },

  error(msg) {
    this.show(msg, "error");
  },

  info(msg) {
    this.show(msg, "info");
  }
};

// smooth removal
function removeToast(el) {
  el.classList.add("opacity-0", "translate-x-5");
  setTimeout(() => el.remove(), 300);
}