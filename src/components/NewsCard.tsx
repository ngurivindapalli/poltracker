export default function NewsCard({ article }: { article: any }) {
  return (
    <div className="news-card">
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="news-image"
        />
      )}

      <div className="news-content">
        <div className="news-source">
          {article.source?.name}
        </div>

        <h3 className="news-title">
          {article.title}
        </h3>

        <p className="news-description">
          {article.description}
        </p>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-link"
        >
          Read Article →
        </a>
      </div>
    </div>
  )
}
