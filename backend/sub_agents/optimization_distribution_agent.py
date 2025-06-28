from pydantic import BaseModel, Field
from google.adk.agents import Agent
from prompt import OPTIMIZATION_DISTRIBUTION_AGENT_INSTRUCTIONS
from dotenv import load_dotenv
import os

load_dotenv()


class OptimizationAgentOutput(BaseModel):
    optimised_content: str = Field(description="The final content returned by the agent.")

optimization_distribution_agent = Agent(
    model="gemini-2.5-flash",
    name="optimization_distribution_agent",
    description="This is the Optimization & Distribution Agent in a multi-agent content creation pipeline. This agent improves the created content for better performance and prepares it for distribution. It handles optimization like shortening length, improving hooks, adding hashtags, and suggesting posting schedules.",
    instruction=OPTIMIZATION_DISTRIBUTION_AGENT_INSTRUCTIONS,
    output_schema=OptimizationAgentOutput, # Enforce JSON output
    output_key="output",
)