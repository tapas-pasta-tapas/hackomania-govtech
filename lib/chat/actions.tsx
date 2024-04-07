import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
} from '@/components/stocks'

import { z } from 'zod'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Grants } from '@/components/stocks/grants'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'
import { userMessagePrompt } from '../promptEngineering'

const DUMMYDATA = [
  {
    "category": "grants",
    "programs": [
      {
        "name": "Grants for Startups",
        "programs": [
          {
            "name": "Startup SG Founder",
            "description": "Provides mentorship and startup capital grant of S$50,000 to first-time entrepreneurs with innovative business ideas. Startups are required to commit S$10,000 as co-matching fund to the grant.",
            "url": "https://www.startupsg.gov.sg/programmes/4894/startup-sg-founder"
          },
          {
            "name": "Startup SG Tech",
            "description": "Supports Proof-of-Concept (POC) and Proof-of-Value (POV) for commercialisation of innovative technologies.",
            "url": "https://www.startupsg.gov.sg/programmes/4897/startup-sg-tech"
          }
        ]
      },
      {
        "name": "Adopt Technology to Digitise My Business",
        "programs": [
          {
            "name": "Operation & Technology Roadmap (OTR)",
            "description": "Development of technology roadmaps to map out priorities aligned with businesses’ strategies and developmental plans. Eligible SMEs may receive up to 70% funding support.",
            "url": "https://www.a-star.edu.sg/Collaborate/programmes-for-smes/Operation-Technology-Roadmap"
          },
          {
            "name": "Productivity Solutions Grant (PSG)",
            "description": "Supports businesses in the adoption of productivity solutions. Businesses can choose from a list of pre-scoped solutions and receive up to 50% funding support for eligible costs.",
            "url": "https://www.gobusiness.gov.sg/productivity-solutions-grant/"
          },
          {
            "name": "Start Digital",
            "description": "SMEs new to using digital technology can adopt any 2 solutions e.g. Digital Marketing, Digital Collaboration, Accounting, HR/Payroll, Cybersecurity, etc., at no cost for at least 6 months (min. 18 months contract).",
            "url": "https://www.imda.gov.sg/StartDigital"
          },
          {
            "name": "Technology for Enterprise Capability Upgrading (T-Up)",
            "description": "Get access to talents from A*STAR’s Research Institutes and build in-house R&D capabilities.",
            "url": "https://www.a-star.edu.sg/Collaborate/programmes-for-smes/Technology-for-Enterprise-Capability-Upgrading"
          }
        ]
      },
      {
        "name": "Bring My Business Overseas",
        "programs": [
          {
            "name": "Career Trial",
            "description": "Allows companies to assess jobseekers’ job fit through a short-term trial, before formal employment. Government will provide training allowance to the jobseekers for the trial period (up to 3 months).",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/career-trial-employers.html"
          },
          {
            "name": "Jobs Growth Incentive (JGI)",
            "description": "The Jobs Growth Incentive (JGI) was announced on 17 Aug 2020 to encourage employers to accelerate their hiring of local workforce by providing wage support, so as to create good and long-term jobs for locals.",
            "url": "https://www.go.gov.sg/jgi"
          },
          {
            "name": "Productivity Solutions Grant (PSG)",
            "description": "The PSG supports businesses in the adoption of productivity solutions. Businesses can choose from a list of pre-scoped solutions and receive up to 50% funding support for eligible costs.",
            "url": "https://www.gobusiness.gov.sg/productivity-solutions-grant/"
          },
          {
            "name": "Senior Employment Credit",
            "description": "No application is required. The Senior Employment Credit provides wage offsets to help employers that employ workers aged 55 and above adjust to the higher Retirement Age and Re-employment Age.",
            "url": "https://go.gov.sg/sec-cto-eec"
          },
          {
            "name": "SkillsFuture Work-Study Programmes (WSPs)",
            "description": "Businesses can groom and hire fresh talent through Work-Study Programmes across Certificate, Diploma, Post-Diploma, and Degree levels. Businesses will jointly design and deliver with Institutes of Higher Learning (IHLs) and appointed private providers.",
            "url": "https://www.gobusiness.gov.sg/enterprisejobskills/programmes-and-initiatives/recruit-talent/skillsfuture-work-study-programmes/"
          },
          {
            "name": "Start Digital",
            "description": "SMEs new to using digital technology can adopt any 2 solutions e.g. Digital Marketing, Digital Collaboration, Accounting, HR/Payroll, Cybersecurity, etc., at no cost for at least 6 months (min. 18 months contract).",
            "url": "https://www.imda.gov.sg/StartDigital"
          },
          {
            "name": "Wage Credit Scheme",
            "description": "No application is required. The government provides co-funding of wage increments for Singaporean employees earning a gross monthly wage of up to $5,000.",
            "url": "https://www.iras.gov.sg/irasHome/wcs.aspx"
          }
        ]
      },
      {
        "name": "Hire, Train, and Upskill Employees",
        "programs": [
          {
            "name": "e-Adviser for Skills Training",
            "description": "For business owners to get personalised recommendations on skills training courses and SkillsFuture initiatives relevant to your business as part of the SkillsFuture Movement.",
            "url": "https://eadviser.gobusiness.gov.sg/skillstraining?src=govassist_grants"
          },
          {
            "name": "SkillsFuture for Enterprise User Guide",
            "description": "Check out the 5 key steps to get started on your SkillsFuture journey",
            "url": "https://www.gobusiness.gov.sg/skillsfuture-for-enterprise/?src=govassist_grants"
          },
          {
            "name": "Career Trial",
            "description": "Allows companies to assess jobseekers’ job fit through a short-term trial, before formal employment. Government will provide training allowance to the jobseekers for the trial period (up to 3 months).",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/career-trial-employers.html"
          },
          {
            "name": "Citrep+",
            "description": "Build ICT technical skills for your employees in areas such as cyber security, data analytics, network and infrastructure and software development. Funding support of up to 90%.",
            "url": "https://www.imda.gov.sg/imtalent/programmes/citrep-plus"
          },
          {
            "name": "Company-Led Training (CLT) Programme",
            "description": "CLT accelerates professional development through on-the-job training programme for fresh to mid-level professionals acquiring competencies for jobs in demand by industry, especially the Digital Economy sector.",
            "url": "https://www.imda.gov.sg/programme-listing/TechSkills-Accelerator-TeSA/Company-Led-Training-Programme-CLT"
          },
          {
            "name": "Employment Support for Ex-Offenders",
            "description": "This programme supports companies to tap on ex-offenders as an alternative pool of trained and skilled workers.",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/employment-support-for-employers-to-hire-ex-offenders.html"
          },
          {
            "name": "Employment Support for Persons with Disabilities",
            "description": "Hire, train and integrate Persons with Disabilities into the workforce. Receive course fee subsidies of up to 90% for SG Enable’s list of curated training courses.",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/employment-support-for-persons-with-disabilities.html"
          },
          {
            "name": "Enabling Employment Credit",
            "description": "The Enabling Employment Credit provides wage offsets to employers hiring persons with disabilities.",
            "url": "https://go.gov.sg/sec-cto-eec"
          },
          {
            "name": "Enhanced Training Support for SMEs (ETSS)",
            "description": "The ETSS offers higher course fee grant of up to 90% of the course fees and absentee payroll funding of 80% of basic hourly salary at a higher cap of $7.50 per hour for SMEs signing up for SSG-supported courses. With effect from 1 Jan 2022, SSG will introduce a fixed absentee payroll rate of $4.50 per hour, capped at $100,000 per organisation annually.",
            "url": "https://www.gobusiness.gov.sg/enterprisejobskills/programmes-and-initiatives/upgrade-skills/course-fee-absentee-payroll-funding/"
          },
          {
            "name": "Jobs Growth Incentive (JGI)",
            "description": "The Jobs Growth Incentive (JGI) was announced on 17 Aug 2020 to encourage employers to accelerate their hiring of local workforce by providing wage support, so as to create good and long-term jobs for locals.",
            "url": "https://www.go.gov.sg/jgi"
          },
          {
            "name": "Part-Time Re-employment Grant (PTRG)",
            "description": "Provides funding support to companies that voluntarily commit to providing part-time re-employment to all eligible seniors who request for it.",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/senior-worker-early-adopter-grant-and-part-time-re-employment-grant-employers.html"
          },
          {
            "name": "SkillsFuture Work-Study Programmes (WSPs)",
            "description": "Businesses can groom and hire fresh talent through Work-Study Programmes across Certificate, Diploma, Post-Diploma, and Degree levels. Businesses will jointly design and deliver with Institutes of Higher Learning (IHLs) and appointed private providers.",
            "url": "https://www.gobusiness.gov.sg/enterprisejobskills/programmes-and-initiatives/recruit-talent/skillsfuture-work-study-programmes/"
          },
          {
            "name": "Uplifting Employment Credit",
            "description": "The Uplifting Employment Credit provides wage offsets to employers hiring ex-offenders.",
            "url": "https://www.go.gov.sg/uec"
          }
        ]
      },
      {
        "name": "Improve My Customer Experience",
        "programs": [
          {
            "name": "Productivity Solutions Grant (PSG)",
            "description": "Supports businesses in the adoption of productivity solutions. Businesses can choose from a list of pre-scoped solutions and receive up to 50% funding support for eligible costs.",
            "url": "https://www.gobusiness.gov.sg/productivity-solutions-grant/"
          }
        ]
      },
      {
        "name": "Improve My Financial Management",
        "programs": [
          {
            "name": "Progressive Wage Credit Scheme",
            "description": "Provides transitional support to employers for Progressive Wages moves, by co-funding wage increases of lower-wage workers between 2022 and 2026.",
            "url": "https://go.gov.sg/askpwcs"
          },
          {
            "name": "Startup SG Founder",
            "description": "Provides mentorship and startup capital grant of S$50,000 to first-time entrepreneurs with innovative business ideas. Startups are required to commit S$10,000 as co-matching fund to the grant.",
            "url": "https://www.startupsg.gov.sg/programmes/4894/startup-sg-founder"
          }
        ]
      },
      {
        "name": "Improve My Operational Processes",
        "programs": [
          {
            "name": "3R Fund",
            "description": "Supports companies and organisations registered in Singapore to implement waste minimisation and recycling projects to reduce solid waste sent for disposal.",
            "url": "https://www.nea.gov.sg/programmes-grants/grants-and-awards/3r-fund"
          },
          {
            "name": "Productivity Solutions Grant (PSG)",
            "description": "Supports businesses in the adoption of productivity solutions. Businesses can choose from a list of pre-scoped solutions and receive up to 50% funding support for eligible costs.",
            "url": "https://www.gobusiness.gov.sg/productivity-solutions-grant/"
          },
          {
            "name": "Water Efficiency Fund (WEF)",
            "description": "Provides funding to local non-domestic water users to enable them to improve water efficiency through water efficiency assessment, pilot study, recycling, adoption of water efficient equipment & industrial water solution demonstration projects.",
            "url": "https://www.pub.gov.sg/savewater/atwork/efficiencymeasures"
          }
        ]
      },
      {
        "name": "Improve Working Arrangements",
        "programs": [
          {
            "name": "Part-Time Re-employment Grant (PTRG)",
            "description": "Provides funding support to companies that voluntarily commit to providing part-time re-employment to all eligible seniors who request for it.",
            "url": "https://www.wsg.gov.sg/programmes-and-initiatives/senior-worker-early-adopter-grant-and-part-time-re-employment-grant-employers.html"
          },
          {
            "name": "Productivity Solutions Grant (PSG)",
            "description": "Supports businesses in the adoption of productivity solutions. Businesses can choose from a list of pre-scoped solutions and receive up to 50% funding support for eligible costs.",
            "url": "https://www.gobusiness.gov.sg/productivity-solutions-grant/"
          }
        ]
      }        
    ]
  }
]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const ui = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: userMessagePrompt + JSON.stringify(DUMMYDATA)
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    functions: {
      viewGrants: {
        description: 'List three government grants.',
        parameters: z.object({
          grants: z.array(
            z.object({
              name: z.string().describe('The name of the grant'),
              description: z.string().describe('The description of the grant'),
              link: z.string().describe('The link to the grant')
            })
          )
        }),
        render: async function* ({ grants }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'viewGrants',
                content: JSON.stringify(grants)
              }
            ]
          })

          return (
            <BotCard>
              <Grants props={grants} />
            </BotCard>
          )
        }
      },
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'viewGrants' ? (
            <BotCard>
              <Grants props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
