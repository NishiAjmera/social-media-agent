import asyncio
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agent import root_agent
from pprint import pformat


async def main():
    app_name = "social_media_assistant"
    session_service = InMemorySessionService()
    runner = Runner(
        agent=root_agent,
        app_name=app_name,
        session_service=session_service
    )

    user_id = "test_user_123"
    
    session_id = "default_session"

    session = await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)

    print("Agent is ready. Type your messages (type 'quit' to exit).")
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'quit':
            break

        # user_message_event = types.UserMessage(text_query=user_input)
        events_iterator = runner.run_async(
            user_id=user_id,
            session_id=session_id, 
            new_message=types.Content(role="user", parts=[types.Part(text=user_input)])
        )
        
        responses = []
        async for event in events_iterator:  # event has type Event
            if event.content.parts:
                for part in event.content.parts:
                    if part.function_call:
                        formatted_call = f"```python\n{pformat(part.function_call.model_dump(), indent=2, width=80)}\n```"
                        print(f"function call: {part.function_call.name} : {formatted_call}")
                        responses.append(formatted_call)

                    elif part.function_response:
                        formatted_response = f"```python\n{pformat(part.function_response.model_dump(), indent=2, width=80)}\n```"
                        responses.append(formatted_response)
                        print(f"formatted_response: {formatted_response} ")

            # Key Concept: is_final_response() marks the concluding message for the turn
            if event.is_final_response():
                if event.content and event.content.parts:
                    # Extract text from the first part
                    final_response_text = event.content.parts[0].text
                elif event.actions and event.actions.escalate:
                    # Handle potential errors/escalations
                    final_response_text = (
                        f"Agent escalated: {event.error_message or 'No specific message.'}"
                    )
                else:
                    final_response_text = "No response content available."
                
                responses.append(final_response_text)
                print(f"final_response_text: {final_response_text}")
                
                # Process all responses here instead of yielding
                print(f"All responses: {responses}")
                break  # Stop processing events once the final response is found


if __name__ == "__main__":
    asyncio.run(main())