async function loadComponent(id, file) {
  const res = await fetch(file);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
}

async function initLayout() {
  await loadComponent("sidebar", "/components/sidebar.html");
  await loadComponent("header", "/components/header.html");

  setActiveNav();
}

function setActiveNav() {
  const path = window.location.pathname;

  document.querySelectorAll(".nav-item").forEach(link => {
    if (link.getAttribute("href") === path) {
      link.classList.add("bg-slate-800", "text-white");
    }
  });
}