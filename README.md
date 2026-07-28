# PixelPeru - Banco de imagenes profesional (estilo Unsplash)

Web con:
- **Diseño profesional**: identidad visual propia, tipografia moderna, tarjetas con animaciones, todo pensado para mostrarselo a un cliente
- Galeria de imagenes con **buscador por texto** (titulo y tags)
- **Buscador por imagen con embeddings**: subes una foto y el sistema calcula un vector de caracteristicas visuales (color + composicion espacial en una cuadricula de 8x8) para encontrar las imagenes mas parecidas del catalogo. Ver seccion 13 para el detalle tecnico y sus limites honestos.
- **Soporte multi-formato**: cada imagen tiene una vista previa (PNG/JPG, lo que se ve en la galeria) y un archivo fuente separado que se entrega al comprador — puede ser PNG, JPG, PDF, CDR (CorelDraw), AI, EPS o SVG
- Imagenes gratis y de pago
- Compra de imagenes de pago via Yape, con aprobacion manual desde un panel admin
- **Dashboard de administracion completo**: estadisticas, subir, editar (titulo/precio/tags) y borrar imagenes, aprobar/rechazar pedidos
- **Panel admin protegido con usuario y contraseña**
- 12 imagenes de ejemplo ya cargadas (ilustraciones tipo Peru: Machu Picchu, ceviche, playa, alpacas, etc.) para que la veas funcionando desde el primer momento

---

## 1. Requisitos previos (una sola vez en tu PC)

1. Instala **Node.js** (incluye npm): entra a https://nodejs.org y baja la version "LTS". Instalalo como cualquier programa (siguiente, siguiente, finalizar).
2. Instala **Visual Studio Code**: https://code.visualstudio.com
3. Para verificar que quedo bien instalado, abre una terminal (en Windows: busca "cmd" o "PowerShell"; en Mac: "Terminal") y escribe:

```
node -v
npm -v
```

Si te muestra numeros de version (ej: v20.11.0), estas listo.

---

## 2. Abrir el proyecto en VS Code (menus en ingles)

Como tu VS Code esta en ingles, aca van los nombres exactos de los menus que vas a usar:

