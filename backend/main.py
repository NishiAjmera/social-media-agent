from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from orchestrator_agent.agent import root_agent
from pprint import pformat

app = FastAPI(title="Social Media Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Global session service and runner
session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent,
    app_name="social_media_assistant",
    session_service=session_service
)

# Request/Response models
class AgentRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    responses: List[str]
    session_id: str
    user_id: str

class StreamingAgentRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    session_id: Optional[str] = None

# Store sessions in memory (in production, use a proper database)
sessions_store = {}

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("Social Media Agent API starting up...")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Social Media Agent API is running"}

@app.post("/agent", response_model=AgentResponse)
async def chat_with_agent(request: AgentRequest):
    """
    Chat with the social media agent
    """
    try:
        # Get or create session
        session_key = f"{request.user_id}_{request.session_id}" if request.session_id else request.user_id
        
        # if session_key not in sessions_store:
        session = await session_service.create_session(
            app_name="social_media_assistant", 
            user_id=request.user_id,
            session_id=request.session_id
        )
        sessions_store[session_key] = session
        # else:
        #     session = sessions_store[session_key]

        # Process the message
        events_iterator = runner.run_async(
            user_id=request.user_id,
            session_id=request.session_id,
            new_message=types.Content(
                role="user", 
                parts=[types.Part(text=request.message)]
            )
        )
        
        responses = []
        final_response_text = ""
        
        async for event in events_iterator:
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.function_call:
                        formatted_call = f"Function Call - {part.function_call.name}:\n{pformat(part.function_call.model_dump(), indent=2, width=80)}"
                        responses.append(formatted_call)
                    elif part.function_response:
                        formatted_response = f"Function Response:\n{pformat(part.function_response.model_dump(), indent=2, width=80)}"
                        responses.append(formatted_response)

            # Handle final response
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_response_text = event.content.parts[0].text
                elif event.actions and event.actions.escalate:
                    final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                else:
                    final_response_text = "No response content available."
                
                responses.append(final_response_text)
                break

        return AgentResponse(
            responses=responses,
            session_id=session.id,
            user_id=request.user_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/agent/stream")
async def stream_chat_with_agent(request: StreamingAgentRequest):
    """
    Stream responses from the social media agent
    """
    async def generate_response():
        try:
            # Get or create session
            session_key = f"{request.user_id}_{request.session_id}" if request.session_id else request.user_id
            
            # if session_key not in sessions_store:
            session = await session_service.create_session(
                app_name="social_media_assistant", 
                user_id=request.user_id,
                session_id=request.session_id
            )
            #     sessions_store[session_key] = session
            # else:
            #     session = sessions_store[session_key]

            # Process the message
            events_iterator = runner.run_async(
                user_id=request.user_id,
                session_id=request.session_id,
                new_message=types.Content(
                    role="user", 
                    parts=[types.Part(text=request.message)]
                )
            )
            
            async for event in events_iterator:
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.function_call:
                            response_data = {
                                "type": "function_call",
                                "name": part.function_call.name,
                                "data": part.function_call.model_dump()
                            }
                            yield f"data: {json.dumps(response_data)}\n\n"
                        elif part.function_response:
                            response_data = {
                                "type": "function_response",
                                "data": part.function_response.model_dump()
                            }
                            yield f"data: {json.dumps(response_data)}\n\n"

                # Handle final response
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_text = event.content.parts[0].text
                    elif event.actions and event.actions.escalate:
                        final_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                    else:
                        final_text = "No response content available."
                    
                    response_data = {
                        "type": "final_response",
                        "text": final_text,
                        "session_id": session.id
                    }
                    yield f"data: {json.dumps(response_data)}\n\n"
                    break

        except Exception as e:
            error_data = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@app.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """Get all sessions for a user"""
    user_sessions = {k: v.id for k, v in sessions_store.items() if k.startswith(user_id)}
    return {"user_id": user_id, "sessions": user_sessions}

@app.delete("/sessions/{user_id}")
async def clear_user_sessions(user_id: str):
    """Clear all sessions for a user"""
    keys_to_remove = [k for k in sessions_store.keys() if k.startswith(user_id)]
    for key in keys_to_remove:
        del sessions_store[key]
    return {"message": f"Cleared {len(keys_to_remove)} sessions for user {user_id}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)