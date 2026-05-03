export interface PracticeSongFileApi {
  listPracticeSongs?: () => Promise<Record<string, string>>;
  savePracticeSong?: (
    request: PracticeSongFileSaveRequest,
  ) => Promise<PracticeSongFileSaveResponse>;
}

export interface PracticeSongFileSaveRequest {
  path: string;
  overwrite: boolean;
  song: {
    title: string;
    scale?: string;
    steps: string[];
  };
}

export interface PracticeSongFileSaveResponse {
  path: string;
  files: Record<string, string>;
}

type Fetcher = typeof fetch;

const practiceSongsEndpoint = "/__poleski-piano/practice-songs";

export async function listPracticeSongFiles(
  api: PracticeSongFileApi | null | undefined = window.poleskiPiano,
  fetcher: Fetcher = fetch,
): Promise<Record<string, string>> {
  if (api?.listPracticeSongs) {
    return api.listPracticeSongs();
  }

  return fetchJson<Record<string, string>>(practiceSongsEndpoint, fetcher);
}

export async function savePracticeSongFile(
  request: PracticeSongFileSaveRequest,
  api: PracticeSongFileApi | null | undefined = window.poleskiPiano,
  fetcher: Fetcher = fetch,
): Promise<PracticeSongFileSaveResponse> {
  if (api?.savePracticeSong) {
    return api.savePracticeSong(request);
  }

  return fetchJson<PracticeSongFileSaveResponse>(
    `${practiceSongsEndpoint}/save`,
    fetcher,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}

async function fetchJson<T>(
  url: string,
  fetcher: Fetcher,
  init?: RequestInit,
): Promise<T> {
  const response = await fetcher(url, init);

  if (!response.ok) {
    const message = await readErrorMessage(response);

    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;

    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch {
    // Fall through to a generic message when the server returns non-JSON.
  }

  return "Practice Song saving is unavailable";
}
