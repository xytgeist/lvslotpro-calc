import LoungeMarketChartMini from './LoungeMarketChartMini.jsx'
import { marketEmbedCacheKey, normalizeMarketEmbeds } from '../../utils/loungeMarketCaptionParse.js'
import { useLoungeMarketFeedQuotes } from './LoungeMarketFeedContext.jsx'

/**
 * @param {{ post: object, onOpenChart?: (embed: object, allEmbeds: object[]) => void, className?: string }} props
 */
export default function LoungeMarketChartStrip({ post, onOpenChart, className = '' }) {
  const embeds = normalizeMarketEmbeds(post?.market_embeds)
  const { quotes } = useLoungeMarketFeedQuotes()
  if (!embeds.length) return null

  return (
    <div
      className={`mt-2 -mx-1 overflow-x-auto overscroll-x-contain [touch-action:pan-x] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex snap-x snap-mandatory gap-2 px-1 pb-0.5">
        {embeds.map((embed) => {
          const key = marketEmbedCacheKey(embed)
          return (
            <LoungeMarketChartMini
              key={`${embed.symbol}-${embed.window_key}-${embed.kind}`}
              embed={embed}
              rollingLive={embed.kind === 'rolling' ? quotes[key] : null}
              onOpen={() => onOpenChart?.(embed, embeds)}
            />
          )
        })}
      </div>
    </div>
  )
}
