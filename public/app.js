// ---------- elementos del DOM ----------
const gallery = document.getElementById("gallery");
const emptyMsg = document.getElementById("empty-msg");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");

const purchaseModal = document.getElementById("purchase-modal");
const purchaseForm = document.getElementById("purchase-form");
const purchaseImageId = document.getElementById("purchase-image-id");
const purchaseImageTitle = document.getElementById("modal-image-title");
const purchaseMsg = document.getElementById("purchase-msg");

const downloadModal = document.getElementById("download-modal");
const downloadForm = document.getElementById("download-form");
const downloadImageId = document.getElementById("download-image-id");
const downloadMsg = document.getElementById("download-msg");

const cameraBtn = document.getElementById("camera-btn");
const imageSearchInput = document.getElementById("image-search-input");
const imageSearchBanner = document.getElementById("image-search-banner");
const clearImageSearchBtn = document.getElementById("clear-image-search");

const FORMAT_LABELS = {
  ".png": "PNG", ".jpg": "JPG", ".jpeg": "JPG", ".webp": "WEBP",
  ".pdf": "PDF", ".cdr": "CDR", ".ai": "AI", ".eps": "EPS", ".svg": "SVG",
};

// ---------- cargar imagenes desde la API (busqueda por texto) ----------
async function loadImages(query = "") {
  const res = await fetch(`/api/images?search=${encodeURIComponent(query)}`);
  const images = await res.json();
  imageSearchBanner.style.display = "none";
  renderGallery(images);
}

function renderGallery(images) {
  gallery.innerHTML = "";
  emptyMsg.style.display = images.length ? "none" : "block";

  images.forEach((img) => {
    const card = document.createElement("div");
    card.className = "card";

    const badge = img.isPaid
      ? `<span class="badge paid">S/ ${img.price.toFixed(2)}</span>`
      : `<span class="badge free">Gratis</span>`;

    const formatLabel = FORMAT_LABELS[img.sourceExt] || (img.sourceExt || "").replace(".", "").toUpperCase();
    const formatBadge = formatLabel ? `<span class="format-badge">${formatLabel}</span>` : "";

    const actionButton = img.isPaid
      ? `<button class="btn-primary" onclick="openPurchaseModal('${img.id}', '${escapeHtml(img.title)}')">Comprar</button>
         <button class="btn-secondary" onclick="openDownloadModal('${img.id}')">Ya compré</button>`
      : `<button class="btn-primary" onclick="downloadFree('${img.id}')">Descargar</button>`;

    card.innerHTML = `
      ${badge}
      <div class="card-thumb-wrap">
        <img src="${img.thumbUrl}" alt="${escapeHtml(img.title)}" loading="lazy" />
        ${formatBadge}
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(img.title)}</div>
        <div class="card-tags">${img.tags.map(escapeHtml).join(" · ")}</div>
        <div class="card-actions">${actionButton}</div>
      </div>
    `;
    gallery.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- descarga directa (imagenes gratis) ----------
function downloadFree(id) {
  window.location.href = `/api/images/${id}/download`;
}

// ---------- modal de compra ----------
function openPurchaseModal(id, title) {
  purchaseImageId.value = id;
  purchaseImageTitle.textContent = title;
  purchaseMsg.textContent = "";
  purchaseForm.reset();
  purchaseModal.style.display = "flex";
}
document.getElementById("modal-close").onclick = () => (purchaseModal.style.display = "none");

purchaseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("imageId", purchaseImageId.value);
  formData.append("email", document.getElementById("purchase-email").value);
  formData.append("operationCode", document.getElementById("purchase-code").value);
  formData.append("proof", document.getElementById("purchase-proof").files[0]);

  purchaseMsg.textContent = "Enviando...";
  const res = await fetch("/api/orders", { method: "POST", body: formData });
  const data = await res.json();

  if (data.ok) {
    purchaseMsg.style.color = "#16a34a";
    purchaseMsg.textContent =
      "Pedido enviado. Cuando se apruebe tu pago, usa el botón 'Ya compré' con el mismo correo para descargar.";
  } else {
    purchaseMsg.style.color = "#dc2626";
    purchaseMsg.textContent = data.error || "Ocurrió un error, intenta de nuevo.";
  }
});

// ---------- modal de verificar/descargar compra ----------
function openDownloadModal(id) {
  downloadImageId.value = id;
  downloadMsg.textContent = "";
  downloadForm.reset();
  downloadModal.style.display = "flex";
}
document.getElementById("download-modal-close").onclick = () => (downloadModal.style.display = "none");

downloadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = downloadImageId.value;
  const email = document.getElementById("download-email").value;

  const res = await fetch(`/api/images/${id}/download?email=${encodeURIComponent(email)}`);
  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imagen";
    a.click();
    downloadMsg.style.color = "#16a34a";
    downloadMsg.textContent = "Descarga iniciada.";
  } else {
    const data = await res.json();
    downloadMsg.style.color = "#dc2626";
    downloadMsg.textContent = data.error || "No pudimos verificar tu compra.";
  }
});

// ---------- busqueda por texto ----------
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loadImages(searchInput.value);
});

// ---------- busqueda por imagen (embedding de color layout) ----------
cameraBtn.addEventListener("click", () => imageSearchInput.click());

imageSearchInput.addEventListener("change", async () => {
  const file = imageSearchInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  gallery.innerHTML = "<p class='loading-msg'>Analizando tu foto y buscando imágenes parecidas...</p>";
  emptyMsg.style.display = "none";

  const res = await fetch("/api/images/search-by-image", { method: "POST", body: formData });
  const data = await res.json();

  if (Array.isArray(data)) {
    imageSearchBanner.style.display = "block";
    searchInput.value = "";
    renderGallery(data);
  } else {
    gallery.innerHTML = `<p class='loading-msg' style='color:#dc2626;'>${data.error || "No pudimos buscar por esa imagen."}</p>`;
  }
  imageSearchInput.value = "";
});

clearImageSearchBtn.addEventListener("click", () => {
  loadImages();
});

// carga inicial
loadImages();
