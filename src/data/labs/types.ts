import { NetworkDevice, NetworkLink } from '../../types/network';

export interface VisualStep {
  step: number;
  label: string;
  source: string;
  target: string;
  layer: string;
  detail: string;
}

export interface VivaQuestionAnswer {
  question: string;
  answer: string;
}

export interface AcademicExperiment {
  id: string;
  number: number;
  title: string;
  category: 'Fundamentals' | 'Topologies' | 'Packet Analysis' | 'Subnetting' | 'Routing' | 'Dynamic Routing' | 'IPv6' | 'Serial & Protocols';
  aim: string;
  apparatus: string[];
  background: string;
  initialTopology: {
    devices: NetworkDevice[];
    links: NetworkLink[];
  };
  procedureSteps: string[];
  cliCommands?: string[];
  verificationCheck: {
    description: string;
    isPassed: (devices: NetworkDevice[], links: NetworkLink[]) => boolean;
    hint: string;
  };
  visualExplanation: {
    title: string;
    description: string;
    steps: VisualStep[];
  };
  resources: {
    referenceUrl: string;
    referenceTitle: string;
    referenceSource: string; // e.g. 'GeeksforGeeks' | 'Cloudflare' | 'Cisco'
    geeksForGeeksUrl?: string;
    geeksForGeeksTitle?: string;
    youtubeUrl: string;
    youtubeTitle: string;
    youtubeChannel: string;
  };
  vivaQuestions: VivaQuestionAnswer[];
}
