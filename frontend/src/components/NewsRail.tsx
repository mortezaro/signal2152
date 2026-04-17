import type { NewsItem } from "../lib/types";

type Props = {
  items: NewsItem[];
};

function formatPublished(value?: string | null): string {
  if (!value) return "Fresh";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fresh";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function NewsRail({ items }: Props) {
  const [lead, ...rest] = items;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Market brief</h2>
        <p>Headline flow for the tape, with enough structure to read the mood without opening five finance tabs.</p>
      </div>

      <div className="news-layout">
        {lead ? (
          <a className="news-card news-card-lead" href={lead.link ?? "#"} target="_blank" rel="noreferrer">
            <p className="news-source">
              {lead.publisher ?? "Unknown source"} · {formatPublished(lead.published_at)}
            </p>
            <h3>{lead.title}</h3>
            <p>{lead.summary ?? "Open the article to read more."}</p>
          </a>
        ) : null}

        <div className="news-list">
          {rest.map((item, index) => (
            <a key={`${item.title}-${index}`} className="news-card" href={item.link ?? "#"} target="_blank" rel="noreferrer">
              <p className="news-source">
                {item.publisher ?? "Unknown source"} · {formatPublished(item.published_at)}
              </p>
              <h3>{item.title}</h3>
              <p>{item.summary ?? "Open the article to read more."}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
