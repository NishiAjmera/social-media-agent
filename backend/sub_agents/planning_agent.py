
from google.adk.agents import Agent
from prompt import PLANNING_AGENT_INSTRUCTIONS
from dotenv import load_dotenv
import os

load_dotenv()

planning_agent = Agent(
    name="planning_agent",
    model="gemini-2.5-flash",
    description="This is the Planning Agent in a content creation pipeline. The Planning Agent analyzes the user’s input and generates a high-level plan. This includes the type of content (e.g., LinkedIn post, YouTube short), the angle to take, the tone, format, and structure.",
    instruction=PLANNING_AGENT_INSTRUCTIONS,
)