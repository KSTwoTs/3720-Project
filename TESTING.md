# Testing Strategy

## Scope
- Admin microservice (create events)
- Client microservice (list + purchase with DB transactions)
- LLM-driven booking (parse + confirm; no auto-book)
- Voice UI and accessibility behaviors (manual checks)
- Concurrency/transaction safety

## Types
1) Unit tests
   - Input validation (Admin)
   - Model helpers & parsing adapters (Client & LLM)
2) Integration tests
   - REST endpoints via supertest (Admin, Client, LLM)
   - DB writes/reads against an isolated test DB
3) Manual tests (end-to-end UX)
   - NL booking (text + voice), keyboard nav + screen reader, concurrent booking

## Environments
- Use a temp SQLite file (or `:memory:`) per test run
- Mock external LLM calls for determinism
