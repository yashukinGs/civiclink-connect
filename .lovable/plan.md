# Automated End-to-End Test: Register → Verify → Submit Complaint

Goal: main browser automation se poora flow chalata hoon aur jahan bhi fail ho, exact error report karta hoon.

## Test steps

1. `/register` open karke naya account banao (test email + password).
2. Cognito 6-digit verification code ka step: **code aapke email pe aayega, mere paas nahi**. Jab test us screen pe rukega, main aapse code maangunga aur wahi enter karke aage badhunga.
3. Code verify hone ke baad `/login` se sign in.
4. `/report` pe jaake ek test complaint submit (title, description, category, location).
5. `/community` pe verify ki complaint public feed me dikh rahi hai, aur `/track` pe ticket ID se trackable hai.

## Kya check hoga har step pe

- Screen pe dikhne wala error/toast message
- Browser console errors
- Server function errors (Cognito, Supabase insert, DynamoDB mirror, S3 upload)
- Final URL aur redirect behaviour

## Aapse kya chahiye

- **Test email address** jiska inbox aap abhi check kar sakte ho (verification code ke liye)
- **Password** jo use karun (ya main ek strong password generate kar lun)
- Code aane pe wo 6 digits mujhe chat me dena

## Technical notes

- Playwright headless Chromium, localhost:8080 dev server pe.
- Test script `/tmp/browser/` me rahega — project files me koi change nahi hoga.
- Ye test-only run hai; jo bhi bug mile uska fix alag step me karunga (approval leke).
- Test se ek real Cognito user + ek real complaint row banegi; chaho to baad me cleanup kar dunga.
