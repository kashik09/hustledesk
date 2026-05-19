"""
Email utilities using Resend.

Requires RESEND_API_KEY environment variable.
Set RESEND_FROM_EMAIL for custom sender (default: onboarding@resend.dev for testing).
"""
import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY")

# Use Resend's test email in development, custom domain in production
FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "HustleDesk <onboarding@resend.dev>")
APP_URL = os.environ.get("APP_URL", "https://hustledesk.vercel.app")


def send_welcome_email(to_email, name=None):
    """
    Send welcome email to new user.
    """
    if not resend.api_key:
        print(f"[EMAIL] Skipping welcome email (no API key): {to_email}")
        return None

    display_name = name or "there"

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": f"Welcome to HustleDesk, {display_name}!",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #f97316;">Welcome to HustleDesk!</h1>
                    <p>Hi {display_name},</p>
                    <p>Thanks for joining HustleDesk! You can now:</p>
                    <ul>
                        <li>Track all your subscriptions in one place</li>
                        <li>See costs in your home currency (KES)</li>
                        <li>Set budgets and get alerts</li>
                        <li>View spending trends over time</li>
                    </ul>
                    <p>
                        <a href="{APP_URL}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Go to Dashboard
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        Happy tracking!<br>
                        The HustleDesk Team
                    </p>
                </div>
            """
        })
        print(f"[EMAIL] Welcome email sent to {to_email}: {result}")
        return result
    except Exception as e:
        print(f"[EMAIL] Failed to send welcome email to {to_email}: {e}")
        return None


def send_renewal_reminder(to_email, name, subscription_name, renewal_date, amount, currency):
    """
    Send renewal reminder email (3 days before renewal).
    """
    if not resend.api_key:
        print(f"[EMAIL] Skipping renewal reminder (no API key): {to_email}")
        return None

    display_name = name or "there"

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": f"Reminder: {subscription_name} renews in 3 days",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #f97316;">Subscription Renewal Reminder</h1>
                    <p>Hi {display_name},</p>
                    <p>Just a heads up that your subscription is renewing soon:</p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0;"><strong>{subscription_name}</strong></p>
                        <p style="margin: 8px 0 0; color: #666;">
                            {currency} {amount} &middot; Renews on {renewal_date}
                        </p>
                    </div>
                    <p>
                        <a href="{APP_URL}/subscriptions" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Subscriptions
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        — The HustleDesk Team
                    </p>
                </div>
            """
        })
        print(f"[EMAIL] Renewal reminder sent to {to_email}: {result}")
        return result
    except Exception as e:
        print(f"[EMAIL] Failed to send renewal reminder to {to_email}: {e}")
        return None


def send_weekly_summary(to_email, name, total_kes, subscription_count, top_categories):
    """
    Send weekly spending summary email.
    """
    if not resend.api_key:
        print(f"[EMAIL] Skipping weekly summary (no API key): {to_email}")
        return None

    display_name = name or "there"

    # Format top categories
    categories_html = ""
    for cat, amount in top_categories[:3]:
        categories_html += f"<li>{cat}: KES {amount:,.0f}</li>"

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": f"Your Weekly HustleDesk Summary",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #f97316;">Weekly Summary</h1>
                    <p>Hi {display_name},</p>
                    <p>Here's your subscription spending summary for this week:</p>

                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f97316;">
                            KES {total_kes:,.0f}
                        </p>
                        <p style="margin: 8px 0 0; color: #666;">
                            Monthly total across {subscription_count} subscription{'' if subscription_count == 1 else 's'}
                        </p>
                    </div>

                    {f'''
                    <p><strong>Top Categories:</strong></p>
                    <ul>{categories_html}</ul>
                    ''' if categories_html else ''}

                    <p>
                        <a href="{APP_URL}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Dashboard
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        — The HustleDesk Team
                    </p>
                </div>
            """
        })
        print(f"[EMAIL] Weekly summary sent to {to_email}: {result}")
        return result
    except Exception as e:
        print(f"[EMAIL] Failed to send weekly summary to {to_email}: {e}")
        return None


def send_budget_exceeded_alert(to_email, name, budget_kes, actual_kes):
    """
    Send alert when user exceeds their budget.
    """
    if not resend.api_key:
        print(f"[EMAIL] Skipping budget alert (no API key): {to_email}")
        return None

    display_name = name or "there"
    overage = actual_kes - budget_kes

    try:
        result = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": "Budget Alert: You've exceeded your subscription budget",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #ef4444;">Budget Exceeded</h1>
                    <p>Hi {display_name},</p>
                    <p>Your subscription spending has exceeded your monthly budget:</p>

                    <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
                        <p style="margin: 0;">
                            <strong>Budget:</strong> KES {budget_kes:,.0f}<br>
                            <strong>Actual:</strong> KES {actual_kes:,.0f}<br>
                            <strong>Over by:</strong> KES {overage:,.0f}
                        </p>
                    </div>

                    <p>Consider reviewing your subscriptions to find savings.</p>

                    <p>
                        <a href="{APP_URL}/subscriptions" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Review Subscriptions
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        — The HustleDesk Team
                    </p>
                </div>
            """
        })
        print(f"[EMAIL] Budget alert sent to {to_email}: {result}")
        return result
    except Exception as e:
        print(f"[EMAIL] Failed to send budget alert to {to_email}: {e}")
        return None
