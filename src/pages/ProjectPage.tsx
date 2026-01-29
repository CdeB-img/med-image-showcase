// src/pages/ProjectPage.tsx

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProjectById } from "@/data/projects";
import { listGithubImages } from "@/lib/github";
import SliceViewer from "@/components/SliceViewer";

const ProjectPage = () => {
  const { id } = useParams();
  const project = getProjectById(id!);

  const [stacks, setStacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) return;

    async function load() {
      const resolved = await Promise.all(
        project.imageDirs.map(async (dir) => ({
          id: dir.id,
          label: dir.label,
          slices: await listGithubImages(dir.path),
        }))
      );

      setStacks(resolved);
      setLoading(false);
    }

    load();
  }, [project]);

  if (!project) {
    return <p className="text-red-500">Projet introuvable</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{project.title}</h1>

      {loading ? (
        <p className="text-muted-foreground">Chargement des images…</p>
      ) : stacks.every(s => s.slices.length === 0) ? (
        <p className="text-red-500">No images</p>
      ) : (
        <SliceViewer
          stacks={stacks}
        />
      )}
    </div>
  );
};

export default ProjectPage;