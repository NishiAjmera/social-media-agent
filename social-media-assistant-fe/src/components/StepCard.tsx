import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "./ui/button";
import { useState } from 'react';

interface StepCardProps {
  step: {
    title: string;
    icon: string;
    loading: boolean;
    value: string;
    editable?: boolean;
    canCopy?: boolean;
  };
  expanded: boolean;
  onToggle: () => void;
  onRegenerate: () => void;
  onChange: (val: string) => void;
  isLast: boolean;
}

export default function StepCard({ step, expanded, onToggle, onRegenerate, onChange, isLast }: StepCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(step.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.div
      layout
      className={`bg-white border rounded-xl shadow-sm transition-all ${expanded ? 'ring-2 ring-blue-400' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="text-2xl">{step.icon}</span>
        <span className="font-semibold text-lg flex-1">{step.title}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          className="text-gray-400"
        >
          ▶
        </motion.span>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="px-6 pb-4"
          >
            {step.loading ? (
              <div className="flex items-center gap-2 py-6">
                <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                <span className="text-blue-500">Loading...</span>
              </div>
            ) : step.editable ? (
              <textarea
                className="w-full min-h-[80px] rounded border p-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3 resize-y"
                value={step.value}
                onChange={e => onChange(e.target.value)}
                disabled={step.loading}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 rounded p-3 text-sm border mb-3 max-h-60 overflow-auto">
                {step.value}
              </pre>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRegenerate} disabled={step.loading}>
                Generate
              </Button>
              {step.canCopy && !step.loading && (
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && <div className="mx-8 border-l-2 border-dashed border-gray-200 h-6 -mb-3" />}
    </motion.div>
  );
} 