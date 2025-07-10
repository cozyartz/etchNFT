'use client';
import { PenTool, Images, ListChecks, FileText, InfoIcon, Shield, Sun, Moon, Menu } from 'lucide-react';

export function LogoIcon() {
  return <PenTool className="text-2xl text-primary animate-neon-pulse" size={24} />;
}

export function GalleryIcon() {
  return <Images size={16} className="mr-2" />;
}

export function OrdersIcon() {
  return <ListChecks size={16} className="mr-2" />;
}

export function WhitepaperIcon() {
  return <FileText size={16} className="mr-2" />;
}

export function AboutIcon() {
  return <InfoIcon size={16} className="mr-2" />;
}

export function AdminIcon() {
  return <Shield size={16} className="mr-2" />;
}

export function ThemeToggleIcon() {
  // Check if dark mode is active
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return isDark ? 
    <Sun className="text-secondary transition-all duration-300" size={20} /> : 
    <Moon className="text-secondary transition-all duration-300" size={20} />;
}

export function MobileMenuIcon() {
  return <Menu className="text-primary" size={20} />;
}

export function MobileGalleryIcon() {
  return <Images size={24} className="mr-3" />;
}

export function MobileOrdersIcon() {
  return <ListChecks size={24} className="mr-3" />;
}

export function MobileWhitepaperIcon() {
  return <FileText size={24} className="mr-3" />;
}

export function MobileAboutIcon() {
  return <InfoIcon size={24} className="mr-3" />;
}

export function MobileAdminIcon() {
  return <Shield size={24} className="mr-3" />;
}