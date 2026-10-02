import { PracticeHub } from '@/components/learning/practice-hub';
export default async function PracticePage({searchParams}:{searchParams:Promise<{month?:string;topic?:string}>}) {
 const params=await searchParams;const month=Number(params.month);
 return <PracticeHub initialMonth={[1,2,3].includes(month)?month:undefined} initialTopic={params.topic}/>;
}
