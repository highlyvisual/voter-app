import { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { loadBoundary } from '@/core/api';
import { usePalette } from '@/core/theme';

// The voting area, drawn (Romily's choice E, the map first): the ONS outline on an apricot ground with a faint grid.
// No map tiles, so nothing about where the phone is goes to a tile server, and it draws offline from the saved copy.
// Layers (crime, schools, housing land, flooding) can be added on top later. Decorative to screen readers: the area is
// named in words next to it.
export function AreaMap({ ballotId, height, top = 96 }: { ballotId: string | null; height: number; top?: number }) {
  const c = usePalette();
  const { width } = useWindowDimensions();
  const [got, setGot] = useState<{ id: string; rings: [number, number][][] } | null>(null);
  const rings = got && got.id === ballotId ? got.rings : null;

  useEffect(() => {
    let live = true;
    if (ballotId) loadBoundary(ballotId).then((r) => { if (live) setGot({ id: ballotId, rings: r.data.rings }); }, () => { /* the ground alone */ });
    return () => { live = false; };
  }, [ballotId]);

  // Equirectangular, corrected for latitude, fitted into the box with room for the pill above and the sheet below.
  const d = useMemo(() => {
    if (!rings?.length) return null;
    const pts = rings.flat();
    const lat0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const xs = pts.map((p) => p[0] * k), ys = pts.map((p) => -p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = 40, bottom = 72;
    const scale = Math.min((width - padX * 2) / (maxX - minX || 1), (height - top - bottom) / (maxY - minY || 1));
    const ox = (width - (maxX - minX) * scale) / 2, oy = top + (height - top - bottom - (maxY - minY) * scale) / 2;
    return rings.map((r) => r.map(([x, y], i) => `${i ? 'L' : 'M'}${(ox + (x * k - minX) * scale).toFixed(1)},${(oy + (-y - minY) * scale).toFixed(1)}`).join('') + 'Z').join('');
  }, [rings, width, height, top]);

  return (
    <View style={{ width, height, backgroundColor: c.mapGround }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M28 0H0V28" fill="none" stroke={c.mapGrid} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
        {/* Two soft "roads" so the ground reads as a map before the outline arrives. */}
        <Line x1={-20} y1={height * 0.72} x2={width + 20} y2={height * 0.38} stroke={c.panel} strokeWidth={14} strokeOpacity={0.55} />
        <Line x1={width * 0.18} y1={-20} x2={width * 0.42} y2={height + 20} stroke={c.panel} strokeWidth={8} strokeOpacity={0.45} />
        {d ? <Path d={d} fill={c.mapFill} fillOpacity={0.55} stroke={c.mapEdge} strokeWidth={2.5} strokeLinejoin="round" /> : null}
      </Svg>
    </View>
  );
}
