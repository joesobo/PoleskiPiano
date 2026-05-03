import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

export interface PracticeSongSaveRequest {
  path: string;
  overwrite: boolean;
  song: {
    title: string;
    scale?: string;
    steps: string[];
  };
}

export interface PracticeSongSaveResponse {
  path: string;
  files: Record<string, string>;
}

export async function listPracticeSongFiles(): Promise<Record<string, string>> {
  const songsDirectory = getSongsDirectory();

  try {
    const entries = await readdir(songsDirectory, { withFileTypes: true });
    const files: Record<string, string> = {};

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json")) {
        continue;
      }

      const path = `songs/${entry.name}`;
      files[path] = await readFile(join(songsDirectory, entry.name), "utf8");
    }

    return files;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function savePracticeSongFile(
  request: unknown,
): Promise<PracticeSongSaveResponse> {
  assertPracticeSongSaveRequest(request);

  const songPath = resolvePracticeSongPath(request.path);
  await mkdir(getSongsDirectory(), { recursive: true });
  await writeFile(songPath, `${JSON.stringify(request.song, null, 2)}\n`, {
    encoding: "utf8",
    flag: request.overwrite ? "w" : "wx",
  });

  return {
    path: normalizePracticeSongPath(request.path),
    files: await listPracticeSongFiles(),
  };
}

export function assertPracticeSongSaveRequest(
  request: unknown,
): asserts request is PracticeSongSaveRequest {
  if (!isRecord(request)) {
    throw new Error("Invalid Practice Song save request");
  }

  if (typeof request.path !== "string" || request.path.length === 0) {
    throw new Error("Practice Song save path is required");
  }

  if (typeof request.overwrite !== "boolean") {
    throw new Error("Practice Song overwrite mode is required");
  }

  if (!isRecord(request.song)) {
    throw new Error("Practice Song payload is required");
  }

  if (
    typeof request.song.title !== "string" ||
    request.song.title.trim().length === 0
  ) {
    throw new Error("Practice Song title is required");
  }

  if (
    !Array.isArray(request.song.steps) ||
    request.song.steps.length === 0 ||
    !request.song.steps.every((step) => typeof step === "string")
  ) {
    throw new Error("Practice Song steps are required");
  }
}

function getSongsDirectory(): string {
  return join(process.cwd(), "songs");
}

function resolvePracticeSongPath(path: string): string {
  const normalizedPath = normalizePracticeSongPath(path);
  const filename = basename(normalizedPath);
  const resolvedPath = join(getSongsDirectory(), filename);
  const relativePath = relative(getSongsDirectory(), resolvedPath);

  if (
    relativePath.startsWith("..") ||
    relativePath.includes("/") ||
    relativePath.includes("\\") ||
    !filename.toLowerCase().endsWith(".json")
  ) {
    throw new Error("Invalid Practice Song path");
  }

  return resolvedPath;
}

function normalizePracticeSongPath(path: string): string {
  return `songs/${basename(path)}`;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
