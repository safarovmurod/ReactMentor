import { NextResponse } from 'next/server';
import { z } from 'zod';
import { QUIZ_QUESTIONS } from '@/content/course';
const schema=z.object({questionId:z.string().max(100),answer:z.string().max(10000)});
export async function POST(request:Request) {
  let body:unknown;
  try {body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'Invalid answer'},{status:400});
  const question=QUIZ_QUESTIONS.find(item=>item.id===parsed.data.questionId);
  if(!question)return NextResponse.json({error:'Question not found'},{status:404});
  if(!question.options.includes(parsed.data.answer))return NextResponse.json({error:'Unknown option'},{status:400});
  return NextResponse.json({questionId:question.id,correct:question.answer===parsed.data.answer,answer:question.answer});
}
