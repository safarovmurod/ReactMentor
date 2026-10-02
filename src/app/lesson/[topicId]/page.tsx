import { notFound } from 'next/navigation';
import { getTopic } from '@/content/course';
import { LessonView } from '@/components/learning/lesson-view';
export default async function LessonPage({params}:{params:Promise<{topicId:string}>}) {
 const {topicId}=await params;
 if(!getTopic(topicId))notFound();
 return <LessonView topicId={topicId}/>;
}
