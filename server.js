/**
 * MINI UNSPLASH PE - servidor backend
 * -------------------------------------
 * Este archivo levanta un servidor Express que:
 *  1. Sirve la pagina web (carpeta /public)
 *  2. Da una API para listar/buscar imagenes (por texto Y por imagen)
 *  3. Permite subir imagenes nuevas (panel admin), con vista previa
 *     separada del archivo fuente para soportar cualquier formato
 *     (PNG, JPG, PDF, CDR, AI, EPS, etc.)
 *  4. Maneja el flujo de "compra" via Yape de forma MANUAL:
 *     el cliente sube su comprobante -> queda "pendiente"
 *     el admin lo aprueba a mano -> se libera la descarga
 *
 * Base de datos: por simplicidad, usamos 2 archivos JSON
 * (data/images.json y data/orders.json) en vez de un motor
 * de base de datos real. Para produccion real se recomienda
 * migrar a Postgres/Supabase (lo explico en el README).
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Jimp = require("jimp");

// ====================================================================
// BUSCADOR POR IMAGEN: embedding visual por "color layout"
// --------------------------------------------------------------------
// En vez de comparar solo 1 color promedio de toda la foto (como en la
// version anterior), dividimos la imagen en una cuadricula de 8x8 (64
// celdas) y calculamos el color promedio DE CADA CELDA. Esto arma un
// vector de 192 numeros (64 celdas x 3 canales RGB) que describe tanto
// los colores como su DISTRIBUCION espacial (ej: "cielo celeste arriba,
// arena beige abajo" es distinto de "arena arriba, cielo abajo").
// Esto es lo que en vision por computadora clasica se llama un "Color
// Layout Descriptor" - es un embedding real (un vector de caracteristicas
// que se puede comparar por distancia), aunque no es una red neuronal.
// ====================================================================
const EMBEDDING_GRID = 8;

async function computeEmbedding(filePath) {
  const img = await Jimp.read(filePath);
  const small = img.clone().cover(EMBEDDING_GRID, EMBEDDING_GRID);
  const embedding = [];
  for (let y = 0; y < EMBEDDING_GRID; y++) {
    for (let x = 0; x < EMBEDDING_GRID; x++) {
      const { r, g, b } = Jimp.intToRGBA(small.getPixelColor(x, y));
      embedding.push(r, g, b);
    }
  }
  return embedding;
}

function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ============= LOGIN DEL PANEL ADMIN =============
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pixelperu2026";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas
const sessions = new Map();

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k] = decodeURIComponent(v.join("="));
  });
  return cookies;
}
function createSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_DURATION_MS);
  return token;
}
function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const expiresAt = sessions.get(token);
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}
function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (isValidSession(cookies.session)) return next();
  return res.status(401).json({ error: "No autorizado, inicia sesion de nuevo" });
}

const DATA_DIR = path.join(__dirname, "data");
const IMAGES_JSON = path.join(DATA_DIR, "images.json");
const ORDERS_JSON = path.join(DATA_DIR, "orders.json");
const UPLOADS_PREVIEWS = path.join(__dirname, "uploads", "images"); // vistas previas (siempre png/jpg)
const UPLOADS_SOURCES = path.join(__dirname, "uploads", "sources"); // archivo real que se vende (cualquier formato)
const UPLOADS_PROOFS = path.join(__dirname, "uploads", "proofs");

for (const dir of [UPLOADS_PREVIEWS, UPLOADS_SOURCES, UPLOADS_PROOFS]) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8").trim();
  return raw ? JSON.parse(raw) : [];
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function newId() {
  return crypto.randomBytes(6).toString("hex");
}

// -------- formatos de archivo fuente aceptados (lo que se vende/entrega) --------
const ALLOWED_SOURCE_EXT = [".png", ".jpg", ".jpeg", ".pdf", ".cdr", ".ai", ".eps", ".svg", ".webp"];

const uploadProof = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_PROOFS),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, newId() + ext);
    },
  }),
});

// subida admin: 2 archivos en un solo formulario -> "preview" (imagen) y "source" (archivo real)
const uploadAdminFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "preview") return cb(null, UPLOADS_PREVIEWS);
      return cb(null, UPLOADS_SOURCES);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, newId() + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === "preview" && ![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      return cb(new Error("La vista previa debe ser PNG, JPG o WEBP"));
    }
    if (file.fieldname === "source" && !ALLOWED_SOURCE_EXT.includes(ext)) {
      return cb(new Error(`Formato de archivo fuente no soportado: ${ext}`));
    }
    cb(null, true);
  },
}).fields([
  { name: "preview", maxCount: 1 },
  { name: "source", maxCount: 1 },
]);

app.use(express.json());

// bloquea el acceso directo a las paginas del panel admin si no hay sesion valida
app.use((req, res, next) => {
  if (req.path === "/admin.html" || req.path === "/admin.js") {
    const cookies = parseCookies(req.headers.cookie);
    if (!isValidSession(cookies.session)) {
      return res.redirect("/login.html");
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============= LOGIN / LOGOUT =============
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = createSession();
    res.setHeader(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}; SameSite=Lax`
    );
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Usuario o contraseña incorrectos" });
});

app.post("/api/admin/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  sessions.delete(cookies.session);
  res.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.use("/api/admin", (req, res, next) => {
  if (req.path === "/login") return next();
  requireAuth(req, res, next);
});

// ============= API: LISTAR / BUSCAR IMAGENES (por texto) =============
app.get("/api/images", (req, res) => {
  const images = readJson(IMAGES_JSON);
  const q = (req.query.search || "").toLowerCase().trim();

  let result = images;
  if (q) {
    result = images.filter((img) => {
      const haystack = (img.title + " " + img.tags.join(" ")).toLowerCase();
      return haystack.includes(q);
    });
  }

  const safe = result.map((img) => ({
    id: img.id,
    title: img.title,
    tags: img.tags,
    isPaid: img.isPaid,
    price: img.price,
    sourceExt: img.sourceExt,
    thumbUrl: `/uploads/images/${img.previewFilename}`,
  }));

  res.json(safe);
});

// ============= API: DESCARGAR UNA IMAGEN (entrega el archivo FUENTE) =============
app.get("/api/images/:id/download", (req, res) => {
  const images = readJson(IMAGES_JSON);
  const img = images.find((i) => i.id === req.params.id);
  if (!img) return res.status(404).json({ error: "Imagen no encontrada" });

  const filePath = path.join(UPLOADS_SOURCES, img.sourceFilename);
  const downloadName = `${img.title.replace(/[^a-z0-9]+/gi, "-")}${img.sourceExt}`;

  if (!img.isPaid) {
    return res.download(filePath, downloadName);
  }

  const email = (req.query.email || "").toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: "Falta el correo para verificar tu compra" });
  }

  const orders = readJson(ORDERS_JSON);
  const approved = orders.find(
    (o) => o.imageId === img.id && o.email.toLowerCase() === email && o.status === "aprobado"
  );

  if (!approved) {
    return res.status(402).json({ error: "No encontramos una compra aprobada con ese correo" });
  }

  res.download(filePath, downloadName);
});

// ============= API: CREAR UN PEDIDO (compra via Yape) =============
app.post("/api/orders", uploadProof.single("proof"), (req, res) => {
  const { imageId, email, operationCode } = req.body;
  if (!imageId || !email) {
    return res.status(400).json({ error: "Faltan datos del pedido" });
  }

  const images = readJson(IMAGES_JSON);
  const img = images.find((i) => i.id === imageId);
  if (!img) return res.status(404).json({ error: "Imagen no encontrada" });

  const orders = readJson(ORDERS_JSON);
  const order = {
    id: newId(),
    imageId,
    imageTitle: img.title,
    email: email.toLowerCase().trim(),
    operationCode: operationCode || "",
    proofFilename: req.file ? req.file.filename : null,
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  writeJson(ORDERS_JSON, orders);

  res.json({ ok: true, order });
});

// ============= API: BUSCAR POR IMAGEN (embedding de color layout) =============
app.post("/api/images/search-by-image", uploadProof.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Sube una foto para buscar" });

  try {
    const targetEmbedding = await computeEmbedding(req.file.path);
    const images = readJson(IMAGES_JSON);

    const ranked = images
      .map((img) => ({
        img,
        dist: euclideanDistance(img.embedding, targetEmbedding),
      }))
      .sort((a, b) => a.dist - b.dist)
      .map((r) => r.img);

    const safe = ranked.map((img) => ({
      id: img.id,
      title: img.title,
      tags: img.tags,
      isPaid: img.isPaid,
      price: img.price,
      sourceExt: img.sourceExt,
      thumbUrl: `/uploads/images/${img.previewFilename}`,
    }));

    fs.unlink(req.file.path, () => {});
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No pudimos procesar la imagen" });
  }
});

// ============= API ADMIN: LISTAR IMAGENES (dashboard) =============
app.get("/api/admin/images", (req, res) => {
  const images = readJson(IMAGES_JSON);
  res.json([...images].reverse());
});

// ============= API ADMIN: BORRAR UNA IMAGEN =============
app.delete("/api/admin/images/:id", (req, res) => {
  const images = readJson(IMAGES_JSON);
  const idx = images.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Imagen no encontrada" });

  const [removed] = images.splice(idx, 1);
  writeJson(IMAGES_JSON, images);

  fs.unlink(path.join(UPLOADS_PREVIEWS, removed.previewFilename), () => {});
  fs.unlink(path.join(UPLOADS_SOURCES, removed.sourceFilename), () => {});

  res.json({ ok: true, removed: removed.id });
});

// ============= API ADMIN: EDITAR TITULO / TAGS / PRECIO =============
app.patch("/api/admin/images/:id", (req, res) => {
  const images = readJson(IMAGES_JSON);
  const img = images.find((i) => i.id === req.params.id);
  if (!img) return res.status(404).json({ error: "Imagen no encontrada" });

  const { title, tags, isPaid, price } = req.body;
  if (title !== undefined) img.title = title;
  if (tags !== undefined) {
    img.tags = String(tags).split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (isPaid !== undefined) img.isPaid = isPaid === true || isPaid === "true";
  if (price !== undefined) img.price = Number(price) || 0;

  writeJson(IMAGES_JSON, images);
  res.json({ ok: true, image: img });
});

// ============= API ADMIN: SUBIR NUEVA IMAGEN (vista previa + archivo fuente) =============
app.post("/api/admin/images", (req, res) => {
  uploadAdminFiles(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, tags, isPaid, price } = req.body;
    const previewFile = req.files?.preview?.[0];
    const sourceFile = req.files?.source?.[0];

    if (!previewFile || !sourceFile || !title) {
      return res.status(400).json({ error: "Faltan la vista previa, el archivo fuente, o el titulo" });
    }

    let embedding = [];
    try {
      embedding = await computeEmbedding(previewFile.path);
    } catch (e) {
      console.error("No se pudo calcular el embedding:", e.message);
    }

    const images = readJson(IMAGES_JSON);
    const img = {
      id: newId(),
      title,
      tags: (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      previewFilename: previewFile.filename,
      sourceFilename: sourceFile.filename,
      sourceExt: path.extname(sourceFile.originalname).toLowerCase(),
      isPaid: isPaid === "true" || isPaid === true,
      price: Number(price) || 0,
      embedding,
      createdAt: new Date().toISOString(),
    };
    images.push(img);
    writeJson(IMAGES_JSON, images);

    res.json({ ok: true, image: img });
  });
});

// ============= API ADMIN: VER Y APROBAR PEDIDOS =============
app.get("/api/admin/orders", (req, res) => {
  const orders = readJson(ORDERS_JSON);
  res.json(orders.reverse());
});

app.post("/api/admin/orders/:id/:action", (req, res) => {
  const { id, action } = req.params;
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Accion invalida" });
  }
  const orders = readJson(ORDERS_JSON);
  const order = orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

  order.status = action === "approve" ? "aprobado" : "rechazado";
  writeJson(ORDERS_JSON, orders);
  res.json({ ok: true, order });
});

app.listen(PORT, () => {
  console.log(`\n Mini Unsplash corriendo en http://localhost:${PORT}`);
  console.log(` Panel admin en http://localhost:${PORT}/admin.html\n`);
});
