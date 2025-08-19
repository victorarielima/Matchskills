import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import QuestionEditor from "./question-editor";
import type { InsertFormQuestion } from "@shared/schema";

interface FormBuilderProps {
  questions: InsertFormQuestion[];
  onChange: (questions: InsertFormQuestion[]) => void;
}

export default function FormBuilder({ questions, onChange }: FormBuilderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark') || 
                     window.getComputedStyle(html).colorScheme === 'dark' ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Glow effect function
  const getGlowStyle = (color: string = '#3b82f6') => {
    if (!isDarkMode) return {};
    
    return {
      textShadow: `0 0 10px ${color}40, 0 0 20px ${color}30, 0 0 30px ${color}20`,
      transition: 'text-shadow 0.3s ease-in-out',
    };
  };
  const updateQuestion = (index: number, updatedQuestion: InsertFormQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange(newQuestions);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Nenhuma pergunta adicionada ainda.</p>
        <p className="text-sm mt-1" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Use o botão "Adicionar Pergunta" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionEditor
          key={index}
          question={question}
          index={index}
          onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
          onRemove={() => removeQuestion(index)}
        />
      ))}
    </div>
  );
}
