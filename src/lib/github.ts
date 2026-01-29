const GITHUB_API_BASE =
  "https://api.github.com/repos/CdeB-img/expert-imagerie/contents/public/images";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

export async function listGithubImages(dir: string): Promise<string[]> {
  const res = await fetch(`${GITHUB_API_BASE}/${dir}`);
  if (!res.ok) return [];

  const data = await res.json();

  return data
    .filter((f: any) => f.type === "file" && f.name.endsWith(".png"))
    .map((f: any) => `${RAW_BASE}/${dir}/${f.name}`)
    .sort();
}