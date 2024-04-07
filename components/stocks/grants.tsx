'use client'

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'
import Link from 'next/link'
import { elaboratePrompt } from '@/lib/promptEngineering'
import { ExternalLink } from '../external-link'

interface Grant {
  name: string
  description: string
  link: string
}

export function Grants({ props: grants }: { props: Grant[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm ">
        {grants.map((grant, index) => (
          <button
            key={index}
            className="flex cursor-pointer flex-col w-full gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-700 h-auto"
            onClick={async () => {
              const response = await submitUserMessage(`${elaboratePrompt}: ${grant.name}`)
              setMessages(currentMessages => [...currentMessages, response])
            }}
          >
            <div className="flex flex-col">
              <div className="bold uppercase text-zinc-300">{grant.name}</div>
              <div className="text-base text-zinc-500">
                ${grant.description}
              </div>
            </div>
            <ExternalLink href={grant.link}>
              <Link
                href={grant.link}
                className={`${grant.link ? 'text-green-600' : 'text-red-600'
                  } flex flex-row justify-center hover:underline`}
              >
                {grant.link}
              </Link>
            </ExternalLink>
          </button>
        ))}
      </div>
    </div>
  )
}
