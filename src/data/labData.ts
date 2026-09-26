import { AcademicExperiment } from './labs/types';
import { LABS_PART_1 } from './labs/labsPart1';
import { LABS_PART_2 } from './labs/labsPart2';
import { LABS_PART_3 } from './labs/labsPart3';

export * from './labs/types';

export const ACADEMIC_EXPERIMENTS: AcademicExperiment[] = [
  ...LABS_PART_1,
  ...LABS_PART_2,
  ...LABS_PART_3
];
