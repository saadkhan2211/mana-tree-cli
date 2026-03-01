export const safeName = (name: string) => {
  const s = (name || "project").trim();
  const cleaned = s.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
  return cleaned.slice(0, 60) || "project";
};
