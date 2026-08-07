export type StatusPresentation = 'hidden' | 'inline' | 'banner';

export function getStatusPresentation(status: string, error: string): StatusPresentation {
  if (error) return 'banner';
  return status ? 'inline' : 'hidden';
}
