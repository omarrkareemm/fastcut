export function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const seg = <span>{items.map((t, i) => <span key={i}><i>◢</i>{t}</span>)}</span>;
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" style={reverse ? { animationDirection: 'reverse' } : undefined}>{seg}{seg}</div>
    </div>
  );
}