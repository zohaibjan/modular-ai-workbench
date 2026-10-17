from fastapi import APIRouter
from pydantic import BaseModel, Field
router = APIRouter()
class TextRequest(BaseModel):
    text: str = Field(max_length=10000)
@router.post('/analyse')
def analyse(body: TextRequest):
    return {'characters': len(body.text), 'words': len(body.text.split())}
