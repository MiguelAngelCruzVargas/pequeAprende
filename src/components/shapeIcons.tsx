// Íconos de formas básicas (2-4 años), compartidos entre ShapesGame y
// ConnectGame para que una figura se vea EXACTAMENTE igual en los dos
// juegos. Antes ConnectGame usaba emoji de sistema (⚪ ▬ 🥚...) que se
// renderizan distinto según el dispositivo y no heredan color — por eso
// se veían fuera de lugar y a veces eran difíciles de distinguir.
// Se dibujan como paths sólidos (fill="currentColor") para que se vean
// como bloques de juguete y hereden el color de texto del botón (blanco).
export const CircleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="35" /></svg>
);
export const SquareIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><rect x="20" y="20" width="60" height="60" rx="10" /></svg>
);
export const TriangleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,14 L88,82 a5,5 0 0,1 -4.3,7.5 h-67.4 a5,5 0 0,1 -4.3,-7.5 z" /></svg>
);
export const RectangleIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><rect x="10" y="28" width="80" height="44" rx="8" /></svg>
);
export const HeartIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,88 C15,62 2,42 2,25 C2,8 18,-2 34,8 C41,13 46,19 50,27 C54,19 59,13 66,8 C82,-2 98,8 98,25 C98,42 85,62 50,88 z" /></svg>
);
export const StarIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,4 L62,37 L98,37 L69,58 L80,92 L50,71 L20,92 L31,58 L2,37 L38,37 z" /></svg>
);
export const OvalIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><ellipse cx="50" cy="50" rx="44" ry="28" /></svg>
);
export const RhombusIcon = (props: any) => (
  <svg {...props} viewBox="0 0 100 100" fill="currentColor"><path d="M50,6 L94,50 L50,94 L6,50 z" /></svg>
);

export const SHAPE_ICONS: Record<string, (props: any) => any> = {
  circle: CircleIcon,
  square: SquareIcon,
  triangle: TriangleIcon,
  rectangle: RectangleIcon,
  heart: HeartIcon,
  star: StarIcon,
  oval: OvalIcon,
  rhombus: RhombusIcon,
};
