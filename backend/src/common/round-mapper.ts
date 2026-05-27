import { Prisma } from '@prisma/client';

export const roundWaypointsInclude = {
  waypoints: {
    orderBy: { sortOrder: 'asc' as const },
    include: { pickupPoint: true },
  },
} satisfies Prisma.RoundInclude;

export type RoundWithWaypoints = Prisma.RoundGetPayload<{
  include: typeof roundWaypointsInclude;
}>;

export const buildRouteTitleFromWaypoints = (
  waypoints: { pickupPoint: { name: string }; sortOrder: number }[],
): string => {
  const sorted = [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((w) => w.pickupPoint.name).join(' → ');
};

export const resolveRoundRouteTitle = (round: {
  routeTitle?: string | null;
  title?: string | null;
  waypoints?: { pickupPoint: { name: string }; sortOrder: number }[];
}): string => {
  if (round.routeTitle?.trim()) return round.routeTitle.trim();
  if (round.waypoints?.length) return buildRouteTitleFromWaypoints(round.waypoints);
  return round.title?.trim() || 'Маршрут';
};

export const attachVirtualRoute = <T extends RoundWithWaypoints>(round: T) => {
  const chainTitle = resolveRoundRouteTitle(round);
  return {
    ...round,
    routeId: round.id,
    route: {
      id: round.id,
      title: chainTitle,
      transportType: round.transportType,
      createdByUserId: round.createdByUserId,
    },
  };
};
