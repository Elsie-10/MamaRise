#This is the backend readme
================================================================================
MAMARISE BACKEND - PHONE-BASED PASSWORD RECOVERY (OTP) - ALL FILES
================================================================================
This adds forgot-password / reset-password via SMS OTP to your existing
auth module. Some of these are NEW files, some are EDITS to files you
already have. Each is marked clearly below.

HOW TO USE:
For each section, either CREATE the new file at that path, or make the
EDIT described to your existing file. Go top to bottom - order matters
because later files import from earlier ones.
================================================================================


>>> NEW FILE: app/models/otp.py
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: app/models/__init__.py  (REPLACE the whole file with this)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> NEW FILE: app/services/__init__.py
--------------------------------------------------------------------------------
(this file is intentionally empty - just create it empty, in a new
"services" folder inside "app")
--------------------------------------------------------------------------------
<<< END FILE


>>> NEW FILE: app/services/sms_service.py
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> NEW FILE: app/services/otp_service.py
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: app/api/v1/auth/schemas.py  (REPLACE the whole file with this)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: app/api/v1/auth/routes.py  (REPLACE the whole file with this)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: app/models/user.py  (REPLACE the whole file with this - includes phone_number)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: app/config.py  (REPLACE the whole file with this - adds OTP settings)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


>>> EDIT: .env.example  (REPLACE the whole file with this)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE
(Also copy the new AT_* and OTP_* lines into your REAL ".env" file, not
just ".env.example". You can leave AT_USERNAME and AT_API_KEY blank for
now - the app will print OTP codes to your terminal instead of texting
them, which is exactly how it was tested.)


>>> EDIT: requirements.txt  (REPLACE the whole file with this)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
<<< END FILE


================================================================================
AFTER ALL FILES ARE IN PLACE, RUN THIS:
================================================================================

pip install -r requirements.txt --break-system-packages

Add these lines to your real .env (leave AT_USERNAME/AT_API_KEY blank for now):


Since this adds a new table (otp_codes), generate a fresh migration:
flask db migrate -m "Add otp_codes table for password recovery"
flask db upgrade

flask run

================================================================================
TEST IT (dev mode - OTP will print in your terminal, not sent as real SMS)
================================================================================

1. Request a reset code:
curl -X POST http://127.0.0.1:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "0712345678"}'

Watch your terminal running "flask run" - you'll see a line like:
[DEV SMS] To: +254712345678 | Message: Your MamaRise password reset code is 123456...

2. Copy that 6-digit code and reset the password:
curl -X POST http://127.0.0.1:5000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "0712345678", "otp_code": "123456", "new_password": "NewPass123!"}'

3. Confirm login works with the new password:
curl -X POST http://127.0.0.1:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "NewPass123!"}'

================================================================================