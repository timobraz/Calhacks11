import { config } from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

config(); // Load environment variables

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

const genAI = new GoogleGenerativeAI(apiKey);

const schema = {
  description: "Instructions based on the given input and prompt using a screenshot.",
  type: SchemaType.OBJECT,
  properties: {
    input: {
      type: SchemaType.STRING,
      description: "Text input describing the context or content of the screenshot.",
      nullable: false,
    },
    taskPrompt: {
      type: SchemaType.STRING,
      description: "Text prompt describing the task to be performed based on the screenshot.",
      nullable: false,
    },
    instructions: {
      type: SchemaType.ARRAY,
      description: "A list of instructions to complete the task using the screenshot.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          stepNumber: {
            type: SchemaType.INTEGER,
            description: "The number indicating the step order.",
            nullable: false,
          },
          action: {
            type: SchemaType.STRING,
            description: "The action to be taken in this step.",
            nullable: false,
          },
          details: {
            type: SchemaType.STRING,
            description: "Additional details or information for this step.",
            nullable: true,
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: "Confidence score for this instruction (0-1).",
            nullable: false,
          },
        },
        required: ["stepNumber", "action", "confidence"],
      },
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "Explanation of the model's thought process.",
      nullable: false,
    },
    alternatives: {
      type: SchemaType.ARRAY,
      description: "Alternative approaches to complete the task.",
      items: {
        type: SchemaType.STRING,
      },
    },
    nextSteps: {
      type: SchemaType.ARRAY,
      description: "Suggested follow-up actions.",
      items: {
        type: SchemaType.STRING,
      },
    },
  },
  required: ["input", "taskPrompt", "instructions", "reasoning", "alternatives", "nextSteps"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const input = formData.get('input') as string;
  const taskPrompt = formData.get('taskPrompt') as string;
  const screenshot = formData.get('screenshot');
  const context = formData.get('context') as string;
  const userPreferences = JSON.parse(formData.get('userPreferences') as string);
  const previousActions = JSON.parse(formData.get('previousActions') as string);
  
  console.log('Input:', input);
  console.log('Task Prompt:', taskPrompt);
  console.log('Screenshot type:', typeof screenshot);
  console.log('Screenshot value:', screenshot);
  console.log('Context:', context);
  console.log('User Preferences:', userPreferences);
  console.log('Previous Actions:', previousActions);

  if (!input || !taskPrompt || !screenshot) {
    return NextResponse.json({ error: "Input, taskPrompt, and screenshot are required." }, { status: 400 });
  }

  if (!(screenshot instanceof Blob)) {
    return NextResponse.json({ error: "Screenshot must be a file." }, { status: 400 });
  }

  try {
    const imageData = await screenshot.arrayBuffer();
    // const prompt = `Given the following input: "${input}" and task: "${taskPrompt}", generate step-by-step instructions based on the provided screenshot.`;
    const prompt = `Given the following input: "${input}", task: "${taskPrompt}", and context: "${context}", generate detailed step-by-step instructions based on the provided screenshot. Consider the user preferences: ${JSON.stringify(userPreferences)} and previous actions: ${JSON.stringify(previousActions)}. Provide a confidence score for each instruction, explain your reasoning, suggest alternatives, and recommend next steps. If you encounter any ambiguities or potential errors, please highlight them.`;

    const result = await model.generateContent([prompt, {
      inlineData: {
        mimeType: screenshot.type,
        data: Buffer.from(imageData).toString('base64')
      }
    }]);
    
    const text = await result.response.text();
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Error generating content:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Error generating content",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}