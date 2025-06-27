
from google.adk.agents import Agent
from prompt import ROOT_AGENT_INSTR
from dotenv import load_dotenv
import os

load_dotenv()

root_agent = Agent(
    model="gemini-2.5-flash",
    name="root_agent",
    description="You are the Orchestrator Agent responsible for managing a multi-agent content creation workflow.",
    instruction=ROOT_AGENT_INSTR,
)