import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

// ── Helpers ──────────────────────────────────────────────
function generateFileName(file) {
  const ext = file.name.split(".").pop();
  return `${crypto.randomUUID()}.${ext}`;
}

async function uploadImageToStorage(file) {
  const fileName = generateFileName(file);
  const { error } = await supabase.storage
    .from("news_images")
    .upload(fileName, file, { upsert: false });
  if (error) throw error;

  const { data } = supabase.storage
    .from("news_images")
    .getPublicUrl(fileName);

  return { fileName, fileUrl: data.publicUrl };
}

async function insertNewsImage(newsId, fileName, fileUrl, isCover) {
  const { error } = await supabase.from("news_images").insert({
    news_id: newsId,
    file_name: fileName,
    file_url: fileUrl,
    is_cover: isCover,
  });
  if (error) throw error;
}

async function deleteNewsImages(newsId) {
  // Obtener archivos existentes para borrar del storage también
  const { data: existing } = await supabase
    .from("news_images")
    .select("file_name")
    .eq("news_id", newsId);

  if (existing?.length) {
    await supabase.storage
      .from("news_images")
      .remove(existing.map((x) => x.file_name));
  }

  await supabase.from("news_images").delete().eq("news_id", newsId);
}

// ── Componente drop zone ──────────────────────────────────
function ImageDropZone({ files, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(incoming) {
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/")
    );
    onChange((prev) => [...prev, ...valid]);
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
      {/* Zona de drop */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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
        <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
        <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--accent-hover)" }}>
          Arrastrá imágenes acá o hacé click para seleccionar
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
          JPG, PNG, WEBP — La primera imagen será la portada
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview de archivos seleccionados */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: i === 0 ? "2px solid var(--accent)" : "1px solid var(--border)",
                width: 80,
                height: 80,
                flexShrink: 0,
              }}
            >
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {i === 0 && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "var(--accent)", color: "#fff",
                  fontSize: "0.6rem", textAlign: "center", padding: "2px 0", fontWeight: 600,
                }}>
                  PORTADA
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                style={{
                  position: "absolute", top: 3, right: 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, boxShadow: "none",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [newFiles, setNewFiles] = useState([]); // archivos nuevos a subir
  const [existingImages, setExistingImages] = useState([]); // imágenes ya guardadas

  const [deceasedFirstName, setDeceasedFirstName] = useState("");
  const [deceasedDate, setDeceasedDate] = useState("");
  const [deceasedMessage, setDeceasedMessage] = useState("");

  const editingItem = useMemo(
    () => news.find((x) => x.id === editingId) ?? null,
    [news, editingId]
  );

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategoryId("");
    setIsFeatured(false);
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
      const [{ data: cats, error: catErr }, { data: items, error: newsErr }] =
        await Promise.all([
          supabase.from("categories").select("*").order("name", { ascending: true }),
          supabase.from("news").select("*").order("created_at", { ascending: false }),
        ]);
      if (catErr) throw catErr;
      if (newsErr) throw newsErr;
      setCategories(cats ?? []);
      setNews(items ?? []);
    } catch (e) {
      setError(e?.message ?? "Error cargando noticias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function startEdit(item) {
    setEditingId(item.id);
    setTitle(item.title ?? "");
    setContent(item.content ?? "");
    setCategoryId(item.category_id ?? "");
    setIsFeatured(Boolean(item.is_featured));
    setNewFiles([]);
    setDeceasedFirstName(item.deceased_first_name ?? "");
    setDeceasedDate(item.deceased_date ?? "");
    setDeceasedMessage(item.deceased_message ?? "");

    // Cargar imágenes existentes
    const { data: imgs } = await supabase
      .from("news_images")
      .select("*")
      .eq("news_id", item.id)
      .order("is_cover", { ascending: false });
    setExistingImages(imgs ?? []);
  }

  async function onCreateOrUpdate(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      p_title: title.trim(),
      p_content: content.trim(),
      p_category_id: categoryId || null,
      p_is_featured: Boolean(isFeatured),
      p_images: [],
      p_deceased_first_name: deceasedFirstName.trim() || null,
      p_deceased_date: deceasedDate || null,
      p_deceased_message: deceasedMessage.trim() || null,
    };

    if (!payload.p_title || !payload.p_content) {
      setError("Título y contenido son obligatorios");
      return;
    }

    setLoading(true);
    try {
      let newsId;

      if (!editingItem) {
        // Crear noticia
        const { data, error: err } = await supabase
          .rpc("create_news", payload)
          .select();
        if (err) throw err;
        newsId = data;
      } else {
        // Actualizar noticia
        const { error: err } = await supabase.rpc("update_news", {
          p_news_id: editingItem.id,
          ...payload,
          p_replace_images: false,
        });
        if (err) throw err;
        newsId = editingItem.id;

        // Si hay archivos nuevos, borrar los viejos primero
        if (newFiles.length > 0) {
          await deleteNewsImages(newsId);
        }
      }

      // Subir imágenes nuevas
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          const { fileName, fileUrl } = await uploadImageToStorage(newFiles[i]);
          await insertNewsImage(newsId, fileName, fileUrl, i === 0);
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
    const ok = window.confirm(`Eliminar noticia "${item.title}"?`);
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      await deleteNewsImages(item.id);
      const { error: err } = await supabase.rpc("delete_news", { p_news_id: item.id });
      if (err) throw err;
      await load();
    } catch (e) {
      setError(e?.message ?? "Error eliminando noticia");
    } finally {
      setLoading(false);
    }
  }

  async function onTogglePublished(item) {
    const next = !(item.published ?? item.is_published ?? item.published_at);
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.rpc("toggle_news_published", {
        p_news_id: item.id,
        p_publish: Boolean(next),
      });
      if (err) throw err;
      await load();
    } catch (e) {
      setError(e?.message ?? "Error cambiando estado de publicación");
    } finally {
      setLoading(false);
    }
  }

  function categoryNameFor(id) {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name ?? "-";
  }

  const isPublished = (it) =>
    Boolean(it.published ?? it.is_published ?? it.published_at);

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", textAlign: "left" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Noticias</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>

        {/* ── Formulario ── */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          boxShadow: "var(--shadow-sm)",
          alignSelf: "start",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-h)" }}>
              {editingItem ? "Editar noticia" : "Nueva noticia"}
            </div>
            {editingItem && (
              <button type="button" onClick={resetForm} disabled={loading}>
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={onCreateOrUpdate} style={{ display: "grid", gap: 12 }}>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Título</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Contenido</span>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Categoría</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span style={{ fontSize: "0.875rem" }}>Destacada</span>
            </label>

            {/* Imágenes */}
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Imágenes
                {editingItem && existingImages.length > 0 && newFiles.length === 0
                  ? " — subir nuevas reemplazará las actuales"
                  : ""}
              </span>

              {/* Miniaturas existentes (modo edición) */}
              {editingItem && existingImages.length > 0 && newFiles.length === 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                  {existingImages.map((img, i) => (
                    <div key={img.id} style={{
                      position: "relative", width: 72, height: 72, borderRadius: "var(--radius-sm)",
                      overflow: "hidden", border: img.is_cover ? "2px solid var(--accent)" : "1px solid var(--border)",
                      flexShrink: 0,
                    }}>
                      <img src={img.file_url} alt={img.file_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {img.is_cover && (
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          background: "var(--accent)", color: "#fff",
                          fontSize: "0.58rem", textAlign: "center", padding: "2px 0", fontWeight: 600,
                        }}>
                          PORTADA
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <ImageDropZone files={newFiles} onChange={setNewFiles} />
            </div>

            {/* Difuntos */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "grid", gap: 10 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Campos opcionales — Funebres
              </div>

              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Nombre</span>
                <input value={deceasedFirstName} onChange={(e) => setDeceasedFirstName(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Fecha (opcional)</span>
                <input type="date" value={deceasedDate} onChange={(e) => setDeceasedDate(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Mensaje</span>
                <textarea value={deceasedMessage} onChange={(e) => setDeceasedMessage(e.target.value)} rows={3} />
              </label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingItem ? "Guardar cambios" : "Crear noticia"}
            </button>
          </form>

          {error && (
            <div style={{
              border: "1px solid var(--error-border)", background: "var(--error-bg)",
              borderRadius: "var(--radius-md)", padding: "10px 12px", marginTop: 12,
              color: "#b91c1c", fontSize: "0.85rem",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Tabla de noticias ── */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
          alignSelf: "start",
        }}>
          {/* Header tabla */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 100px 110px 200px",
            padding: "10px 14px",
            background: "var(--social-bg)",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            gap: 10,
            borderBottom: "1px solid var(--border)",
          }}>
            <div>Título</div>
            <div>Categoría</div>
            <div>Destacada</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>

          {loading && news.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)", fontSize: "0.875rem" }}>Cargando...</div>
          )}
          {!loading && news.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)", fontSize: "0.875rem" }}>Sin noticias todavía</div>
          )}

          {news.map((it) => {
            const published = isPublished(it);
            return (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 130px 100px 110px 200px",
                  padding: "10px 14px",
                  borderTop: "1px solid var(--border)",
                  gap: 10,
                  alignItems: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = ""}
              >
                <div style={{ fontWeight: 500, color: "var(--text-h)", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.title}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {categoryNameFor(it.category_id)}
                </div>
                <div style={{ fontSize: "0.8rem" }}>
                  {it.is_featured ? (
                    <span style={{
                      background: "var(--lime-dim)", color: "#6b7a00",
                      border: "1px solid rgba(207,227,32,0.45)",
                      borderRadius: 999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 600,
                    }}>Sí</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>No</span>
                  )}
                </div>
                <div>
                  <span style={{
                    background: published ? "var(--accent-dim)" : "#f0f2f1",
                    color: published ? "var(--accent-hover)" : "var(--text-muted)",
                    border: `1px solid ${published ? "rgba(1,152,117,0.25)" : "var(--border)"}`,
                    borderRadius: 999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                  }}>
                    {published ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => startEdit(it)}
                    disabled={loading}
                    style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onTogglePublished(it)}
                    disabled={loading}
                    style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                  >
                    {published ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    onClick={() => onDelete(it)}
                    disabled={loading}
                    className="btn-danger"
                    style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}