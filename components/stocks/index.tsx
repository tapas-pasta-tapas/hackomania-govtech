'use client'

import dynamic from 'next/dynamic'
import { StocksSkeleton } from './stocks-skeleton'

export { spinner } from './spinner'
export { BotCard, BotMessage, SystemMessage } from './message'

const Stocks = dynamic(() => import('./grants').then(mod => mod.Grants), {
  ssr: false,
  loading: () => <StocksSkeleton />
})

export { Stocks }
