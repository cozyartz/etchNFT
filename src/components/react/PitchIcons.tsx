import React from 'react';
import { 
  Rocket, 
  AlertTriangle, 
  Target, 
  Coins, 
  DollarSign, 
  User 
} from 'lucide-react';

interface IconProps {
  className?: string;
}

export const RocketIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <Rocket className={className} />
);

export const ProblemIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <AlertTriangle className={className} />
);

export const SolutionIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <Target className={className} />
);

export const SolanaIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <Coins className={className} />
);

export const MoneyIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <DollarSign className={className} />
);

export const ContactIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <User className={className} />
);