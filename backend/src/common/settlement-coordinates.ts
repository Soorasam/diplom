export type Coordinates = { lat: number; lng: number };

const SETTLEMENT_COORDS: Record<string, Coordinates> = {
  'с. Хандыга': { lat: 62.653, lng: 135.572 },
  'с. Батагай': { lat: 67.655, lng: 134.638 },
  'с. Вилюйск': { lat: 63.445, lng: 120.317 },
  'с. Оймякон': { lat: 63.464, lng: 142.773 },
};

export function coordsForSettlementName(name: string): Coordinates {
  return SETTLEMENT_COORDS[name] ?? { lat: 62.0, lng: 129.0 };
}

export function hubCoordsForRouteTitle(title: string): Coordinates {
  if (title.includes('Нерюнгри')) {
    return { lat: 56.668, lng: 124.711 };
  }
  if (title.includes('Якутск')) {
    return { lat: 62.035, lng: 129.675 };
  }
  return { lat: 62.035, lng: 129.675 };
}

export function hubLabelForRouteTitle(title: string): string {
  const part = title.split('→')[0]?.trim();
  return part && part.length > 0 ? part : 'Пункт отправления';
}
