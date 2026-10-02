'use client';
import { MonthCards } from '@/components/learning/month-cards';
import { PageHeading } from '@/components/learning/page-heading';
import { useLearningStore } from '@/stores/learning-store';
import { COPY } from '@/lib/i18n';
export default function PlanPage(){
  const language=useLearningStore(state=>state.language);
  return <><PageHeading title={COPY[language].plan} subtitle={COPY[language].course}/><MonthCards/></>;
}
