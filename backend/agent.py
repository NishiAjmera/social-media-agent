
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from sub_agents import content_creation_agent, planning_agent, optimization_distribution_agent
from prompt import ROOT_AGENT_INSTR
from dotenv import load_dotenv
import os

load_dotenv()

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="social_media_orchestrator_agent",
    description="You are the Orchestrator Agent responsible for managing a multi-agent content creation workflow. The Orchestrator Agent is the central coordinator that receives the user’s input (goal or idea) and delegates tasks to other agents. It ensures the end-to-end workflow is followed in order: Planning → Creation → Optimization & Distribution.",
    instruction=ROOT_AGENT_INSTR,
    tools=[
        AgentTool(agent=planning_agent),
        AgentTool(agent=content_creation_agent),
        AgentTool(agent=optimization_distribution_agent),
    ]
)