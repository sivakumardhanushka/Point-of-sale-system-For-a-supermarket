/**
 * useSms.js
 * ---------
 * Custom React hook for sending SMS messages via the Twilio REST API.
 *
 * SECURITY NOTE:
 *     These credentials are hardcoded for local development only.
 *     Before deploying to production, move them to environment variables
 *     and route all Twilio calls through a backend server so credentials
 *     are never exposed to the browser.
 *
 * TODO: Replace the placeholder values below with your real Twilio credentials.
 *       Account SID  -> https://console.twilio.com  (starts with "AC")
 *       Auth Token   -> https://console.twilio.com  (under Account Info)
 *       From Number  -> Your purchased Twilio phone number (e.g. "+12015551234")
 */

import { useState } from 'react';

// --- Twilio Credentials (replace with your own) ---
const TWILIO_ACCOUNT_SID = 'ACb7d8f718fa4ee165d4cff4747d2ff442';   // e.g. "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
const TWILIO_AUTH_TOKEN = 'c787d2926f8a652ac77a8d949ddc5417';    // e.g. "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
const TWILIO_FROM_NUMBER = '+94757161886';  // e.g. "+12015551234"
// ---------------------------------------------------

/**
 * Formats a raw mobile number into E.164 international format.
 * Sri Lankan example: "0771234567" -> "+94771234567"
 *
 * @param {string} rawNumber - raw mobile input from UI
 * @returns {string} E.164 formatted number
 */
function toE164(rawNumber) {
  if (!rawNumber) return '';
  const stripped = rawNumber.trim().replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('00')) return '+' + stripped.slice(2);
  if (stripped.startsWith('0') && stripped.length === 10)
    return '+94' + stripped.slice(1);
  return '+' + stripped;
}

/**
 * useSms hook
 *
 * @returns {{
 *   sendSms: (toNumber: string, messageBody: string) => Promise<void>,
 *   loading:  boolean,
 *   result:   { sid: string, status: string } | null,
 *   error:    string | null,
 *   reset:    () => void
 * }}
 */
export function useSms() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const sendSms = async (toNumber, messageBody) => {
    if (!toNumber || !messageBody) {
      setError('Recipient number and message body are required.');
      return;
    }

    const to = toE164(toNumber);

    if (!/^\+\d{7,15}$/.test(to)) {
      setError(`Invalid phone number format: "${toNumber}". Please include country code.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

      const body = new URLSearchParams({
        To: to,
        From: TWILIO_FROM_NUMBER,
        Body: messageBody,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Twilio error ${response.status}`);
      }

      setResult({ sid: data.sid, status: data.status });
    } catch (err) {
      setError(err.message || 'Failed to send SMS. Please check credentials and network.');
    } finally {
      setLoading(false);
    }
  };

  return { sendSms, loading, result, error, reset };
}
