import { 
  Download, 
  Eye, 
  BookOpen, 
  ChartLine, 
  Cpu, 
  Coins, 
  ShieldCheck, 
  ListChecks, 
  InfoIcon, 
  Rocket, 
  Images 
} from './Icons';

interface IconProps {
  className?: string;
}

export const DownloadIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Download className={className} />
);

export const EyeIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Eye className={className} />
);

export const BookOpenIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <BookOpen className={className} />
);

export const ChartLineIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <ChartLine className={className} />
);

export const CpuIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Cpu className={className} />
);

export const CoinsIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Coins className={className} />
);

export const ShieldCheckIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <ShieldCheck className={className} />
);

export const ListChecksIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <ListChecks className={className} />
);

export const InfoIconComponent = ({ className = "w-5 h-5" }: IconProps) => (
  <InfoIcon className={className} />
);

export const RocketIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Rocket className={className} />
);

export const ImagesIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Images className={className} />
);