from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from librarian.logic.book.pre_create_book import pre_create_book, BookInput
from librarian.db.session import get_db

book_router = APIRouter()

@book_router.post("/pre_create_book")
def pre_create_book_endpoint(input: BookInput, db: Session = Depends(get_db)):
    return pre_create_book(db, input)

"""
curl 'http://localhost:8000/pre_create_book' \
  -H 'Accept-Language: en-US,en;q=0.9,es-US;q=0.8,es;q=0.7,fr-FR;q=0.6,fr;q=0.5' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:8000' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://localhost:8000/docs' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  --data-raw $'{\n  "title": "AI Engineering Cookbook",\n  "isbn": "string",\n  "file_id": 1,\n  "pages_to_scan": "4-6"\n}'
  """
