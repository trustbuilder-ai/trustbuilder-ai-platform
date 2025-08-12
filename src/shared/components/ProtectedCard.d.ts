import { ReactNode } from 'react';

export interface ProtectedCardProps {
  children: ReactNode;
  requiredRole?: string | null;
  className?: string;
}

export function ProtectedCard(props: ProtectedCardProps): JSX.Element;
export default ProtectedCard;