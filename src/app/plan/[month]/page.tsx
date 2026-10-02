import { notFound } from 'next/navigation';
import { MonthPlan } from '@/components/learning/month-plan';
export default async function MonthPage({params}:{params:Promise<{month:string}>}) {
  const {month}=await params;
  if(!['1','2','3'].includes(month)) notFound();
  return <MonthPlan month={Number(month)}/>;
}
