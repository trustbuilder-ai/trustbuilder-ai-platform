import { EvalResult, EvalStatus } from '../../backend_client/types.gen';

export const getEvalStatusIcon = (
  status: EvalStatus | undefined,
  isEvaluating: boolean
): string => {
  if (isEvaluating) {
    return '⏳';
  }
  if (!status) {
    return '';
  }

  switch (status) {
    case 'SUCCEEDED':
      return '✓';
    case 'FAILED':
      return '✗';
    case 'ERRORED':
      return '⚠️';
    default:
      return '';
  }
};

export const getEvalButtonColor = (result?: EvalResult): string => {
  if (!result) return 'purple';

  switch (result.status) {
    case 'SUCCEEDED':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'ERRORED':
      return 'amber';
    default:
      return 'gray';
  }
};

export const getEvalButtonVariant = (
  result?: EvalResult
): 'outline' | 'soft' | 'solid' => {
  if (!result) return 'outline';
  return 'soft';
};
