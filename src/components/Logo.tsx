// Logo EMZEE — imaginea reală (PNG transparent).
// `mark` = doar marca EMZEE (fără caseta STUDIO), pentru spații mici (sidebar).
export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mark ? "/logo-mark.png" : "/logo.png"}
      alt="EMZEE"
      className={className}
      style={{ objectFit: "contain", width: "auto" }}
      draggable={false}
    />
  );
}
