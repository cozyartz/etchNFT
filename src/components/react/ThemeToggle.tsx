'use client';
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    updateBodyClasses(shouldBeDark);
  }, []);

  const updateBodyClasses = (dark: boolean) => {
    const body = document.body;
    
    if (dark) {
      body.classList.remove('bg-gray-100', 'text-gray-900');
      body.classList.add('hero-gradient', 'text-white');
    } else {
      body.classList.remove('hero-gradient', 'text-white');
      body.classList.add('bg-gray-100', 'text-gray-900');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    updateBodyClasses(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg border border-secondary/30 bg-retro-dark group"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="text-secondary transition-all duration-300" size={20} />
      ) : (
        <Moon className="text-secondary transition-all duration-300" size={20} />
      )}
      <div className="absolute inset-0 bg-secondary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
    </button>
  );
}