from typing import Protocol, TypedDict, Literal
import json

class Message(TypedDict):
    content : str
    role: Literal["system","user","assistant"]

class Conversation(Protocol):

    def append(self,message:Message) -> None:
        ...

    def load(self)->list[Message]:
        ...

    def close(self) -> None:
        ...

class FileConversation(Conversation):
    def __init__(self, name : str):
        self.file = open(name, "a+", encoding='utf-8')

    def append(self, message : Message):
        serialized = json.dumps(message)
        self.file.write(serialized+"\n")
        self.file.flush()

    def load(self)->list[Message]:
        self.file.seek(0)
        messages = []
        for line in self.file:
            line = line.strip()
            if not line:
                continue
            message : Message = json.loads(line)
            messages.append(message)

        return messages

    def close(self):
        self.file.close()
  




# Pending :  
#    class PostgresConversation
#    class RedisConversation
#    class S3Conversation
#    class SQLiteConversation
