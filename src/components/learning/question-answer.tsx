'use client';
import type { LearningQuestion } from '@/content/course';
import { COPY } from '@/lib/i18n';
import { tr } from '@/lib/translate';
import { useLearningStore } from '@/stores/learning-store';
export function QuestionAnswer({question}:{question:LearningQuestion}) {
  const language=useLearningStore(state=>state.language);
  const contentLanguage=useLearningStore(state=>state.contentLanguage);
  const copy=COPY[language];
  return <div className="answer-content" lang={contentLanguage}><p>{tr(question.answer,contentLanguage)}</p>{question.explanation&&question.explanation!==question.answer&&<p className="muted">{tr(question.explanation,contentLanguage)}</p>}{question.code.map((code,index)=><details className="code-detail" key={index}><summary>{copy.code}</summary><pre><code>{code}</code></pre></details>)}<span className="source-label">{copy.source}: {question.source.startsWith('https:')?<a href={question.source} target="_blank" rel="noreferrer">{new URL(question.source).hostname}</a>:question.source} · {question.sourceId}</span></div>;
}
