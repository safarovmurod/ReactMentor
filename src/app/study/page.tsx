import { StudySession } from '@/components/learning/study-session';
import { SessionHub } from '@/components/learning/session-hub';
import { sessionConfig } from '@/lib/session-config';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const config=sessionConfig('learn',await searchParams);
  if(!config.daily&&!config.topic&&!config.group&&!config.review)return <SessionHub mode="learn"/>;
  return <StudySession key={JSON.stringify(config)} config={config}/>;
}
