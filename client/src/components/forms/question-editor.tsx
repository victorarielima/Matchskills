import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, X } from "lucide-react";
import type { InsertFormQuestion } from "@shared/schema";

interface QuestionEditorProps {
  question: InsertFormQuestion;
  index: number;
  onChange: (question: InsertFormQuestion) => void;
  onRemove: () => void;
}

export default function QuestionEditor({ question, index, onChange, onRemove }: QuestionEditorProps) {
  const [options, setOptions] = useState<string[]>(question.options || []);

  const updateQuestion = (field: keyof InsertFormQuestion, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const updateOptions = (newOptions: string[]) => {
    setOptions(newOptions);
    updateQuestion('options', newOptions.length > 0 ? newOptions : undefined);
  };

  const addOption = () => {
    updateOptions([...options, ""]);
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex] = value;
    updateOptions(newOptions);
  };

  const removeOption = (optionIndex: number) => {
    updateOptions(options.filter((_, i) => i !== optionIndex));
  };

  return (
    <Card className="bg-gray-50 border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Pergunta {index + 1}</span>
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div className="md:col-span-2">
            <Input
              value={question.question}
              onChange={(e) => updateQuestion('question', e.target.value)}
              placeholder="Digite sua pergunta..."
              className="bg-white"
            />
          </div>
          <div>
            <Select value={question.type} onValueChange={(value) => updateQuestion('type', value)}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto Curto</SelectItem>
                <SelectItem value="textarea">Texto Longo</SelectItem>
                <SelectItem value="radio">Seleção Única</SelectItem>
                <SelectItem value="checkbox">Múltipla Escolha</SelectItem>
                <SelectItem value="scale">Escala</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options for radio/checkbox */}
        {(question.type === 'radio' || question.type === 'checkbox') && (
          <div className="mb-3">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Opções</Label>
            <div className="space-y-2">
              {options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`Opção ${optionIndex + 1}`}
                    className="bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(optionIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Opção
              </Button>
            </div>
          </div>
        )}

        {/* Scale options */}
        {question.type === 'scale' && (
          <div className="mb-3">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Escala</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={question.scaleMin || 1}
                onChange={(e) => updateQuestion('scaleMin', parseInt(e.target.value))}
                placeholder="Valor mínimo (ex: 1)"
                className="bg-white"
              />
              <Input
                type="number"
                value={question.scaleMax || 10}
                onChange={(e) => updateQuestion('scaleMax', parseInt(e.target.value))}
                placeholder="Valor máximo (ex: 10)"
                className="bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={!!question.isRequired}
              onCheckedChange={(checked) => updateQuestion('isRequired', checked)}
            />
            <span className="text-sm text-gray-700">Obrigatória</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
