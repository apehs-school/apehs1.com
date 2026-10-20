export function PageBody({ body, formal = false }: { body: string; formal?: boolean }) {
  const blocks = body
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const bullets = lines.length > 0 && lines.every((line) => line.startsWith("- "));
        if (bullets) {
          return (
            <ul className={formal ? undefined : "list-disc space-y-1 pl-5"} key={block}>
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        if (lines[0]?.startsWith("## ")) {
          return (
            <div key={block}>
              <h3>{lines[0].slice(3)}</h3>
              {lines.slice(1).length > 0 ? <p>{lines.slice(1).join("\n")}</p> : null}
            </div>
          );
        }
        return (
          <p key={block}>
            {lines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
