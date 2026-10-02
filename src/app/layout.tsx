import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LearningProvider } from '@/components/providers/learning-provider';
import { ActivityTracker } from '@/components/providers/activity-tracker';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = { title:'ReactMentor — Практика React', description:'React, TypeScript и Next.js: учебный план, практика, вопросы и интервью.' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ru" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}><body><LearningProvider><ActivityTracker/><Header/><Sidebar/><main className="app-main"><div className="page-container">{children}</div></main></LearningProvider></body></html>;
}
