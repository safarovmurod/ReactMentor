'use client';
import Link from 'next/link';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { LEARNING_TOPICS, topicTitle } from '@/content/course';
import { useLearningStore } from '@/stores/learning-store';
import { COPY } from '@/lib/i18n';
import { PageHeading } from '@/components/learning/page-heading';
export default function WeakTopicsPage() {
 const state=useLearningStore();const copy=COPY[state.language];
 const latest=new Map<string,(typeof state.answers)[string]>();Object.values(state.answers).sort((a,b)=>a.date.localeCompare(b.date)).forEach(answer=>latest.set(answer.questionId,answer));
 const weak=LEARNING_TOPICS.map(topic=>({topic,wrong:[...latest.values()].filter(answer=>answer.topicId===topic.id&&!answer.correct).length})).filter(item=>item.wrong>0).sort((a,b)=>b.wrong-a.wrong);
 return <><PageHeading title={copy.weak}/><section className="panel">{weak.length===0?<div className="empty-state"><CircleAlert size={28}/><p>{Object.keys(state.answers).length===0?copy.noAttempts:state.language==='ru'?'В последних ответах ошибок нет.':'No mistakes in your latest answers.'}</p><Link className="button primary" href="/tests?daily=1">{copy.tests}</Link></div>:<div className="topic-list">{weak.map(({topic,wrong})=><Link key={topic.id} className="topic-row" href={'/lesson/'+topic.id}><CircleAlert size={20}/><div><strong>{topicTitle(topic,state.language)}</strong><small>{wrong} {copy.incorrect.toLowerCase()}</small></div><ArrowRight size={17}/></Link>)}</div>}</section></>;
}
