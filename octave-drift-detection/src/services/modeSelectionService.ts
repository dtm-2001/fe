export interface ModeSelectionEntry {
  user: string;
  businessUnit: string;
  useCase: string;
  mode: string;
  alertKeeper: string;    // ← new
}

let cachedData: ModeSelectionEntry[] | null = null;

export async function fetchModeSelectionData(): Promise<ModeSelectionEntry[]> {
  if (cachedData) {
    return cachedData;
  }
  const response = await fetch('/api/mode-selection-data', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch mode selection data');
  }
  const data: ModeSelectionEntry[] = await response.json();
  cachedData = data;
  return data;
}

export interface UserUseCase {
  businessUnit: string;
  name: string;        // `${businessUnit}-${useCase}`
  mode: string;
  type: string;        // mapped from mode
  alertKeeper: string; // carried through
}

export async function getUseCasesForUser(
  user: string
): Promise<UserUseCase[]> {
  const data = await fetchModeSelectionData();
  const userEntries = data.filter(entry => entry.user === user);

  const modeTypeMap: Record<string, string> = {
    mode1: "OCTAVE RGCD",
    mode2: "Other RG",
    mode3: "OCTAVE CLCD",
    mode4: "Other CL",
  };

  return userEntries.map(entry => ({
    businessUnit: entry.businessUnit,
    name: `${entry.businessUnit}-${entry.useCase}`,
    mode: entry.mode,
    type: modeTypeMap[entry.mode] || "Default",
    alertKeeper: entry.alertKeeper
  }));
}
