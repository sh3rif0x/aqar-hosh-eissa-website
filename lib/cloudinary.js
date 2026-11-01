const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("CLOUDINARY ERROR:", data);
    throw new Error(data?.error?.message || "فشل رفع الصورة");
  }
  return data.secure_url;
}

export function imgUrl(p, w = 800) {
  if (!p) return "";
  if (p.startsWith("http")) return p.replace("/upload/", `/upload/f_auto,q_auto,w_${w}/`);
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${p}`;
}
