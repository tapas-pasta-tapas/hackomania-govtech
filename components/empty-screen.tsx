import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold text-blue-300">
          Welcome to Gov Analysis Chatbot!
        </h1>
        <p className="leading-normal text-muted-foreground">
          This chatbot app uses Retrieval Augmented Generation (RAG) and is built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://sdk.vercel.ai">
            Vercel AI SDK
          </ExternalLink>
          ,{' '}
          <ExternalLink href="https://vercel.com/storage/kv">
            Vercel KV
          </ExternalLink>
          and uses{' '}
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            React Server Components
          </ExternalLink>{' '}
          alongside
          <ExternalLink href="https://www.langchain.com/">
            LangChain
          </ExternalLink>{' '} for advanced NLP, with the data managed by our
          <ExternalLink href="https://supabase.com/">
            Supabase
          </ExternalLink>{' '}
          vector store.
        </p>
        <p className="leading-normal text-muted-foreground">
          Feel free to ask me queries related to <span className="font-bold">government initiatives</span> for businesses.
        </p>
      </div>
    </div>
  )
}
