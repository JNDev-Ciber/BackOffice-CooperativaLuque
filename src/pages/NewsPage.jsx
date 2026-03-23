import { useEffect, useMemo, useRef, useState } from "react";
import {
  uploadFileToStorage,
  getFileType,
  rpcCreateNews,
  rpcUpdateNews,
  rpcDeleteNews,
  rpcTogglePublished,
  rpcUploadNewsFile,
  rpcDeleteNewsFiles,
  fetchCategories,
  fetchNews,
  fetchNewsImages,
} from "../services/newsService";

const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

// ── Drop zone ─────────────────────────────────────────────
function FileDropZone({ files, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);

  function handleFiles(incoming) {
    setValidationError(null);
    const arr = Array.from(incoming);
    const invalid = arr.filter(
      (f) => !f.type.startsWith("image/") && f.type !== "video/mp4",
    );
    if (invalid.length) {
      setValidationError("Solo se permiten imágenes o videos MP4.");
      return;
    }
    const oversized = arr.find(
      (f) => f.type === "video/mp4" && f.size > MAX_VIDEO_SIZE,
    );
    if (oversized) {
      setValidationError("El video no puede superar los 30 MB.");
      return;
    }
    onChange((prev) => [...prev, ...arr]);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }
  function removeFile(idx) {
    onChange((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--accent-mid)"}`,
          borderRadius: "var(--radius-md)",
          padding: "28px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--accent-dim)" : "var(--accent-light)",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️🎬</div>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--accent-hover)",
          }}
        >
          Arrastrá archivos acá o hacé click para seleccionar
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          JPG, PNG, WEBP — MP4 hasta 30 MB · La primera imagen será la portada
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {validationError && (
        <div style={{ color: "#b91c1c", fontSize: "0.8rem" }}>
          {validationError}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {files.map((f, i) => {
            const isVideo = f.type === "video/mp4";
            const isFirstImage =
              !isVideo && files.findIndex((x) => x.type !== "video/mp4") === i;
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: isFirstImage
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  width: 80,
                  height: 80,
                  flexShrink: 0,
                  background: isVideo ? "var(--bg-2)" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isVideo ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28 }}>🎬</div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--text-muted)",
                        padding: "0 4px",
                      }}
                    >
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                {isFirstImage && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: "0.6rem",
                      textAlign: "center",
                      padding: "2px 0",
                      fontWeight: 600,
                    }}
                  >
                    PORTADA
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    boxShadow: "none",
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Fila de tabla ─────────────────────────────────────────
function NewsRow({ item, loading, categoryName, onEdit, onDelete }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);

  useEffect(() => {
    fetchNewsImages(item.id).then((imgs) => {
      if (imgs.length > 0) {
        setFileUrl(imgs[0].file_url);
        setFileType(imgs[0].file_type);
      }
    });
  }, [item.id]);

  const fecha = item.deceased_date
    ? new Date(item.deceased_date).toLocaleDateString("es-AR")
    : "-";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 140px 120px 140px",
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        gap: 10,
        alignItems: "center",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--accent-light)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <div
        style={{
          fontWeight: 500,
          color: "var(--text-h)",
          fontSize: "0.875rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.deceased_first_name || item.title}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        {fecha}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        {categoryName}
      </div>
      <div style={{ fontSize: "0.8rem" }}>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--accent-hover)",
              textDecoration: "underline",
              fontSize: "0.78rem",
            }}
          >
            {fileType === "video" ? "🎬 Ver video" : "🖼️ Ver imagen"}
          </a>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>Sin archivo</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onEdit}
          disabled={loading}
          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="btn-danger"
          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export default function NewsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [news, setNews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deceasedFirstName, setDeceasedFirstName] = useState("");
  const [deceasedDate, setDeceasedDate] = useState("");
  const [deceasedMessage, setDeceasedMessage] = useState("");

  const editingItem = useMemo(
    () => news.find((x) => x.id === editingId) ?? null,
    [news, editingId],
  );

  const filteredNews = useMemo(
    () =>
      filterCategoryId
        ? news.filter((n) => n.category_id === filterCategoryId)
        : news,
    [news, filterCategoryId],
  );

  const isFunebre = categories
    .find((c) => c.id === categoryId)
    ?.name?.toLowerCase()
    .includes("fúnebre");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategoryId("");
    setNewFiles([]);
    setExistingImages([]);
    setDeceasedFirstName("");
    setDeceasedDate("");
    setDeceasedMessage("");
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [cats, items] = await Promise.all([fetchCategories(), fetchNews()]);
      setCategories(cats);
      setNews(items);
    } catch (e) {
      setError(e?.message ?? "Error cargando noticias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function startEdit(item) {
    setEditingId(item.id);
    setTitle(item.title ?? "");
    setContent(item.content ?? "");
    setCategoryId(item.category_id ?? "");
    setNewFiles([]);
    setDeceasedFirstName(item.deceased_first_name ?? "");
    setDeceasedDate(item.deceased_date ?? "");
    setDeceasedMessage(item.deceased_message ?? "");
    const imgs = await fetchNewsImages(item.id);
    setExistingImages(imgs);
  }

  async function onCreateOrUpdate(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      p_title: title.trim(),
      p_content: content.trim(),
      p_category_id: categoryId || null,
      p_is_featured: true,
      p_images: [],
      p_deceased_first_name: deceasedFirstName.trim() || null,
      p_deceased_date: deceasedDate || null,
      p_deceased_message: deceasedMessage.trim() || null,
    };

    if (!isFunebre && (!payload.p_title || !payload.p_content)) {
      setError("Título y contenido son obligatorios");
      return;
    }
    if (isFunebre && !payload.p_deceased_first_name) {
      setError("El nombre del difunto es obligatorio");
      return;
    }

    setLoading(true);
    try {
      let newsId;
      if (!editingItem) {
        newsId = await rpcCreateNews(payload);
        await rpcTogglePublished(newsId, true);
      } else {
        await rpcUpdateNews(editingItem.id, payload);
        newsId = editingItem.id;
        if (newFiles.length > 0) await rpcDeleteNewsFiles(newsId);
      }

      if (newFiles.length > 0) {
        const imageFiles = newFiles.filter((f) => getFileType(f) === "image");
        for (const file of newFiles) {
          const { fileName, fileUrl, fileType, fileSize } =
            await uploadFileToStorage(file);
          const isCover =
            getFileType(file) === "image" && imageFiles[0] === file;
          await rpcUploadNewsFile(
            newsId,
            fileName,
            fileUrl,
            fileType,
            fileSize,
            isCover,
          );
        }
      }

      resetForm();
      await load();
    } catch (e2) {
      setError(e2?.message ?? "Error guardando noticia");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(item) {
    if (
      !window.confirm(`Eliminar "${item.deceased_first_name || item.title}"?`)
    )
      return;
    setError(null);
    setLoading(true);
    try {
      await rpcDeleteNewsFiles(item.id);
      await rpcDeleteNews(item.id);
      await load();
    } catch (e) {
      setError(e?.message ?? "Error eliminando");
    } finally {
      setLoading(false);
    }
  }

  function categoryNameFor(id) {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name ?? "-";
  }

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Noticias</h2>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}
      >
        {/* ── Formulario ── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            boxShadow: "var(--shadow-sm)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--text-h)",
              }}
            >
              {editingItem ? "Editar noticia" : "Nueva noticia"}
            </div>
            {editingItem && (
              <button type="button" onClick={resetForm} disabled={loading}>
                Cancelar
              </button>
            )}
          </div>

          <form
            onSubmit={onCreateOrUpdate}
            style={{ display: "grid", gap: 12 }}
          >
            <label style={{ display: "grid", gap: 5 }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                Fecha
              </span>
              <input
                type="date"
                value={deceasedDate}
                onChange={(e) => setDeceasedDate(e.target.value)}
              />
            </label>

            {/* Categoría — siempre primero */}
            <label style={{ display: "grid", gap: 5 }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                Categoría
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {isFunebre ? (
              <>
                <label style={{ display: "grid", gap: 5 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                    }}
                  >
                    Nombre del difunto
                  </span>
                  <input
                    value={deceasedFirstName}
                    onChange={(e) => setDeceasedFirstName(e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 5 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                    }}
                  >
                    Mensaje
                  </span>
                  <textarea
                    value={deceasedMessage}
                    onChange={(e) => setDeceasedMessage(e.target.value)}
                    rows={3}
                  />
                </label>
              </>
            ) : (
              <>
                <label style={{ display: "grid", gap: 5 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                    }}
                  >
                    Título
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 5 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                    }}
                  >
                    Contenido
                  </span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                  />
                </label>
              </>
            )}

            {/* Archivos — siempre visible */}
            <div style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                {isFunebre ? "Foto del difunto" : "Archivos"}
                {editingItem &&
                existingImages.length > 0 &&
                newFiles.length === 0
                  ? " — subir nuevos reemplazará los actuales"
                  : ""}
              </span>

              {editingItem &&
                existingImages.length > 0 &&
                newFiles.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {existingImages.map((img) => (
                      <div
                        key={img.id}
                        style={{
                          position: "relative",
                          width: 72,
                          height: 72,
                          borderRadius: "var(--radius-sm)",
                          overflow: "hidden",
                          border: img.is_cover
                            ? "2px solid var(--accent)"
                            : "1px solid var(--border)",
                          flexShrink: 0,
                          background:
                            img.file_type === "video"
                              ? "var(--bg-2)"
                              : undefined,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {img.file_type === "video" ? (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 24 }}>🎬</div>
                            <div
                              style={{
                                fontSize: "0.58rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              VIDEO
                            </div>
                          </div>
                        ) : (
                          <img
                            src={img.file_url}
                            alt={img.file_name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        {img.is_cover && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "var(--accent)",
                              color: "#fff",
                              fontSize: "0.58rem",
                              textAlign: "center",
                              padding: "2px 0",
                              fontWeight: 600,
                            }}
                          >
                            PORTADA
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              <FileDropZone files={newFiles} onChange={setNewFiles} />
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : editingItem
                  ? "Guardar cambios"
                  : "Crear noticia"}
            </button>
          </form>

          {error && (
            <div
              style={{
                border: "1px solid var(--error-border)",
                background: "var(--error-bg)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                marginTop: 12,
                color: "#b91c1c",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ── Tabla ── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Filtrar:
            </span>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              style={{ fontSize: "0.8rem", padding: "4px 8px" }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 140px 120px 140px",
              padding: "10px 14px",
              background: "var(--social-bg)",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              gap: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>Título / Nombre</div>
            <div>Fecha</div>
            <div>Categoría</div>
            <div>Archivo</div>
            <div>Acciones</div>
          </div>

          {loading && news.length === 0 && (
            <div
              style={{
                padding: 16,
                color: "var(--text-muted)",
                fontSize: "0.875rem",
              }}
            >
              Cargando...
            </div>
          )}
          {!loading && news.length === 0 && (
            <div
              style={{
                padding: 16,
                color: "var(--text-muted)",
                fontSize: "0.875rem",
              }}
            >
              Sin noticias todavía
            </div>
          )}

          {filteredNews.map((it) => (
            <NewsRow
              key={it.id}
              item={it}
              loading={loading}
              categoryName={categoryNameFor(it.category_id)}
              onEdit={() => startEdit(it)}
              onDelete={() => onDelete(it)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
