import { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';
import type { BoundaryResponse } from '@/lib/appApi';
import { loadBoundary } from '@/core/api';
import { F, usePalette } from '@/core/theme';

type Area = Extract<BoundaryResponse, { ok: true }>;

// The voting area, drawn (Romily's choice E, the map first): the ONS outline on an apricot ground, with the main roads
// and place names around it so people can tell where it is. All of it comes from whatsittome.org (the roads and names
// from OpenStreetMap, fetched by the server), so the phone never contacts a map service and it draws offline from the
// saved copy. Credits are behind the (i) on Home and on the Sources screen. Decorative to screen readers: the area is
// named in words next to it.
export function AreaMap({ ballotId, height, top = 96 }: { ballotId: string | null; height: number; top?: number }) {
  const c = usePalette();
  const { width } = useWindowDimensions();
  const [got, setGot] = useState<{ id: string; area: Area } | null>(null);
  const area = got && got.id === ballotId ? got.area : null;

  useEffect(() => {
    let live = true;
    if (ballotId) loadBoundary(ballotId).then((r) => { if (live) setGot({ id: ballotId, area: r.data }); }, () => { /* the ground alone */ });
    return () => { live = false; };
  }, [ballotId]);

  // Equirectangular, corrected for latitude, with the outline fitted between the pill above and the sheet below.
  const drawn = useMemo(() => {
    if (!area?.rings.length) return null;
    const pts = area.rings.flat();
    const lat0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const xs = pts.map((p) => p[0] * k), ys = pts.map((p) => -p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = 40, bottom = 72;
    const scale = Math.min((width - padX * 2) / (maxX - minX || 1), (height - top - bottom) / (maxY - minY || 1));
    const ox = (width - (maxX - minX) * scale) / 2, oy = top + (height - top - bottom - (maxY - minY) * scale) / 2;
    const xy = ([lng, lat]: [number, number]): [number, number] => [ox + (lng * k - minX) * scale, oy + (-lat - minY) * scale];
    const path = (line: [number, number][], close = false) => line.map((p, i) => { const [x, y] = xy(p); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('') + (close ? 'Z' : '');
    const onScreen = ([x, y]: [number, number]) => x > 8 && x < width - 8 && y > top - 8 && y < height - 40;

    const roads = (area.roads ?? []).map((r) => ({ d: path(r.line), major: r.kind === 'major' }));

    // Labels: place names, then one road number per road, skipping any that would overlap or sit under the pill.
    const boxes: [number, number, number, number][] = [];
    const free = (b: [number, number, number, number]) => !boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    const labels: { x: number; y: number; text: string; big: boolean }[] = [];
    for (const pl of area.places ?? []) {
      const [x, y] = xy(pl.at);
      const big = pl.kind === 'town' || pl.kind === 'city';
      const w = pl.name.length * (big ? 7.6 : 6.6) + 6, h = big ? 18 : 16;
      const b: [number, number, number, number] = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      if (!onScreen([x, y]) || b[0] < 4 || b[2] > width - 4 || !free(b) || labels.length >= 8) continue;
      boxes.push(b);
      labels.push({ x, y, text: pl.name, big });
    }
    const refs: { x: number; y: number; text: string; w: number }[] = [];
    const seen = new Set<string>();
    for (const r of area.roads ?? []) {
      if (!r.ref || seen.has(r.ref) || r.line.length < 2) continue;
      const mid = xy(r.line[Math.floor(r.line.length / 2)]);
      const w = r.ref.length * 7 + 12;
      const b: [number, number, number, number] = [mid[0] - w / 2, mid[1] - 9, mid[0] + w / 2, mid[1] + 9];
      if (!onScreen(mid) || !free(b) || refs.length >= 4) continue;
      seen.add(r.ref);
      boxes.push(b);
      refs.push({ x: mid[0], y: mid[1], text: r.ref, w });
    }
    return { outline: area.rings.map((r) => path(r, true)).join(''), roads, labels, refs };
  }, [area, width, height, top]);

  return (
    <View style={{ width, height, backgroundColor: c.mapGround }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M28 0H0V28" fill="none" stroke={c.mapGrid} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
        {drawn ? (
          <G>
            {drawn.roads.map((r, i) => <Path key={`c${i}`} d={r.d} fill="none" stroke={c.roadCasing} strokeWidth={r.major ? 7 : 5} strokeLinecap="round" strokeLinejoin="round" />)}
            {drawn.roads.map((r, i) => <Path key={`r${i}`} d={r.d} fill="none" stroke={c.road} strokeWidth={r.major ? 4.5 : 3} strokeLinecap="round" strokeLinejoin="round" />)}
            <Path d={drawn.outline} fill={c.mapFill} fillOpacity={0.5} stroke={c.mapEdge} strokeWidth={2.5} strokeLinejoin="round" />
            {drawn.refs.map((r) => (
              <G key={r.text}>
                <Rect x={r.x - r.w / 2} y={r.y - 9} width={r.w} height={18} rx={4} fill={c.panel} stroke={c.muted} strokeWidth={1} />
                <SvgText x={r.x} y={r.y + 4} fontSize={11} fontFamily={F.bold} fill={c.soft} textAnchor="middle">{r.text}</SvgText>
              </G>
            ))}
            {drawn.labels.map((l) => (
              <G key={l.text}>
                <SvgText x={l.x} y={l.y + 4} fontSize={l.big ? 13 : 11.5} fontFamily={l.big ? F.bold : F.semi} fill="none" stroke={c.mapGround} strokeWidth={3.5} strokeLinejoin="round" textAnchor="middle">{l.text}</SvgText>
                <SvgText x={l.x} y={l.y + 4} fontSize={l.big ? 13 : 11.5} fontFamily={l.big ? F.bold : F.semi} fill={c.soft} textAnchor="middle">{l.text}</SvgText>
              </G>
            ))}
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
