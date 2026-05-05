import {
  DEFAULT_PANEL_VISIBILITY,
  PANEL_DEFINITIONS,
  type PanelId,
  type PanelVisibility,
} from "../../shared/panels";

export interface PanelManagerState {
  visibility: PanelVisibility;
  recency: PanelId[];
}

const panelDefinitionsById = new Map(
  PANEL_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function createInitialPanelManagerState(): PanelManagerState {
  return {
    visibility: { ...DEFAULT_PANEL_VISIBILITY },
    recency: PANEL_DEFINITIONS.filter(
      (definition) => DEFAULT_PANEL_VISIBILITY[definition.id],
    ).map((definition) => definition.id),
  };
}

export function togglePanel(
  state: PanelManagerState,
  panelId: PanelId,
): PanelManagerState {
  return setPanelVisibility(state, panelId, !state.visibility[panelId]);
}

export function setPanelVisibility(
  state: PanelManagerState,
  panelId: PanelId,
  isVisible: boolean,
): PanelManagerState {
  if (!isVisible) {
    return {
      visibility: {
        ...state.visibility,
        [panelId]: false,
      },
      recency: state.recency.filter((id) => id !== panelId),
    };
  }

  const visibility = {
    ...state.visibility,
    [panelId]: true,
  };
  const recency = [...state.recency.filter((id) => id !== panelId), panelId];

  return fitPanels({
    visibility,
    recency,
  }, panelId);
}

function fitPanels(
  state: PanelManagerState,
  requestedPanelId: PanelId,
): PanelManagerState {
  const visibility = { ...state.visibility };
  let recency = [...state.recency];

  while (!panelsFit(visibility)) {
    const oldestVisiblePanelId = recency.find(
      (panelId) => panelId !== requestedPanelId && visibility[panelId],
    );

    if (!oldestVisiblePanelId) {
      break;
    }

    visibility[oldestVisiblePanelId] = false;
    recency = recency.filter((panelId) => panelId !== oldestVisiblePanelId);
  }

  return {
    visibility,
    recency,
  };
}

function panelsFit(visibility: PanelVisibility): boolean {
  const visibleDefinitions = PANEL_DEFINITIONS.filter(
    (definition) => visibility[definition.id],
  );
  const fullWidthPanel = visibleDefinitions.find(
    (definition) => definition.size === 3,
  );

  if (fullWidthPanel) {
    return visibleDefinitions.length === 1;
  }

  const occupiedSlots = new Set<number>();

  for (const definition of visibleDefinitions) {
    const panelDefinition = panelDefinitionsById.get(definition.id);

    if (!panelDefinition || occupiedSlots.has(panelDefinition.slot)) {
      return false;
    }

    occupiedSlots.add(panelDefinition.slot);
  }

  return true;
}
