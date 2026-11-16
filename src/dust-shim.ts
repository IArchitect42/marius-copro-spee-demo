// Remplace useFile de Dust : charge le fichier depuis /assets/<nom> s'il existe.
import { useEffect, useState } from "react";
export function useFile(id: string): Blob | null {
  const [blob, setBlob] = useState<Blob | null>(null);
  useEffect(() => {
    const name = id.split("/").pop();
    fetch(`${import.meta.env.BASE_URL}assets/${name}`).then(r => (r.ok && !(r.headers.get("content-type")||"").includes("text/html") ? r.blob() : null)).then(b => b && setBlob(b)).catch(() => {});
  }, [id]);
  return blob;
}
