'use client';
import { PenTool, FileText, Download, Book, HardDrive, Rocket } from 'lucide-react';

export function FooterLogoIcon() {
  return <PenTool className="text-2xl text-primary animate-neon-pulse" size={24} />;
}

export function FooterWhitepaperIcon() {
  return <FileText size={16} className="mr-2" />;
}

export function FooterDownloadIcon() {
  return <Download size={16} className="mr-2" />;
}

export function FooterBookIcon() {
  return <Book size={16} className="mr-2" />;
}

export function FooterCloudIcon() {
  return <HardDrive className="text-secondary" size={16} />;
}

export function FooterRocketIcon() {
  return <Rocket className="text-neon-green" size={16} />;
}

// For Ethereum/Polygon, we'll use a simple custom component since Lucide doesn't have it
export function EthereumIcon() {
  return (
    <svg className="text-primary" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.75l7.125 11.5L12 18.25l-7.125-5L12 1.75zm0 12.75l4.5-7.25L12 5.75l-4.5 1.5L12 14.5z"/>
    </svg>
  );
}