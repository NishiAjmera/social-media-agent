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
  // const [userInputLoading, setUserInputLoading] = useState(false);
  const [userInputResponse, setUserInputResponse] = useState<string | null>(null);

  // const handleRegenerate = (idx: number) => {
  //   setSteps((prev) =>
  //     prev.map((step, i) =>
  //       i === idx ? { ...step, loading: true } : step
  //     )
  //   );
  //   setTimeout(() => {
  //     setSteps((prev) =>
  //       prev.map((step, i) =>
  //         i === idx ? { ...step, loading: false, value: step.value + ' (regenerated)' } : step
  //       )
  //     );
  //   }, 1200);
  // };

  const handleChange = (idx: number, newValue: string) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === idx ? { ...step, value: newValue } : step
      )
    );
  };

  const parseAgentPlanResponseRobust = (response: any) => {
    try {
      // Find the start of agent_plan
      const startPattern = "'agent_plan': '";
      const startIndex = response.indexOf(startPattern);
      
      if (startIndex === -1) return null;
      
      const jsonStart = startIndex + startPattern.length;
      
      // Find the end by counting braces (since JSON is nested)
      let braceCount = 0;
      let jsonEnd = jsonStart;
      let inString = false;
      let escapeNext = false;
      
      for (let i = jsonStart; i < response.length; i++) {
        const char = response[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }
      
      // Extract and clean the JSON string
      let jsonString = response.substring(jsonStart, jsonEnd);
      jsonString = jsonString
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      
      return jsonString
      
    } catch (error) {
      console.error('Error in robust parsing:', error);
      return null;
    }
  }
  
  const parseContentCreationResponse = (response: any) => {
    try {
      // Use eval approach since the content is a simple string concatenation
      const responseStart = response.indexOf('Function Response:\n') + 'Function Response:\n'.length;
      let responseText = response.substring(responseStart).trim();
      
      // Replace Python None with null
      responseText = responseText.replace(/None/g, 'null');
      
      // Parse the entire response object
      // const parsedResponse = eval('(' + responseText + ')');
      
      // // Extract the content
      // if (parsedResponse.response && parsedResponse.response.content) {
      //   return parsedResponse.response.content;
      // }
      
      return responseText;
    } catch (error) {
      console.error('Content creation parsing error:', error);
      return null;
    }
  }

  const parseAgentResponse = (responses: string[]) => {
    let planningContent = '';
    let contentCreationContent = '';
    let optimizationContent = '';

    responses.forEach(response => {
      if (response.includes('Function Response:') && response.includes('planning_agent')) {
        // Extract planning content
        const agentPlan = parseAgentPlanResponseRobust(response);
        if (agentPlan) {
          planningContent = agentPlan;
          console.log('Parsed planning content:', planningContent);
        }
        // const match = response.match(/'result':\s*'([^']+)'/);
        // if (match) {
        //   planningContent = match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
        // }
      } else if (response.includes('Function Response:') && response.includes('content_creation_agent')) {
        // Extract content creation
        contentCreationContent = parseContentCreationResponse(response);
        // const match = response.match(/'result':\s*"([^"]+)"/);
        // if (match) {
        //   contentCreationContent = match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
        // }
      } 
      // else if (response.includes('Function Response:') && response.includes('optimization_distribution_agent')) {
      //   // Extract optimization content
      //   const match = response.match(/'result':\s*"([^"]+)"/);
      //   if (match) {
      //     optimizationContent = match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'");
      //   }
      // }
    });
    optimizationContent = responses[responses.length-1]
    return { planningContent, contentCreationContent, optimizationContent };
  };

  const handleSendCTA = async () => {
    // setUserInputLoading(true);
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
    //   const data = {
    //     "responses": [
    //         "Function Call - planning_agent:\n{ 'args': {'request': 'Create a very short social media post about Gemini'},\n  'id': 'adk-427f3b49-181b-46ab-9752-15c157f7e3e3',\n  'name': 'planning_agent'}",
    //         "Function Response:\n{ 'id': 'adk-427f3b49-181b-46ab-9752-15c157f7e3e3',\n  'name': 'planning_agent',\n  'response': { 'agent_plan': '{\"content_format\": \"Social Media Post (e.g., '\n                              'X/Twitter, LinkedIn Quick '\n                              'Update)\",\"target_audience\": \"Tech enthusiasts, '\n                              'AI curious individuals, general public '\n                              'interested in innovation\",\"suggested_tone\": '\n                              '\"Excited, informative, '\n                              'forward-looking\",\"key_talking_points\": '\n                              '[\"Introduction of Google Gemini as a powerful '\n                              'new AI model\",\"Highlight its multimodal '\n                              'capabilities (text, code, audio, image, '\n                              'video)\",\"Emphasize its advanced performance and '\n                              'potential impact\"],\"optional_hooks_or_angles\": '\n                              '[\"\\'Get ready for the next era of '\n                              'AI!\\'\",\"\\'Google\\'s Gemini is here to change '\n                              'the game.\\'\",\"Focus on the \\'multimodal magic\\' '\n                              'as its unique selling point\"]}'},\n  'scheduling': None,\n  'will_continue': None}",
    //         "Function Call - content_creation_agent:\n{ 'args': { 'request': '{\"content_format\": \"Social Media Post (e.g., '\n                       'X/Twitter, LinkedIn Quick Update)\",\"target_audience\": '\n                       '\"Tech enthusiasts, AI curious individuals, general '\n                       'public interested in innovation\",\"suggested_tone\": '\n                       '\"Excited, informative, '\n                       'forward-looking\",\"key_talking_points\": [\"Introduction '\n                       'of Google Gemini as a powerful new AI '\n                       'model\",\"Highlight its multimodal capabilities (text, '\n                       'code, audio, image, video)\",\"Emphasize its advanced '\n                       'performance and potential '\n                       'impact\"],\"optional_hooks_or_angles\": [\"\\'Get ready for '\n                       'the next era of AI!\\'\",\"\\'Google\\'s Gemini is here to '\n                       'change the game.\\'\",\"Focus on the \\'multimodal magic\\' '\n                       'as its unique selling point\"]}'},\n  'id': 'adk-48ea346f-d2bf-4d12-b394-a63ccfb61690',\n  'name': 'content_creation_agent'}",
    //         "Function Response:\n{ 'id': 'adk-48ea346f-d2bf-4d12-b394-a63ccfb61690',\n  'name': 'content_creation_agent',\n  'response': { 'content': \"Google's Gemini is here to change the game! Get \"\n                           'ready for the next era of AI. This powerful new '\n                           \"model from Google isn't just about text; it's a \"\n                           'true multimodal powerhouse, capable of '\n                           'understanding and operating across text, code, '\n                           'audio, image, and video.\\n'\n                           '\\n'\n                           'Gemini represents a significant leap forward in AI '\n                           'performance and versatility. Its advanced '\n                           'capabilities promise to unlock incredible new '\n                           'possibilities, pushing the boundaries of what AI '\n                           'can do. The future is looking incredibly '\n                           'intelligent!'},\n  'scheduling': None,\n  'will_continue': None}",
    //         "Function Call - optimization_distribution_agent:\n{ 'args': { 'request': \"Google's Gemini is here to change the game! Get ready \"\n                       'for the next era of AI. This powerful new model from '\n                       \"Google isn't just about text; it's a true multimodal \"\n                       'powerhouse, capable of understanding and operating '\n                       'across text, code, audio, image, and video.\\n'\n                       '\\n'\n                       'Gemini represents a significant leap forward in AI '\n                       'performance and versatility. Its advanced capabilities '\n                       'promise to unlock incredible new possibilities, '\n                       'pushing the boundaries of what AI can do. The future '\n                       'is looking incredibly intelligent!'},\n  'id': 'adk-4ed566bc-e1b4-4244-bc58-a2f43aa0a48a',\n  'name': 'optimization_distribution_agent'}",
    //         "Function Response:\n{ 'id': 'adk-4ed566bc-e1b4-4244-bc58-a2f43aa0a48a',\n  'name': 'optimization_distribution_agent',\n  'response': { 'optimised_content': 'The future of AI just arrived. 🚀 '\n                                     \"Google's revolutionary Gemini is here, \"\n                                     'changing the game as a true multimodal '\n                                     \"powerhouse! It's not just about text – \"\n                                     'Gemini seamlessly understands and '\n                                     'operates across text, code, audio, '\n                                     \"image, and video. This isn't just an \"\n                                     \"upgrade; it's a monumental leap in AI \"\n                                     'performance and versatility, pushing the '\n                                     'boundaries of what AI can do. Get ready '\n                                     'for incredible new possibilities! What '\n                                     'do you think this means for the future? '\n                                     '#GoogleGemini #GeminiAI #MultimodalAI '\n                                     '#AIInnovation #FutureOfAI '\n                                     '#ArtificialIntelligence #TechNews '\n                                     'Suggested Platforms & Times: X (formerly '\n                                     'Twitter): Ideal for breaking tech news '\n                                     'and engaging tech-savvy audiences. Post '\n                                     'Mid-morning (10 AM - 12 PM EST) on '\n                                     'weekdays. LinkedIn: Great for a '\n                                     'professional audience and deeper '\n                                     'industry insights. Post Mid-morning (10 '\n                                     'AM - 12 PM EST) on weekdays. Facebook: '\n                                     'Good for broader reach to tech '\n                                     'enthusiasts and general public. Post '\n                                     'Early afternoon (1 PM - 3 PM EST) or '\n                                     'evenings. Formatting Tip: For '\n                                     'readability on platforms, use emojis, '\n                                     'consider short paragraphs, and end with '\n                                     'an engaging question to spark '\n                                     'conversation.'},\n  'scheduling': None,\n  'will_continue': None}",
    //         "The future of AI just arrived. 🚀 Google's revolutionary Gemini is here, changing the game as a true multimodal powerhouse! It's not just about text – Gemini seamlessly understands and operates across text, code, audio, image, and video. This isn't just an upgrade; it's a monumental leap in AI performance and versatility, pushing the boundaries of what AI can do. Get ready for incredible new possibilities! What do you think this means for the future? #GoogleGemini #GeminiAI #MultimodalAI #AIInnovation #FutureOfAI #ArtificialIntelligence #TechNews\n\n**Suggested Platforms & Times:**\n\n*   **X (formerly Twitter):** Ideal for breaking tech news and engaging tech-savvy audiences. Post Mid-morning (10 AM - 12 PM EST) on weekdays.\n*   **LinkedIn:** Great for a professional audience and deeper industry insights. Post Mid-morning (10 AM - 12 PM EST) on weekdays.\n*   **Facebook:** Good for broader reach to tech enthusiasts and general public. Post Early afternoon (1 PM - 3 PM EST) or evenings.\n\n**Formatting Tip:** For readability on platforms, use emojis, consider short paragraphs, and end with an engaging question to spark conversation."
    //     ],
    //     "session_id": "session_id_123",
    //     "user_id": "test_user_123"
    // }
      setUserInputResponse(data.responses?.[0] || 'No response');

      // Parse and update the steps with agent responses
      if (data.responses) {
        const { planningContent, contentCreationContent, optimizationContent } = parseAgentResponse(data.responses);
        
        setSteps(prev => prev.map((step, idx) => {
          if (idx === 1 && planningContent) {
            return { ...step, value: planningContent };
          } else if (idx === 2 && contentCreationContent) {
            return { ...step, value: contentCreationContent };
          } else if (idx === 3 && optimizationContent) {
            return { ...step, value: optimizationContent };
          }
          return step;
        }));
      }
    } catch (e) {
      setUserInputResponse('Error sending request');
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
              onRegenerate={() => handleSendCTA()}
              onChange={(val: string) => handleChange(idx, val)}
              isLast={idx === steps.length - 1}
            />
            {/* {idx === 0 && expanded === 0 && (
              <div className="mt-4 flex flex-col gap-2"> */}
                {/* <Button
                variant="outline"
                  onClick={handleSendCTA}
                  disabled={userInputLoading}
                  className="w-fit"
                >
                  {userInputLoading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent text-gray-800 rounded-full"></span> Sending...</span>
                  ) : (
                    'Send CTA'
                  )}
                </Button> */}
                {/* {userInputResponse && (
                  <div className="bg-gray-100 border rounded p-3 text-sm text-gray-800 mt-2">
                    {userInputResponse}
                  </div>
                )} */}
              {/* </div>
            )} */}
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