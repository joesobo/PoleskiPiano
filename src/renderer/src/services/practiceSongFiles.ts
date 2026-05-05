export interface PracticeSongFileApi {
  listPracticeSongs?: () => Promise<Record<string, string>>;
  savePracticeSong?: (
    request: PracticeSongFileSaveRequest,
  ) => Promise<PracticeSongFileSaveResponse>;
}

export interface PracticeSongFileSaveRequest {
  path: string;
  overwrite: boolean;
  contents: string;
}

export interface PracticeSongFileSaveResponse {
  path: string;
  files: Record<string, string>;
}

export async function listPracticeSongFiles(
  api: PracticeSongFileApi | null | undefined = window.poleskiPiano,
): Promise<Record<string, string>> {
  if (api?.listPracticeSongs) {
    return api.listPracticeSongs();
  }

  throw new Error("Practice Song file bridge unavailable");
}

export async function savePracticeSongFile(
  request: PracticeSongFileSaveRequest,
  api: PracticeSongFileApi | null | undefined = window.poleskiPiano,
): Promise<PracticeSongFileSaveResponse> {
  if (api?.savePracticeSong) {
    return api.savePracticeSong(request);
  }

  throw new Error("Practice Song file bridge unavailable");
}
