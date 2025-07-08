'use client';
import { PenTool, Link, Zap, Gem, Images, Box, Wallet } from 'lucide-react';

export function HeroLogoIcon() {
  return <PenTool className="mr-4 text-primary animate-neon-pulse" size={48} />;
}

export function MultiChainIcon() {
  return <Link className="text-2xl text-primary" size={32} />;
}

export function FastProcessingIcon() {
  return <Zap className="text-2xl text-secondary" size={32} />;
}

export function PremiumQualityIcon() {
  return <Gem className="text-2xl text-neon-green" size={32} />;
}

export function GalleryButtonIcon() {
  return <Images className="mr-2 group-hover:animate-pulse" size={20} />;
}

export function OrdersButtonIcon() {
  return <Box className="mr-2 group-hover:animate-spin" size={20} />;
}

export function WalletConnectIcon() {
  return <Wallet className="mr-3 animate-neon-pulse" size={32} />;
}