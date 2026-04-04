type FeedCardProps = {
    title: string;
    category: string;
    timestamp: string;
    summary: string;
};

const placeholderCards: FeedCardProps[] = Array.from({ length: 5 }, () => ({
    title: "Game Day Highlights: Panthers vs. Lions",
    category: "Breaking News",
    timestamp: "Posted 2 hours ago",
    summary:
        "Quick recap from tonight's matchup with key plays, standout performances, and what it means for next week's rankings.",
}));

export default function Feed() {
    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
            {placeholderCards.map((card, index) => (
                <SportsFeedCard
                    key={`${card.title}-${index}`}
                    title={card.title}
                    category={card.category}
                    timestamp={card.timestamp}
                    summary={card.summary}
                />
            ))}
        </section>
    );
}

function SportsFeedCard({ title, category, timestamp, summary }: FeedCardProps) {
    return (
        <article className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
                <div
                    className="h-16 w-16 shrink-0 rounded-md bg-gray-200"
                    aria-label="Placeholder image"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {category}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{timestamp}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{summary}</p>
                </div>
            </div>
        </article>
    );
}