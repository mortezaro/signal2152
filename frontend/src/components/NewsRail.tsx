import type { NewsItem } from "../lib/types";

type Props = {
  items: NewsItem[];
};

export function NewsRail({ items }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Market brief</h2>
        <p>Latest headlines from the backend news feed, ready to sit beside the model layer.</p>
      </div>
      <div className="news-list">
        {items.map((item, index) => (
          <a key={`${item.title}-${index}`} className="news-card" href={item.link ?? "#"} target="_blank" rel="noreferrer">
            <p className="news-source">{item.publisher ?? "Unknown source"}</p>
            <h3>{item.title}</h3>
            <p>{item.summary ?? "Open the article to read more."}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
