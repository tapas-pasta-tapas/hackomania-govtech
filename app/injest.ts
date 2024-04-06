import { NextRequest, NextResponse } from 'next/server'
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  loadQAStuffChain,
  loadQAMapReduceChain,
  loadQARefineChain
} from 'langchain/chains'
import { createClient } from '@supabase/supabase-js'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings, OpenAI } from '@langchain/openai'
import { Document } from 'langchain/document'
import fs from 'fs'
import path from 'path'

interface Program {
  name: string
  description: string
  url: string
}

interface ProgramCategory {
  name: string
  programs: Program[]
}

interface Category {
  category: string
  programs: ProgramCategory[]
}

// Assuming `json` is of the following type
interface DataJson {
  data: Category[]
}

export async function injest() {
  // get body from jsonfile on data/data.json
  const filePath = path.resolve('../hackomania-govtech/data', 'data.json') // Adjust the path as necessary
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  console.log(jsonData)
  // const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  //     chunkSize: 256,
  //     chunkOverlap: 20,
  //   });
  const llmA = new OpenAI({})
  const chainA = loadQAStuffChain(llmA)
  const text = jsonData?.data
    ?.map((category: Category) =>
      category.programs
        .map(program => program.programs.map(p => p.description).join('\n'))
        .join('\n\n')
    )
    .join('\n\n')
  const docs = [new Document({ pageContent: text })]

  const resA = await chainA.invoke({
    input_documents: docs,
    question:
      'What grants are there and how do I apply for them? Give me links and descriotion for all'
  })
  // console.log(resA);

  // console.log(text);

  // const splitDocuments = await splitter.createDocuments([text]);

  try {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    )

    const vectorstore = await SupabaseVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: 'documents',
        queryName: 'match_documents'
      }
    )
    const resultOne = await vectorstore.similaritySearch('grant', 1)
    console.log(resultOne)

    return console.log('done injesting data' + resultOne)
  } catch (e: any) {
    return console.error(e)
  }
}
