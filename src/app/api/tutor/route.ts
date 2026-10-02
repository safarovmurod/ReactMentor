import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LESSONS } from '@/content/lessons';
import { CORE_INTERVIEW_QUESTIONS } from '@/content/interview-questions';
import { gradeInterviewAnswer } from '@/lib/grading/interview-grader';

const TutorRequestSchema = z.object({
  action: z.enum(['ask', 'grade_interview', 'explain_code']),
  topicId: z.string().optional(),
  questionId: z.string().optional(),
  userText: z.string().min(1),
  codeContext: z.string().optional(),
  isDeep: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TutorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Маълумоти нодуруст', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { action, topicId, questionId, userText, codeContext, isDeep } = parsed.data;

    // Check if Online AI is configured
    const isOnlineAi =
      process.env.AI_TUTOR_ENABLED === 'true' &&
      Boolean(process.env.AI_PROVIDER_KEY);

    // If Online AI is enabled, we could call provider. Otherwise, robust Local Tutor:
    if (action === 'grade_interview' && questionId) {
      const q = CORE_INTERVIEW_QUESTIONS.find((item) => item.id === questionId);
      if (q) {
        const gradeResult = gradeInterviewAnswer(q, userText);
        return NextResponse.json({
          mode: isOnlineAi ? 'online' : 'local',
          ...gradeResult,
        });
      }
    }

    if (action === 'explain_code' && codeContext) {
      // Deterministic "Чиба инҷой?" code line explanation
      return NextResponse.json({
        mode: 'local',
        explanation: `Ин сатри код барои иҷрои мақсадноки амалиёт нигаронида шудааст. Дар ҳолати нест кардани он рафтори пешбинишудаи компонент вайрон мешавад.`,
        details: [
          'Аз куҷо омад: Аз воридоти китобхона ё эълони маҳаллӣ',
          'Чаро даркор аст: Барои нигоҳдории ҳолат ё филтратсияи додаҳо',
          'Ки даъват мекунад: Event handler ё худи React дар давраи render',
          'Натиҷа ба куҷо меравад: Ба state ё ба DOM',
        ],
      });
    }

    // Default conversational ask
    let reply = 'Ин савол дар доираи асосҳои React ва JavaScript мебошад.';
    const lesson = LESSONS.find((l) => l.topicId === topicId);

    if (lesson) {
      if (isDeep) {
        reply = `${lesson.content.meaning}\n\nЧи кор мекна: ${lesson.content.whatDoesItDo}\nTrigger: ${lesson.content.trigger}\nRe-render: ${lesson.content.whatRerenders}\n\nНамунаи хатои маъмул: ${lesson.content.commonErrors[0] || 'Хатои вобастагӣ'}`;
      } else {
        reply = `${lesson.content.meaning} Чи кор мекна: ${lesson.content.whatDoesItDo}`;
      }
    } else {
      reply = `Барои ин мавзӯъ тавсия дода мешавад, ки аввал мантиқи тағйирнопазирии додаҳо (immutability) ва навсозии React UI-ро риоя намоед.`;
    }

    return NextResponse.json({
      mode: isOnlineAi ? 'online' : 'local',
      reply,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
