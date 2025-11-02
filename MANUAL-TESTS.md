# Manual Tests (Sprint 2)

## A. Natural Language (Text)
1) Type: "show events" → list appears in chat.
2) Type: "book two tickets for Jazz Night" → proposal appears (no auto-book).
3) Click Confirm → success; Events panel shows decreased tickets.

## B. Voice + Beeps
1) Click "🎙️ Talk" → start beep plays; speak: "book one ticket for Jazz Night".
2) Stop → stop double-beep; recognized text appears → Send → proposal → Confirm.

## C. Accessibility
1) Keyboard: Tab → focus visible on buttons & skip link; Enter activates.
2) Screen reader: live region announces purchases/errors in EventList.

## D. Concurrency
1) Seed small inventory (1).
2) In two terminals, POST purchase twice → expect one 200, one 409.
