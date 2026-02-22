import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file (if it exists)
load_dotenv()

SMTP_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("MAIL_PORT", "587"))
SMTP_USERNAME = os.getenv("MAIL_USERNAME")
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")

def send_simulation_complete_email(to_email: str, simulation_name: str, simulation_id: int, status: str):
    """
    Sends an email notification using standard smtplib.
    """
    if not to_email or not SMTP_USERNAME or not SMTP_PASSWORD:
        print("Email configuration missing or no recipient. Skipping email.")
        return

    subject = f"Proteus Simulation '{simulation_name}' {status}"
    
    # Simple HTML Body
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Simulation Update</h2>
                <p>Hello,</p>
                <p>Your simulation <strong>{simulation_name}</strong> has finished with status: <b style="color: {'green' if status == 'COMPLETED' else 'red'};">{status}</b>.</p>
                
                <p>You can view the results here:</p>
                <a href="http://localhost:3000/simulation/{simulation_id}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Results</a>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    Run ID: {simulation_id}<br>
                    Proteus Automated Pipeline
                </p>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to_email
    
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
