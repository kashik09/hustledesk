"""
Cloudflare Turnstile verification utility.

Requires TURNSTILE_SECRET_KEY environment variable.
If not set, verification is skipped (for development).
"""
import os
import requests

TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile(token, remote_ip=None):
    """
    Verify a Turnstile token with Cloudflare.

    Returns True if valid, False if invalid.
    If TURNSTILE_SECRET_KEY is not set, returns True (dev mode).
    """
    if not TURNSTILE_SECRET_KEY:
        print("[TURNSTILE] Skipping verification (no secret key)")
        return True

    if not token:
        print("[TURNSTILE] No token provided")
        return False

    try:
        payload = {
            "secret": TURNSTILE_SECRET_KEY,
            "response": token,
        }
        if remote_ip:
            payload["remoteip"] = remote_ip

        response = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=10)
        result = response.json()

        if result.get("success"):
            print(f"[TURNSTILE] Verification successful")
            return True
        else:
            print(f"[TURNSTILE] Verification failed: {result.get('error-codes', [])}")
            return False

    except Exception as e:
        print(f"[TURNSTILE] Verification error: {e}")
        # Fail open in case of network errors (configurable)
        return False