1. Descomprime la carpeta `mini-unsplash` en el lugar que quieras (ej: Desktop).
2. Abre **Visual Studio Code**.
3. Ve a `File > Open Folder...` y selecciona la carpeta `mini-unsplash`.
4. Abre la terminal integrada: menu `Terminal > New Terminal` (o el atajo `` Ctrl + ` ``, la tecla debajo de Esc).

---

## 3. Instalar las dependencias del proyecto

En la terminal que se abrio abajo en VS Code, escribe:

```
npm install
```

Presiona Enter y espera a que termine (descarga Express, Multer y Jimp, las 3 librerias que usa el proyecto). Solo lo haces una vez.

---

## 4. Correr el proyecto

En la misma terminal, escribe:

```
npm start
```

Deberias ver algo como:

```
Mini Unsplash corriendo en http://localhost:3000
Panel admin en http://localhost:3000/admin.html
```

## 5. Ver la web dentro de VS Code (sin salir del editor)

VS Code trae una funcion incorporada llamada **Simple Browser** que abre una pestaña con un navegador adentro del editor, para que veas la web sin cambiar de programa. No necesitas instalar ninguna extension para esto:

1. Presiona `Ctrl+Shift+P` (Windows/Linux) o `Cmd+Shift+P` (Mac) para abrir el **Command Palette**.
2. Escribe: `Simple Browser: Show` y presiona Enter.
3. Te va a pedir una URL: escribe `http://localhost:3000` y presiona Enter.
4. Se abre una pestaña nueva mostrando tu web, dentro del mismo VS Code.

Si prefieres verla en tu navegador normal (Chrome, Edge, etc.), simplemente abre `http://localhost:3000` ahi tambien - funciona igual, es la misma pagina.

Para detener el servidor en cualquier momento, haz clic en la terminal y presiona `Ctrl + C`.

**Extension opcional:** si en el futuro quieres una extension dedicada para previsualizar archivos, la extension oficial de Microsoft llamada **"Live Preview"** (buscar en el ícono de Extensions, `Ctrl+Shift+X`) hace algo similar a Simple Browser pero con mas opciones. Para este proyecto, Simple Browser (que ya viene instalado) es suficiente.

---

## 6. Subir la web a internet GRATIS (para que tu cliente la pruebe)

Vamos a usar 2 servicios gratuitos: **GitHub** (donde vive tu codigo) y **Render** (donde corre tu web, gratis). No necesitas tarjeta de credito para ninguno de los dos.

### Paso A: Crea tu cuenta de GitHub

1. Entra a https://github.com y crea una cuenta gratis (si no tienes una).
2. Una vez dentro, haz clic en el boton verde **"New"** (o el signo `+` arriba a la derecha > "New repository").
3. Ponle de nombre, por ejemplo, `pixelperu`.
4. Marca la opcion **Public**.
5. No marques ninguna otra casilla (ni README, ni .gitignore, ni licencia).
6. Dale a **"Create repository"**.

### Paso B: Sube tu proyecto a GitHub (sin usar comandos, arrastrando archivos)

1. En la pagina de tu repositorio recien creado, busca el link que dice **"uploading an existing file"** (aparece en el mensaje de bienvenida) y haz clic ahi.
2. Abre la carpeta `mini-unsplash` en tu computadora (en una ventana del explorador de archivos, no en VS Code).
3. Selecciona **todos los archivos y carpetas de adentro** (`server.js`, `package.json`, `public`, `data`, `uploads`, `README.md` — todo lo que esta DENTRO de `mini-unsplash`, no la carpeta `mini-unsplash` misma) y arrastralos a la pagina de GitHub.
4. Espera a que termine de cargar (puede tardar un poco por las imagenes).
5. Abajo, en "Commit changes", deja todo como esta y dale al boton verde **"Commit changes"**.

**Importante:** NO subas la carpeta `node_modules` si la tienes generada localmente (ocupa mucho espacio y no hace falta), Render la genera solita con `npm install`.

### Paso C: Crea tu cuenta en Render y conecta el repositorio

1. Entra a https://render.com y dale a **"Get Started"**.
2. Elige registrarte **"with GitHub"** (asi quedan conectados automaticamente, es lo mas facil).
3. Autoriza el acceso cuando te lo pida.
4. Dentro de Render, dale a **"New +"** (arriba a la derecha) y elige **"Web Service"**.
5. Busca y selecciona el repositorio `pixelperu` que acabas de subir, y dale **"Connect"**.

### Paso D: Configura el servicio (todo gratis)

Render va a mostrarte un formulario. Completa asi:

| Campo | Valor |
|---|---|
| Name | `pixelperu` (o el nombre que quieras) |
| Region | La mas cercana (ej: Oregon si no hay una de Sudamerica) |
| Branch | `main` |
| Root Directory | (dejalo vacio) |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | **Free** |

Dale clic a **"Create Web Service"** al final de la pagina.

### Paso E: Espera y prueba

1. Render va a empezar a instalar todo y correr tu proyecto (tarda 2-5 minutos la primera vez). Vas a ver los logs en pantalla, similar a la terminal.
2. Cuando termine y diga algo como "Your service is live", arriba va a aparecer una URL parecida a `https://pixelperu.onrender.com`.
3. Esa es la direccion que le mandas a tu cliente para que la abra desde su celular o compu, ¡desde cualquier parte del mundo!

### Cosas importantes sobre el plan gratis de Render

- **Se "duerme" si nadie la visita:** despues de unos 15 minutos sin visitas, el servicio gratis se apaga solo. La proxima vez que alguien entre, tarda unos 30-50 segundos en "despertar" y cargar. Esto es normal en el plan gratis, no es un error. Si tu cliente ve que carga lento la primera vez, dile que espere un poco y recargue.
- **Los archivos subidos no son permanentes:** en el plan gratis, cada vez que Render reinicia el servicio (por dormirse o por una actualizacion), se borran las imagenes o pedidos que se hayan subido *despues* del despliegue (las 12 imagenes de ejemplo que vienen incluidas en el proyecto SI se mantienen, porque estan guardadas en el codigo). Esto esta perfecto para que tu cliente **pruebe y vea como funciona**, pero antes de usarla en serio con ventas reales, hay que agregarle almacenamiento permanente (te puedo ayudar con eso cuando llegues a ese punto).
- **Actualizar la web despues de cambios:** si cambias algo en tu compu y quieres que se refleje en internet, tienes que volver a subir los archivos modificados a GitHub (repite el Paso B solo con los archivos que cambiaron) y Render los detecta y actualiza solo en un par de minutos.

---

## 7. Iniciar sesion en el panel admin (usuario y contraseña)

El panel admin ahora esta protegido con usuario y contraseña. Si alguien intenta entrar a `/admin.html` sin haber iniciado sesion, lo manda automaticamente a una pantalla de login.

**Credenciales de fabrica (cambialas antes de compartir la web con tu cliente):**
- Usuario: `admin`
- Contraseña: `pixelperu2026`

### Como cambiar el usuario y la contraseña

**Opcion 1 - Localmente (editando el codigo):** abre `server.js`, busca estas lineas (cerca del inicio del archivo) y cambia los valores:

```js
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pixelperu2026";
```

Por ejemplo, cambia `"admin"` por tu usuario y `"pixelperu2026"` por tu contraseña real.

**Opcion 2 - En Render (recomendado, mas seguro, sin tocar codigo):** dentro de tu servicio en Render, ve a la pestaña **"Environment"**, agrega dos variables:

| Key | Value |
|---|---|
| `ADMIN_USER` | el usuario que quieras |
| `ADMIN_PASSWORD` | la contraseña que quieras |

Guarda los cambios y Render reinicia el servicio solo, usando esas credenciales en vez de las de fabrica. Esta opcion es mejor porque tu contraseña real nunca queda escrita dentro del codigo que subes a GitHub.

**Nota tecnica breve:** la sesion dura 8 horas y se guarda en la memoria del servidor (no en una base de datos), asi que si el servicio de Render se reinicia (ver seccion anterior sobre el plan gratis), vas a tener que iniciar sesion de nuevo. Es un detalle menor, no afecta el uso normal.

---

## 8. Como usar el panel admin

1. Entra a `TU_URL/admin.html` (localmente: http://localhost:3000/admin.html) e inicia sesion.
2. En "Subir nueva imagen" ahora subes **2 archivos**:
   - **Vista previa**: una imagen PNG/JPG/WEBP — es lo que se ve en la galeria y lo que usa el buscador por imagen.
   - **Archivo fuente**: el archivo real que recibe el comprador al descargar — puede ser PNG, JPG, PDF, CDR, AI, EPS o SVG.
   - Si vendes un diseño hecho en CorelDraw: exporta una vista previa en PNG desde CorelDraw (`Archivo > Exportar`) y sube esa PNG como vista previa, y el `.cdr` original como archivo fuente. Así el comprador ve una imagen bonita en la galeria pero recibe el archivo editable real.
3. Completa titulo, tags, y si es de pago el precio, y dale "Subir imagen".
4. En "Base de datos de imagenes" puedes **editar** (titulo, tags, precio, gratis/pago) o **borrar** cualquier imagen con los botones de cada tarjeta.

---

## 9. Como funciona la compra por Yape (flujo manual)

1. Un cliente entra a la pagina, busca una imagen de pago y le da "Comprar".
2. Se le muestra tu numero de Yape (tienes que cambiar el numero de ejemplo, ver siguiente seccion).
3. El cliente yapea, y luego llena el formulario: su correo, el codigo de operacion (opcional) y sube una captura del pago.
4. Ese pedido llega a tu panel admin como "pendiente".
5. Tu revisas el comprobante (hay un link para verlo), confirmas que si te llego el Yape, y le das "Aprobar".
6. El cliente vuelve a la pagina, le da "Ya compre" en esa misma imagen, pone el mismo correo que uso, y puede descargar.

Nota: el panel admin ya esta protegido con usuario y contraseña (ver seccion 7), asi que solo tu puedes aprobar pedidos o subir imagenes.

---

## 10. Cambiar tu numero de Yape

Abre el archivo `public/index.html`, busca esta parte (aprox linea 73) y cambia el numero y el nombre:

```html
<p class="yape-number">987 654 321</p>
<p class="yape-name">A nombre de: Tadeo (ejemplo)</p>
```

Si quieres poner una imagen de tu QR de Yape en vez de solo el numero, agrega esto justo debajo:

```html
<img src="/qr-yape.png" alt="QR Yape" style="width:180px; margin: 10px auto; display:block;" />
```

Y coloca tu imagen del QR dentro de la carpeta `public` con el nombre `qr-yape.png`.

---

## 11. Como funciona el buscador por imagen (explicacion honesta)

Cuando alguien sube una foto para buscar, el sistema:

1. Divide la imagen en una cuadricula de 8x8 (64 celditas).
2. Calcula el color promedio de cada celdita → arma un "vector" de 192 numeros (64 celdas x 3 canales de color).
3. Compara ese vector contra el de cada imagen del catalogo (que se calculo cuando se subio) y ordena por la mas parecida.

Esto es un **embedding real** (un vector de caracteristicas que se puede comparar matematicamente) y es mucho mejor que comparar un solo color promedio de toda la imagen — ahora SI le importa la composicion: distingue "cielo arriba, arena abajo" de "arena arriba, cielo abajo", por ejemplo.

**Lo que este metodo SI hace bien:** encontrar imagenes con colores y composicion visual parecida (fotos de playas con otras playas, atardeceres con atardeceres, etc.)

**Lo que este metodo NO hace:** reconocer objetos o contenido (no distingue "un perro" de "un gato" si ambas fotos tienen fondo verde parecido — eso requeriria una red neuronal entrenada para reconocimiento de objetos, como CLIP de OpenAI o Google Vision API, que tienen costo por uso y se pueden integrar mas adelante si el negocio lo justifica).

---

## 12. Formatos de archivo soportados (vista previa + archivo fuente)

Cada imagen del catalogo en realidad son **2 archivos separados**:

- **Vista previa** (PNG/JPG/WEBP): la miniatura que se ve en la galeria y la que usa el buscador por imagen. Siempre tiene que ser una imagen normal para que se pueda mostrar en el navegador.
- **Archivo fuente**: el archivo real que recibe el comprador al pagar/descargar. Acepta PNG, JPG, PDF, CDR (CorelDraw), AI (Illustrator), EPS o SVG.

**Por que esta separacion:** no existe ninguna libreria gratuita (ni de pago, en realidad) que pueda "leer" un archivo `.cdr` de CorelDraw y generar una miniatura automaticamente — es un formato cerrado de Corel. La solucion profesional (la misma que usan bancos de imagenes reales como Freepik o Vecteezy con sus archivos AI/EPS) es pedirle a quien sube el contenido que exporte una vista previa en PNG por separado. Asi el sistema nunca necesita "entender" el archivo fuente, solo lo entrega tal cual al comprador.

---

## 13. Cosas a mejorar antes de venderlo en serio (importante)

Este proyecto ya esta funcionando de verdad y online, pero antes de cobrar dinero real con el, te recomiendo:

1. **Almacenamiento permanente**: en el plan gratis de Render, las imagenes/pedidos que se suban despues del despliegue se pierden al reiniciarse el servicio. Para que sea permanente, se necesita un disco persistente (Render lo ofrece en un plan pago economico) o mover los archivos a un servicio como Cloudinary o Supabase Storage.
2. **Migrar de archivos JSON a una base de datos real** (ej: Postgres/Supabase) si esperas manejar cientos o miles de imagenes y pedidos.
3. **Automatizar el pago** con una pasarela (Culqi o Mercado Pago) cuando el volumen de ventas ya no te permita aprobar cada pedido a mano.
4. **Comprimir/optimizar las imagenes** al subirlas, para que la pagina cargue rapido.
5. **Buscador por imagen con IA real**: si mas adelante quieres que reconozca contenido de verdad (no solo color/composicion), se puede integrar un servicio de embeddings con IA como CLIP, Google Vision, o la API de OpenAI — tiene costo por uso, pero es un salto grande en precision.
6. **Sesiones persistentes**: ahora mismo el login usa sesiones en memoria (se borran si el servidor se reinicia). Para un uso mas robusto se puede guardar la sesion en una base de datos o usar JWT con expiracion mas larga.

---

## 14. Estructura del proyecto (por si quieres explorar el codigo)

```
mini-unsplash/
  server.js          <- toda la logica del backend (API)
  package.json       <- dependencias del proyecto
  data/
    images.json      <- "base de datos" de imagenes (incluye el embedding de cada una)
    orders.json      <- "base de datos" de pedidos de compra
  uploads/
    images/          <- vistas previas (PNG/JPG que se ven en la galeria)
    sources/         <- archivos fuente reales (lo que recibe el comprador: PNG, PDF, CDR, etc.)
    proofs/          <- capturas de pago de Yape
  public/
    index.html        <- pagina principal (galeria)
    admin.html         <- panel de administracion
    login.html         <- pantalla de inicio de sesion
    styles.css         <- estilos de toda la web
    app.js             <- logica de la pagina principal
    admin.js           <- logica del panel admin
```

Cualquier duda sobre una parte especifica del codigo, revisa los comentarios dentro de `server.js`, o preguntame directamente cual archivo no entiendes.
