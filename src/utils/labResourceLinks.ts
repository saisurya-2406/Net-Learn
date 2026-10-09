import { AcademicExperiment } from '../data/labs/types';

export function buildLabVideoSearchUrl(experiment: AcademicExperiment): string {
  const query = `${experiment.resources.youtubeTitle} computer networking`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
