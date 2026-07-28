const uploadForm = document.getElementById("upload-form");
const uploadMsg = document.getElementById("upload-msg");
const ordersList = document.getElementById("orders-list");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// si cualquier llamada a la API admin devuelve 401, la sesion expiro o no es valida
function checkAuth(res) {
  if (res.status === 401) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/login.html";
});

// ---------- subir nueva imagen (vista previa + archivo fuente) ----------
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("title", document.getElementById("img-title").value);
  formData.append("tags", document.getElementById("img-tags").value);
  formData.append("isPaid", document.getElementById("img-ispaid").checked);
  formData.append("price", document.getElementById("img-price").value || 0);
  formData.append("preview", document.getElementById("img-preview").files[0]);
  formData.append("source", document.getElementById("img-source").files[0]);

  uploadMsg.style.color = "#666";
  uploadMsg.textContent = "Subiendo...";
  const res = await fetch("/api/admin/images", { method: "POST", body: formData });
  if (!checkAuth(res)) return;
  const data = await res.json();

  if (data.ok) {
    uploadMsg.style.color = "#16a34a";
    uploadMsg.textContent = "Imagen subida correctamente.";
    uploadForm.reset();
    loadImagesDashboard();
  } else {
    uploadMsg.style.color = "#dc2626";
    uploadMsg.textContent = data.error || "Error al subir la imagen.";
  }
});

// ---------- listar pedidos ----------
async function loadOrders() {
  const res = await fetch("/api/admin/orders");
  if (!checkAuth(res)) return;
  const orders = await res.json();

  if (!orders.length) {
    ordersList.innerHTML = "<p style='color:#888'>Todavía no hay pedidos.</p>";
    return;
  }

  ordersList.innerHTML = "";
  orders.forEach((order) => {
    const div = document.createElement("div");
    div.className = "order-card";

    const proofLink = order.proofFilename
      ? `<a class="proof-link" href="/uploads/proofs/${order.proofFilename}" target="_blank">Ver comprobante</a>`
      : "<span class='proof-link'>Sin comprobante</span>";

    div.innerHTML = `
      <div class="order-info">
        <b>${escapeHtml(order.imageTitle)}</b><br/>
        Correo: ${escapeHtml(order.email)}<br/>
        Código: ${escapeHtml(order.operationCode || "-")}<br/>
        ${proofLink}<br/>
        <span class="status-tag ${order.status}">${order.status}</span>
      </div>
      <div class="order-actions">
        ${
          order.status === "pendiente"
            ? `<button class="btn-approve" onclick="updateOrder('${order.id}', 'approve')">Aprobar</button>
               <button class="btn-reject" onclick="updateOrder('${order.id}', 'reject')">Rechazar</button>`
            : ""
        }
      </div>
    `;
    ordersList.appendChild(div);
  });
}

async function updateOrder(id, action) {
  await fetch(`/api/admin/orders/${id}/${action}`, { method: "POST" });
  loadOrders();
}

// ---------- dashboard de imagenes (ver, filtrar, editar, borrar) ----------
const statsRow = document.getElementById("stats-row");
const imagesDashboard = document.getElementById("images-dashboard");
const imagesFilter = document.getElementById("images-filter");
let allImages = [];

async function loadImagesDashboard() {
  const res = await fetch("/api/admin/images");
  if (!checkAuth(res)) return;
  allImages = await res.json();
  renderStats();
  renderImagesDashboard(allImages);
}

function renderStats() {
  const total = allImages.length;
  const paid = allImages.filter((i) => i.isPaid).length;
  const free = total - paid;
  statsRow.innerHTML = `
    <div class="stat-card"><div class="num">${total}</div><div class="label">Total de imágenes</div></div>
    <div class="stat-card"><div class="num">${free}</div><div class="label">Gratis</div></div>
    <div class="stat-card"><div class="num">${paid}</div><div class="label">De pago</div></div>
  `;
}

function renderImagesDashboard(images) {
  if (!images.length) {
    imagesDashboard.innerHTML = "<p style='color:#888'>No hay imágenes que coincidan.</p>";
    return;
  }
  imagesDashboard.innerHTML = "";
  images.forEach((img) => {
    const card = document.createElement("div");
    card.className = "img-card";
    const badge = img.isPaid
      ? `<span class="img-card-badge paid">S/ ${img.price.toFixed(2)}</span>`
      : `<span class="img-card-badge free">Gratis</span>`;
    const format = (img.sourceExt || "").replace(".", "").toUpperCase();
    card.innerHTML = `
      <div class="img-card-thumb-wrap">
        <img src="/uploads/images/${img.previewFilename}" alt="${escapeHtml(img.title)}" />
        ${format ? `<span class="img-card-format">${format}</span>` : ""}
      </div>
      <div class="img-card-body">
        ${badge}
        <div class="img-card-title">${escapeHtml(img.title)}</div>
        <div class="img-card-actions">
          <button class="btn-edit" onclick='openEditModal(${JSON.stringify(img).replace(/'/g, "&#39;")})'>Editar</button>
          <button class="btn-delete" onclick="deleteImage('${img.id}')">Borrar</button>
        </div>
      </div>
    `;
    imagesDashboard.appendChild(card);
  });
}

imagesFilter.addEventListener("input", () => {
  const q = imagesFilter.value.toLowerCase().trim();
  const filtered = allImages.filter((img) => {
    const haystack = (img.title + " " + img.tags.join(" ")).toLowerCase();
    return haystack.includes(q);
  });
  renderImagesDashboard(filtered);
});

async function deleteImage(id) {
  if (!confirm("¿Seguro que quieres borrar esta imagen? Esta acción no se puede deshacer.")) return;
  const res = await fetch(`/api/admin/images/${id}`, { method: "DELETE" });
  if (!checkAuth(res)) return;
  loadImagesDashboard();
}

// ---------- edicion de imagen ----------
const editOverlay = document.getElementById("edit-modal-overlay");
const editId = document.getElementById("edit-id");
const editTitle = document.getElementById("edit-title");
const editTags = document.getElementById("edit-tags");
const editIsPaid = document.getElementById("edit-ispaid");
const editPrice = document.getElementById("edit-price");

function openEditModal(img) {
  editId.value = img.id;
  editTitle.value = img.title;
  editTags.value = img.tags.join(", ");
  editIsPaid.checked = img.isPaid;
  editPrice.value = img.price;
  editOverlay.classList.add("open");
}
document.getElementById("edit-cancel").addEventListener("click", () => editOverlay.classList.remove("open"));

document.getElementById("edit-save").addEventListener("click", async () => {
  const res = await fetch(`/api/admin/images/${editId.value}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: editTitle.value,
      tags: editTags.value,
      isPaid: editIsPaid.checked,
      price: editPrice.value,
    }),
  });
  if (!checkAuth(res)) return;
  editOverlay.classList.remove("open");
  loadImagesDashboard();
});

loadOrders();
loadImagesDashboard();
