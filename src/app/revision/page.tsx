'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, Search } from 'lucide-react';
import { LEARNING_TOPICS, topicTitle } from '@/content/course';
import { dateKey } from '@/lib/learning';
import { useLearningStore } from '@/stores/learning-store';
import { COPY } from '@/lib/i18n';
import { PageHeading } from '@/components/learning/page-heading';
export default function RevisionPage() {
 const state=useLearningStore();const copy=COPY[state.language];const [month,setMonth]=useState(0);const [query,setQuery]=useState('');
 const reviews=Object.values(state.reviews);const due=reviews.filter(review=>review.due<=dateKey());
 const topics=LEARNING_TOPICS.filter(topic=>(!month||topic.month===month)&&(topicTitle(topic,state.language)+' '+topic.title).toLowerCase().includes(query.toLowerCase()));
 return <><PageHeading title={copy.revision}/><section className="panel review-banner"><div className="icon-box"><RotateCcw size={22}/></div><div><h2>{copy.reviewDue}</h2><p>{due.length} {copy.questions.toLowerCase()}</p></div><Link className="button primary" href="/study?review=1">{copy.start}<ArrowRight size={17}/></Link></section>
 <section className="panel"><div className="section-heading"><h2>{copy.allTopics}</h2><span className="muted">{LEARNING_TOPICS.length}</span></div><div className="filters"><div className="search-field"><Search size={17}/><input aria-label={copy.search} placeholder={copy.search} value={query} onChange={event=>setQuery(event.target.value)}/></div><select aria-label={copy.selectMonth} value={month} onChange={event=>setMonth(Number(event.target.value))}><option value={0}>{copy.all}</option>{[1,2,3].map(value=><option key={value} value={value}>{copy.month} {value}</option>)}</select></div><div className="topic-list">{topics.map(topic=>{const topicDue=due.filter(item=>item.topicId===topic.id).length;return <Link className="topic-row" key={topic.id} href={'/lesson/'+topic.id}><span className="topic-number">{String(topics.indexOf(topic)+1).padStart(2,'0')}</span><div><strong>{topicTitle(topic,state.language)}</strong><small>{copy.month} {topic.month}{topicDue>0?' · '+topicDue+' '+copy.reviewDue.toLowerCase():''}</small></div><ArrowRight size={17}/></Link>;})}</div></section></>;
}
