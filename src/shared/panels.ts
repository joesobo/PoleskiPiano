export type PanelId = "scale" | "chord" | "staff" | "fallingNotes";

export interface PanelDefinition {
  id: PanelId;
  label: string;
  size: 1 | 3;
  slot: 0 | 1 | 2;
}

export type PanelVisibility = Record<PanelId, boolean>;

export const PANEL_DEFINITIONS: PanelDefinition[] = [
  {
    id: "scale",
    label: "Scale Wheel",
    size: 1,
    slot: 0,
  },
  {
    id: "chord",
    label: "Chord Display",
    size: 1,
    slot: 1,
  },
  {
    id: "staff",
    label: "Grand Staff",
    size: 1,
    slot: 2,
  },
  {
    id: "fallingNotes",
    label: "Falling Notes",
    size: 3,
    slot: 0,
  },
];

export const DEFAULT_PANEL_VISIBILITY: PanelVisibility = {
  scale: true,
  chord: true,
  staff: true,
  fallingNotes: false,
};
