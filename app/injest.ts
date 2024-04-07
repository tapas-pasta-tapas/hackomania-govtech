import { NextRequest, NextResponse } from "next/server";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
    loadQAStuffChain,
    loadQAMapReduceChain,
    loadQARefineChain,
  } from "langchain/chains"
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, OpenAI } from "@langchain/openai";
import { Document } from "langchain/document";
import fs from 'fs';
import path from 'path';

interface Program {
    name: string;
    description: string;
    url: string;
  }
  
  interface ProgramCategory {
    name: string;
    programs: Program[];
  }
  
  interface Category {
    category: string;
    programs: ProgramCategory[];
  }
  
  // Assuming `json` is of the following type
  interface DataJson {
    data: Category[];
  }
  

export async function injest() {
    // get body from jsonfile on data/data.json
    const filePath = path.resolve('../hackomania-govtech/data', 'data.json'); // Adjust the path as necessary
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(jsonData);
    // const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    //     chunkSize: 256,
    //     chunkOverlap: 20,
    //   });
    let grantsForStartupsText = '';
let adoptTechnologyText = '';
let bringBusinessOverseasText = '';
let hireTrainUpskillText = '';
let improveCustomerExperienceText = '';
let ImproveMyCustomerExperienceText = '';
let ImproveMyFinancialManagementText = '';

    const llmA = new OpenAI({});
    const chainA = loadQAStuffChain(llmA);
    jsonData.DUMMYDATA[0].programs.forEach((program:any) => {
        // Extract the name of the program
        const programName = program.name;
        
        // Extract the description of the program
        const description = program.programs.map((p : any) => p.description).join('\n');
        
        // Check if the program is one of the desired grants and store its description accordingly
        if (programName === 'Grants for Startups') {
            grantsForStartupsText = description;
        } else if (programName === 'Adopt Technology to Digitise My Business') {
            adoptTechnologyText = description;
        } else if (programName === 'Bring My Business Overseas') {
            bringBusinessOverseasText = description;
        } else if (programName === 'Hire, Train, and Upskill Employees') {
            hireTrainUpskillText = description;
        } else if (programName === 'Improve My Customer Experience') {
            improveCustomerExperienceText = description;
        } else if (programName === 'Improve My Financial Management') {
            ImproveMyFinancialManagementText = description;
        } else if (programName === 'Improve My Customer Experience') {
            ImproveMyCustomerExperienceText = description;
        } 
    });
    const docs = [
        new Document({ pageContent: grantsForStartupsText }),
        new Document({ pageContent: adoptTechnologyText }),
        new Document({ pageContent: grantsForStartupsText }),
        new Document({ pageContent: bringBusinessOverseasText }),
        new Document({ pageContent: hireTrainUpskillText }),
        new Document({ pageContent: improveCustomerExperienceText }),
        new Document({ pageContent: ImproveMyCustomerExperienceText }),
        new Document({ pageContent: ImproveMyFinancialManagementText }),

      ];
      
    const resA = await chainA.invoke({
        input_documents: docs,
        question: "What grants are there and how do I apply for them? Give me links and descriotion for all",
      });
    // console.log(resA);

    // console.log(text);

    // const splitDocuments = await splitter.createDocuments([text]);
    
    try {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );

    const vectorstore = await SupabaseVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings(),
        {
          client,
          tableName: "documents",
          queryName: "match_documents",
        },
      );
      const resultOne = await vectorstore.similaritySearch('grant', 1)
      console.log(resultOne);


    return console.log('done injesting data' + resultOne);
  } catch (e: any) {
    return console.error(e);
  }
}

