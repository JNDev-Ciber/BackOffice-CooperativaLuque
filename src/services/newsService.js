import { supabase } from "../supabaseClient";

const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

export function getFileType(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function uploadFileToStorage(file) {
  if (getFileType(file) === "video" && file.size > MAX_VIDEO_SIZE) {
    throw new Error("El video no puede superar los 30 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "cooperativa_luque_unsigned"); 
  formData.append("folder", "cooperativa-de-luque/noticias");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error subiendo archivo a Cloudinary");

  const json = await res.json();
  return {
    fileName: json.public_id,
    fileUrl: json.secure_url,
    fileType: getFileType(file),
    fileSize: file.size,
  };
}

export async function deleteFilesFromStorage(newsId) {
  const { data: existing } = await supabase
    .from("news_images")
    .select("file_name")
    .eq("news_id", newsId);
  if (existing?.length) {
    await supabase.storage
      .from("news_images")
      .remove(existing.map((x) => x.file_name));
  }
}

export async function rpcCreateNews(payload) {
  const { data, error } = await supabase.rpc("create_news", payload).select();
  if (error) throw error;
  return data;
}

export async function rpcUpdateNews(newsId, payload) {
  const { error } = await supabase.rpc("update_news", {
    p_news_id: newsId,
    ...payload,
    p_replace_images: false,
  });
  if (error) throw error;
}

export async function rpcDeleteNews(newsId) {
  const { error } = await supabase.rpc("delete_news", { p_news_id: newsId });
  if (error) throw error;
}

export async function rpcTogglePublished(newsId, publish) {
  const { error } = await supabase.rpc("toggle_news_published", {
    p_news_id: newsId,
    p_publish: Boolean(publish),
  });
  if (error) throw error;
}

export async function rpcUploadNewsFile(
  newsId,
  fileName,
  fileUrl,
  fileType,
  fileSize,
  isCover
) {
  const { error } = await supabase.rpc("upload_news_file", {
    p_news_id: newsId,
    p_file_name: fileName,
    p_file_url: fileUrl,
    p_file_type: fileType,
    p_file_size: fileSize,
    p_is_cover: isCover,
  });
  if (error) throw error;
}

export async function rpcDeleteNewsFiles(newsId) {
  await deleteFilesFromStorage(newsId);
  const { error } = await supabase
    .from("news_images")
    .delete()
    .eq("news_id", newsId);
  if (error) throw error;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNews() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNewsImages(newsId) {
  const { data, error } = await supabase
    .from("news_images")
    .select("*")
    .eq("news_id", newsId)
    .order("is_cover", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
