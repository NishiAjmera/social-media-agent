import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepCard from './StepCard';
import AgentLogs from './AgentLogs';
import { Button } from './ui/button';

const mockSteps = [
  {
    title: 'User Input',
    icon: '📝',
    loading: false,
    value: 'Write a post about the benefits of meditation.',
    editable: true,
    canCopy: false,
  },
  {
    title: 'Planning Agent Output',
    icon: '🧠',
    loading: false,
    value: 'Plan: 1. Hook, 2. Value, 3. CTA. Target: busy professionals.',
    editable: true,
    canCopy: false,
  },
  {
    title: 'Content Creation Output',
    icon: '✍️',
    loading: false,
    value: '"Feeling stressed? Meditation can help you reset in just 5 minutes a day..."',
    editable: true,
    canCopy: false,
  },
  {
    title: 'Optimization Output',
    icon: '🚀',
    loading: false,
    value: '{\n  "content": "Feeling stressed? Meditation can help you reset in just 5 minutes a day... #Mindfulness #Wellness #SelfCare",\n  "hashtags": ["#Mindfulness", "#Wellness", "#SelfCare"],\n  "cta": "Try a 5-minute meditation today!"\n}',
    editable: true,
    canCopy: true,
  },
];

const mockLogs = {
  step1: { input: 'Write a post about the benefits of meditation.' },
  step2: { plan: 'Hook, Value, CTA' },
  step3: { draft: 'Feeling stressed?...' },
  step4: { optimized: 'Feeling stressed?... #Mindfulness' },
};

export default function Workflow({ showLogs }: { showLogs: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(3); // Last step open by default
  const [steps, setSteps] = useState(mockSteps);
  const [logs] = useState(mockLogs);
  const [userInputLoading, setUserInputLoading] = useState(false);
  const [userInputResponse, setUserInputResponse] = useState<string | null>(null);

  const handleRegenerate = (idx: number) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === idx ? { ...step, loading: true } : step
      )
    );
    setTimeout(() => {
      setSteps((prev) =>
        prev.map((step, i) =>
          i === idx ? { ...step, loading: false, value: step.value + ' (regenerated)' } : step
        )
      );
    }, 1200);
  };

  const handleChange = (idx: number, newValue: string) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === idx ? { ...step, value: newValue } : step
      )
    );
  };

  const handleSendCTA = async () => {
    setUserInputLoading(true);
    setUserInputResponse(null);
    try {
      const res = await fetch('http://localhost:8000/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: steps[0].value,
          user_id: 'test_user_123',
          session_id: 'session_id_123',
        }),
      });
      const data = await res.json();
      setUserInputResponse(data.responses?.[0] || 'No response');
    } catch (e) {
      setUserInputResponse('Error sending request');
    } finally {
      setUserInputLoading(false);
    }
  };

  return (
    <div className="relative flex w-full max-w-xl mx-auto">
      <div className="flex-1 space-y-6 py-12">
        {steps.map((step, idx) => (
          <div key={step.title}>
            <StepCard
              step={step}
              expanded={expanded === idx}
              onToggle={() => setExpanded(expanded === idx ? null : idx)}
              onRegenerate={() => handleRegenerate(idx)}
              onChange={(val: string) => handleChange(idx, val)}
              isLast={idx === steps.length - 1}
            />
            {idx === 0 && expanded === 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={handleSendCTA}
                  disabled={userInputLoading}
                  className="w-fit"
                >
                  {userInputLoading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent text-gray-800 rounded-full"></span> Sending...</span>
                  ) : (
                    'Send CTA'
                  )}
                </Button>
                {userInputResponse && (
                  <div className="bg-gray-100 border rounded p-3 text-sm text-gray-800 mt-2">
                    {userInputResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[380px] bg-white border-l shadow-lg z-40 p-6 overflow-auto"
          >
            <AgentLogs logs={logs} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 