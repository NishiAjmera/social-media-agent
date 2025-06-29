from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agents import content_creation_agent, planning_agent, optimization_distribution_agent
from . import prompt
from dotenv import load_dotenv
import os


load_dotenv()

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="orchestrator_agent",
    description=prompt.ORCHESTRATOR_AGENT_DESCRIPTION,
    instruction=prompt.ROOT_AGENT_INSTR,
    tools=[
        AgentTool(agent=planning_agent),
        AgentTool(agent=content_creation_agent),
        AgentTool(agent=optimization_distribution_agent),
    ]
)