'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QUIZ_QUESTIONS, type LearningQuestion } from '@/content/course';
import { chooseDailyQuestions, dateKey, nextReview, type AnswerRecord, type ReviewRecord, type StudyMode } from '@/lib/learning';

interface LearningState {
  ready: boolean;
  storageError: string;
  language: 'ru' | 'en';
  contentLanguage: 'tg' | 'ru' | 'en';
  dailyLimit: number;
  activeMonth: number;
  theme: 'light' | 'dark';
  dailySets: Record<string, string[]>;
  studied: string[];
  answers: Record<string, AnswerRecord>;
  reviews: Record<string, ReviewRecord>;
  awards: Record<string, number>;
  completedTopics: string[];
  completedPractice: string[];
  drafts: Record<string, string>;
  notes: {id:string; title:string; content:string}[];
  setPreferences: (values: Partial<Pick<LearningState, 'language' | 'contentLanguage' | 'dailyLimit' | 'activeMonth' | 'theme'>>) => void;
  ensureDailySet: (month: number, today?: string) => string[];
  markStudied: (questionId: string) => void;
  recordAnswer: (question: LearningQuestion, mode: StudyMode, correct: boolean, answer: string, today?: string) => void;
  completeTopic: (topicId: string) => void;
  completePractice: (practiceId: string, verified: boolean) => void;
  saveDraft: (id: string, code: string) => void;
  saveNote: (note: {id:string;title:string;content:string}) => void;
  deleteNote: (id:string) => void;
}

export const useLearningStore = create<LearningState>()(persist((set, get) => ({
  ready:false, storageError:'', language:'ru', contentLanguage:'tg', dailyLimit:10, activeMonth:1, theme:'light',
  dailySets:{}, studied:[], answers:{}, reviews:{}, awards:{}, completedTopics:[], completedPractice:[], drafts:{}, notes:[],
  setPreferences(values) { set(values); },
  ensureDailySet(month, today = dateKey()) {
    const key = `${today}-${month}`;
    const current = get();
    if (current.dailySets[key]) return current.dailySets[key];
    const ids = chooseDailyQuestions(QUIZ_QUESTIONS, month, current.dailyLimit, current.studied, Object.values(current.reviews), today);
    set({dailySets:{...current.dailySets,[key]:ids}});
    return ids;
  },
  markStudied(questionId) {
    const current = get();
    if (current.studied.includes(questionId)) return;
    set({studied:[...current.studied,questionId], awards:{...current.awards,[`learn:${questionId}`]:2}});
  },
  recordAnswer(question, mode, correct, answer, today = dateKey()) {
    const current = get();
    const key = `${today}:${mode}:${question.id}`;
    if (current.answers[key]) return;
    const awards = {...current.awards};
    if (correct) awards[`${mode}:${question.id}`] = mode === 'test' ? 10 : 5;
    set({
      answers:{...current.answers,[key]:{questionId:question.id,topicId:question.topicId,mode,correct,answer,date:today}}, awards,
      reviews:{...current.reviews,[question.id]:nextReview(current.reviews[question.id],question.id,question.topicId,correct,today)},
    });
  },
  completeTopic(topicId) {
    const current = get();
    if (current.completedTopics.includes(topicId)) return;
    set({completedTopics:[...current.completedTopics,topicId],awards:{...current.awards,[`lesson:${topicId}`]:5}});
  },
  completePractice(practiceId, verified) {
    const current = get();
    if (current.completedPractice.includes(practiceId)) return;
    set({completedPractice:[...current.completedPractice,practiceId],awards:{...current.awards,[`practice:${practiceId}`]:verified ? 20 : 4}});
  },
  saveDraft(id, code) { set({drafts:{...get().drafts,[id]:code}}); },
  saveNote(note) { set({notes:[note,...get().notes.filter(item=>item.id!==note.id)]}); },
  deleteNote(id) { set({notes:get().notes.filter(item=>item.id!==id)}); },
}), {
  name:'react-mentor-learning-v2', version:2, storage:createJSONStorage(()=>localStorage), skipHydration:true,
  partialize(state) {
    const {ready:_ready,storageError:_error,setPreferences:_set,ensureDailySet:_daily,markStudied:_studied,recordAnswer:_record,completeTopic:_topic,completePractice:_practice,saveDraft:_draft,saveNote:_note,deleteNote:_delete,...saved} = state;
    return saved;
  },
  onRehydrateStorage: () => (_state, error) => {
    if (error) useLearningStore.setState({storageError:'Не удалось прочитать сохранённые данные. Не очищайте браузер.'});
  },
}));
