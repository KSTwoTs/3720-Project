| ID | Area   | Case                                      | Expected                          | Actual                          | Pass |
|----|--------|-------------------------------------------|-----------------------------------|---------------------------------|------|
| A1 | Admin  | Create valid event                        | 201 Created                       | 201 Created                     | ✅   |
| A2 | Admin  | Duplicate name+date                       | 409 Conflict (or idempotent 201)  | 409 Conflict                    | ✅   |
| C1 | Client | Purchase success                           | 200 + remaining decremented       | 200 + remaining decremented     | ✅   |
| C2 | Client | Purchase sold-out                          | 409 Conflict                      | 409 Conflict                    | ✅   |
| C3 | Client | Concurrent purchase of last ticket        | one 200, one 409; never oversell  | one 200, one 409                | ✅   |
| L1 | LLM    | Parse "book 2 for Jazz Night" (no booking)| intent=propose_booking, tickets=2 | same                            | ✅   |
| L2 | LLM    | Confirm leads to booking                  | 200 + eventId                     | 200 + eventId                   | ✅   |
| F1 | FE     | Chat proposal→confirm flow                | proposal text then booked message | same                            | ✅   |
| V1 | Voice  | Beep + interim + final text               | beeps, interim line, input filled | same                            | ✅   |
| A11y | A11y | Live region announces updates             | SR reads purchase/status updates  | same                            | ✅   |
