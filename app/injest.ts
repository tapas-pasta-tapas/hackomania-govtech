import { NextRequest, NextResponse } from 'next/server'
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
    const filePath = path.resolve('./data', 'data.json'); // Adjust the path as necessary
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // console.log(jsonData);
    const llmA = new OpenAI({});
    const chainA = loadQAStuffChain(llmA);
    const docs : Document[] = [];
    //code below only need to run once

    // for (const category of jsonData.DUMMYDATA) {
    //     for (const programCategory of category.programs) {
    //         let content = ""
    //         content += programCategory.name + ": \n";
    //         for (const program of programCategory.programs) {
    //              content += program.name + ": " + program.description + program.url + "\n";
    //         }
    //         docs.push(new Document({ pageContent: content }));
    //     }
    // }
    // console.log(docs);
      
    const prompt = "What grants are there and how do I apply for them? Give me links and descriotion for all";

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
    const resultOne = await vectorstore.similaritySearch(prompt, 1)
    //Change Question with prompt
    const resA = await chainA.invoke({
        input_documents: resultOne,
        question: prompt,
      });
      // console.log(resA);
    return resA
  } catch (e: any) {
    return console.error(e)
  }
}
