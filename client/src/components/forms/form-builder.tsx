import { Card, CardContent } from "@/components/ui/card";
import QuestionEditor from "./question-editor";
import type { InsertFormQuestion } from "@shared/schema";

interface FormBuilderProps {
  questions: InsertFormQuestion[];
  onChange: (questions: InsertFormQuestion[]) => void;
}

export default function FormBuilder({ questions, onChange }: FormBuilderProps) {
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
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma pergunta adicionada ainda.</p>
        <p className="text-sm mt-1">Use o botão "Adicionar Pergunta" para começar.</p>
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
