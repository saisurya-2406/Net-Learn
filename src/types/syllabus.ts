import { LucideIcon } from 'lucide-react';

export interface SyllabusTopic {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  examTips: string;
  diagramOrSnippet?: string;
  vivaQuestions: { q: string; a: string }[];
  references?: Array<{
    title: string;
    url: string;
    type?: 'Guide' | 'RFC' | 'Doc' | 'Video';
    source?: string;
  }>;
}

export interface UnitSection {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  iconName: string;
  topics: SyllabusTopic[];
}
