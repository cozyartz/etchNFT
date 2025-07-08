'use client';
import { motion } from 'framer-motion';
import React from 'react';
import ToastProvider from './ToastProvider';

type ReactNode = React.ReactNode;

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

const containerVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const childVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <ToastProvider />
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="relative"
        >
          {/* Animated grid background */}
          <div className="fixed inset-0 bg-retro-grid bg-grid opacity-10 animate-pulse pointer-events-none" />
          
          {/* Scan line effect */}
          <div className="fixed inset-0 scan-lines opacity-20 pointer-events-none" />
          
          {/* Content */}
          <motion.div variants={childVariants}>
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

export { childVariants, containerVariants };
