// ─────────────────────────────────────────────────────────────
// Email Service — Provider-Agnostic SMTP & Development Console
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { HttpError } from "../lib/errors";

export interface PassConfirmationData {
  id?: string;
  passNumber: string;
  fullName: string;
  email: string;
  phone: string;
  participantCategory?: string;
  collegeName?: string | null;
  quantity: number;
  createdAt?: string | Date;
  pass?: {
    name?: string;
    subtitle?: string | null;
    price?: number | null;
  } | null;
  payment?: {
    amount?: number | null;
    status?: string;
    transactionId?: string | null;
    gatewayReference?: string | null;
    method?: string | null;
    paidAt?: string | Date | null;
  } | null;
  holders?: Array<{
    holderIndex?: number;
    fullName: string;
    email: string;
    phone: string;
  }>;
}

export interface RegistrationConfirmationData {
  id?: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  participantCategory?: string;
  collegeName?: string | null;
  createdAt?: string | Date;
  event?: {
    name?: string;
    description?: string;
    fee?: number;
    date?: string | null;
    day?: string | null;
    time?: string | null;
    venue?: string | null;
    registrationType?: string;
    category?: {
      name?: string;
    } | null;
  } | null;
  team?: {
    name?: string;
    leaderName?: string | null;
    members?: Array<{
      fullName: string;
      email: string;
      phone: string;
    }>;
  } | null;
  payment?: {
    amount?: number | null;
    status?: string;
    transactionId?: string | null;
    gatewayReference?: string | null;
    method?: string | null;
  } | null;
}

export interface EmailProvider {
  sendOtp(email: string, otp: string, purpose: string): Promise<void>;
  sendRegistrationConfirmation(email: string, registration: RegistrationConfirmationData): Promise<void>;
  sendPassConfirmation(email: string, passPurchase: PassConfirmationData): Promise<void>;
  verifyConnection?(): Promise<{ success: boolean; message: string }>;
}

/**
 * Human-readable purpose description for email templates
 */
function formatPurpose(purpose: string): { title: string; description: string } {
  switch (purpose) {
    case "EVENT_REGISTRATION":
      return {
        title: "Event Registration Verification",
        description: "verify your email address for your Euphoria 2026 event registration",
      };
    case "PASS_PURCHASE":
      return {
        title: "Festival Pass Verification",
        description: "verify your email address for your Euphoria 2026 festival pass purchase",
      };
    case "GUEST_LOOKUP":
      return {
        title: "My Tickets Access Code",
        description: "access your Euphoria 2026 festival passes and event registrations",
      };
    case "REGISTRATION_PAYMENT":
      return {
        title: "Registration Payment Verification",
        description: "authorize your registration payment",
      };
    case "PASS_PAYMENT":
      return {
        title: "Festival Pass Payment Verification",
        description: "authorize your festival pass purchase payment",
      };
    default:
      return {
        title: "Verification Code",
        description: "complete your verification request",
      };
  }
}

/**
 * Generates responsive branded HTML email for OTP delivery
 */
export function generateOtpHtml(otp: string, purpose: string): string {
  const { title } = formatPurpose(purpose);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title} - Euphoria 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06030a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #06030a; padding: 24px 10px; box-sizing: border-box;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; margin: 0 auto; background: #0c0612; background: linear-gradient(180deg, #140b1e 0%, #0c0612 100%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
      <tr>
        <td style="padding: 32px 24px 22px; text-align: center; background: linear-gradient(135deg, rgba(162, 50, 160, 0.3) 0%, rgba(62, 238, 213, 0.2) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #3EEED5; margin-bottom: 6px;">
            SAGE University Indore • Annual Fest
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff;">
            SAGE EUPHORIA 2026
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px; text-align: center;">
          <p style="font-size: 15px; line-height: 1.6; color: #F8FAFC; margin: 0 0 22px;">
            Your verification OTP is:
          </p>
          <div style="background: #181126; border: 1px solid #3EEED5; border-radius: 14px; padding: 20px 16px; margin: 0 auto 22px; max-width: 320px;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #3EEED5; margin-bottom: 8px;">
              Verification OTP
            </div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.3em; color: #ffffff; padding-left: 0.3em; margin: 0;">
              ${otp}
            </div>
          </div>
          <div style="background: #181126; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 10px; padding: 14px 18px; font-size: 13px; line-height: 1.55; color: #E2E8F0; margin: 0 0 20px; text-align: center;">
            ⏰ <strong style="color: #ffffff;">This OTP is valid for 10 minutes.</strong><br>
            For your security, never share this verification code with anyone.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #94A3B8; line-height: 1.5;">
          This automated email was sent by SAGE Euphoria 2026.<br>
          If you did not request this verification code, you can safely ignore this email.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim();
}

/**
 * Generates plain text fallback for OTP delivery
 */
function generateOtpText(otp: string): string {
  return `
SAGE EUPHORIA 2026
====================================================

Your verification OTP is:

${otp}

This OTP is valid for 10 minutes.
For your security, never share this verification code with anyone.

If you did not request this code, you can safely ignore this message.
`.trim();
}

/**
 * Generates responsive branded HTML email for Pass Purchase Confirmation
 */
export function generatePassPurchaseConfirmationHtml(p: PassConfirmationData): string {
  const totalAmount =
    p.payment?.amount ?? (p.pass?.price ? p.pass.price * p.quantity : 0);
  const formattedDate = p.createdAt
    ? new Date(p.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const passHolders = p.holders && p.holders.length > 0 ? p.holders : [];
  const additionalHolders = passHolders.filter((h) => (h.holderIndex || 0) > 1);

  let holdersHtml = "";
  if (p.quantity > 1) {
    holdersHtml = `
      <div style="margin-top: 22px; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #F59E0B; margin-bottom: 10px;">
          Pass Recipients (${p.quantity} Passes Total)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #181126; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden;">
          <thead>
            <tr style="background: rgba(255,255,255,0.08); text-align: left; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
              <th style="padding: 10px 12px;">Pass</th>
              <th style="padding: 10px 12px;">Name</th>
              <th style="padding: 10px 12px;">Email</th>
              <th style="padding: 10px 12px;">Phone</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px 12px; font-weight: 700; color: #F59E0B;">Pass 1 (Buyer)</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #ffffff;">${p.fullName}</td>
              <td style="padding: 10px 12px; color: #E2E8F0; word-break: break-word;">${p.email}</td>
              <td style="padding: 10px 12px; color: #CBD5E1; font-family: monospace, Courier, sans-serif; white-space: nowrap;">${p.phone}</td>
            </tr>
            ${additionalHolders
              .map(
                (h, idx) => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 10px 12px; font-weight: 600; color: #E2E8F0;">Pass ${h.holderIndex || idx + 2}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #ffffff;">${h.fullName}</td>
              <td style="padding: 10px 12px; color: #E2E8F0; word-break: break-word;">${h.email}</td>
              <td style="padding: 10px 12px; color: #CBD5E1; font-family: monospace, Courier, sans-serif; white-space: nowrap;">${h.phone}</td>
            </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Euphoria 2026 — Pass Purchase Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06030a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #06030a; padding: 24px 10px; box-sizing: border-box;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #0c0612; background: linear-gradient(180deg, #140b1e 0%, #0c0612 100%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
      
      <!-- Header -->
      <tr>
        <td style="padding: 32px 24px 22px; text-align: center; background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(162, 50, 160, 0.3) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #F59E0B; margin-bottom: 6px;">
            SAGE University Indore • Annual Fest
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff;">
            SAGE EUPHORIA 2026
          </h1>
          <div style="display: inline-block; margin-top: 12px; padding: 5px 16px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #34D399;">
            ✓ Pass Purchase Confirmed
          </div>
        </td>
      </tr>

      <!-- Main Body -->
      <tr>
        <td style="padding: 28px 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #F8FAFC; margin: 0 0 20px; text-align: center;">
            Hello <strong style="color: #ffffff;">${p.fullName}</strong>, thank you for purchasing your pass for <strong>SAGE Euphoria 2026</strong>. Your payment was processed successfully.
          </p>

          <!-- Order Snapshot Box -->
          <div style="background: #181126; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;">
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Pass Type</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 700; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${p.pass?.name || "Euphoria General Pass"}</td>
              </tr>
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Order Number</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-family: monospace, Courier, sans-serif; font-weight: 700; color: #F59E0B; text-align: right; vertical-align: top; word-break: break-all; border-bottom: 1px solid rgba(255,255,255,0.08);">${p.passNumber}</td>
              </tr>
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Quantity</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 700; color: #ffffff; text-align: right; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">${p.quantity} Pass(es)</td>
              </tr>
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Amount Paid</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 700; color: #34D399; font-size: 15px; text-align: right; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">₹${totalAmount}</td>
              </tr>
              ${p.payment?.transactionId ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Transaction Ref</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-family: monospace, Courier, sans-serif; font-size: 11px; font-weight: 600; color: #E2E8F0; text-align: right; vertical-align: top; word-break: break-all; border-bottom: 1px solid rgba(255,255,255,0.08);">${p.payment.transactionId}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top;">Order Placed</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; color: #CBD5E1; text-align: right; vertical-align: top; word-break: break-word;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Critical Delivery Notice Box -->
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 18px 20px; margin-bottom: 22px; text-align: left;">
            <div style="font-size: 12px; font-weight: 700; color: #F59E0B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
              📦 Digital Pass Delivery Information
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #F8FAFC;">
              • <strong>Expected Delivery:</strong> Within <strong>1–2 working days</strong>.<br>
              • The digital pass(es) will be delivered to the registered email address(es).<br>
              • <strong>No additional payment is required.</strong>
            </div>
            <div style="font-size: 11px; line-height: 1.5; color: #E2E8F0; margin-top: 10px; border-top: 1px dashed rgba(245, 158, 11, 0.3); padding-top: 8px;">
              Digital festival passes are generated and distributed through the separate college ticketing administration system. Please keep this order confirmation email and order number for verification upon entry.
            </div>
          </div>

          ${holdersHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 22px 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #94A3B8; line-height: 1.6;">
          SAGE Euphoria 2026 • SAGE University Indore<br>
          Bypass Road, Rau, Indore, Madhya Pradesh 452020<br>
          This is an official transactional purchase confirmation.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim();
}

/**
 * Generates plain text fallback for Pass Purchase Confirmation
 */
function generatePassPurchaseConfirmationText(p: PassConfirmationData): string {
  const totalAmount =
    p.payment?.amount ?? (p.pass?.price ? p.pass.price * p.quantity : 0);
  const passHolders = p.holders && p.holders.length > 0 ? p.holders : [];
  const additionalHolders = passHolders.filter((h) => (h.holderIndex || 0) > 1);

  let holdersText = "";
  if (p.quantity > 1) {
    holdersText = `
PASS RECIPIENTS (${p.quantity} TOTAL):
----------------------------------------------------
1. ${p.fullName} (Primary Purchaser) - ${p.email} | ${p.phone}
${additionalHolders.map((h, idx) => `${h.holderIndex || idx + 2}. ${h.fullName} - ${h.email} | ${h.phone}`).join("\n")}
`;
  }

  return `
SAGE EUPHORIA 2026 — PASS PURCHASE CONFIRMED
====================================================

Hello ${p.fullName},

Your festival pass purchase for SAGE Euphoria 2026 is confirmed!
Payment was successful.

ORDER DETAILS:
----------------------------------------------------
Pass Type:      ${p.pass?.name || "Euphoria General Pass"}
Order Number:   ${p.passNumber}
Quantity:       ${p.quantity} Pass(es)
Total Amount:   ₹${totalAmount}
Payment Status: SUCCESS
Transaction ID: ${p.payment?.transactionId || "Confirmed"}

DELIVERY NOTICE:
----------------------------------------------------
• Expected delivery: Within 1–2 working days.
• The digital pass(es) will be delivered to the registered email address(es).
• No additional payment is required.

Please note: Digital passes are generated and delivered through the college's separate ticketing system. Keep this email and your order number handy.
${holdersText}
----------------------------------------------------
SAGE Euphoria 2026 • SAGE University Indore
Bypass Road, Rau, Indore, Madhya Pradesh 452020
`.trim();
}

/**
 * Generates responsive branded HTML email for Event Registration Confirmation
 */
export function generateEventRegistrationConfirmationHtml(reg: RegistrationConfirmationData): string {
  const event = reg.event || {};
  const team = reg.team;
  const isGroup = event.registrationType === "GROUP" || Boolean(team);
  const formattedFee = reg.payment?.amount
    ? `₹${reg.payment.amount}`
    : event.fee
    ? `₹${event.fee}`
    : "Free Event";

  let teamHtml = "";
  if (isGroup && team) {
    teamHtml = `
      <div style="margin-top: 20px; text-align: left; background: #181126; border: 1px solid rgba(162, 50, 160, 0.35); border-radius: 12px; padding: 16px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #F0ABFC; margin-bottom: 8px;">
          Team Information
        </div>
        <div style="font-size: 13px; color: #ffffff; margin-bottom: 4px;">
          <strong style="color: #E2E8F0;">Team Name:</strong> <span style="color: #ffffff; font-weight: 700;">${team.name}</span>
        </div>
        <div style="font-size: 12px; color: #CBD5E1; margin-bottom: 10px;">
          <strong style="color: #E2E8F0;">Team Leader:</strong> <span style="color: #ffffff;">${team.leaderName || reg.fullName}</span>
        </div>
        ${
          team.members && team.members.length > 0
            ? `
          <div style="font-size: 11px; color: #E2E8F0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Registered Team Members:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #F8FAFC; line-height: 1.6;">
            ${team.members
              .map((m) => `<li><span style="color: #ffffff; font-weight: 600;">${m.fullName}</span> (<span style="color: #E2E8F0;">${m.email}</span>${m.phone ? ` • <span style="color: #CBD5E1;">${m.phone}</span>` : ""})</li>`)
              .join("")}
          </ul>
        `
            : ""
        }
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Euphoria 2026 — Event Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06030a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #06030a; padding: 24px 10px; box-sizing: border-box;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #0c0612; background: linear-gradient(180deg, #140b1e 0%, #0c0612 100%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
      
      <!-- Header -->
      <tr>
        <td style="padding: 32px 24px 22px; text-align: center; background: linear-gradient(135deg, rgba(62, 238, 213, 0.22) 0%, rgba(162, 50, 160, 0.3) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #3EEED5; margin-bottom: 6px;">
            SAGE University Indore • Annual Fest
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff;">
            SAGE EUPHORIA 2026
          </h1>
          <div style="display: inline-block; margin-top: 12px; padding: 5px 16px; background: rgba(62, 238, 213, 0.2); border: 1px solid #3EEED5; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #3EEED5;">
            ✓ Event Registration Confirmed
          </div>
        </td>
      </tr>

      <!-- Main Body -->
      <tr>
        <td style="padding: 28px 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #F8FAFC; margin: 0 0 20px; text-align: center;">
            Hello <strong style="color: #ffffff;">${reg.fullName}</strong>, your registration for <strong>${event.name || "Euphoria Event"}</strong> has been confirmed!
          </p>

          <!-- Event Details Box -->
          <div style="background: #181126; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;">
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Event Name</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 700; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${event.name || "Event"}</td>
              </tr>
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Registration ID</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-family: monospace, Courier, sans-serif; font-weight: 700; color: #3EEED5; text-align: right; vertical-align: top; word-break: break-all; border-bottom: 1px solid rgba(255,255,255,0.08);">${reg.registrationNumber}</td>
              </tr>
              ${reg.participantCategory ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Participant Category</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 600; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${reg.participantCategory === "SAGE" ? "SAGE Student" : reg.participantCategory === "OTHER_COLLEGE" ? "Other College/School Student" : "General"}</td>
              </tr>
              ` : ""}
              ${event.category?.name ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Category</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 600; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${event.category.name}</td>
              </tr>
              ` : ""}
              ${event.date ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Date</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 600; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${event.date}${event.day ? ` (${event.day})` : ""}</td>
              </tr>
              ` : ""}
              ${event.time ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Time</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 600; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${event.time}</td>
              </tr>
              ` : ""}
              ${event.venue ? `
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.08);">Venue</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 600; color: #ffffff; text-align: right; vertical-align: top; word-break: break-word; border-bottom: 1px solid rgba(255,255,255,0.08);">${event.venue}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="width: 38%; min-width: 110px; padding: 8px 10px 8px 0; color: #E2E8F0; font-weight: 600; vertical-align: top;">Registration Fee</td>
                <td style="width: 62%; padding: 8px 0 8px 10px; font-weight: 700; color: #34D399; font-size: 15px; text-align: right; vertical-align: top;">${formattedFee}</td>
              </tr>
            </table>
          </div>

          ${teamHtml}

          <!-- Important Guidelines -->
          <div style="background: #181126; border: 1px solid rgba(62, 238, 213, 0.25); border-radius: 12px; padding: 18px 20px; margin-top: 20px; text-align: left;">
            <div style="font-size: 12px; font-weight: 700; color: #3EEED5; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
              📋 Important Event Instructions
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #F8FAFC;">
              • Please report to the event venue at least 15 minutes before the scheduled time.<br>
              • Carry your college/school ID card for identity verification at the help desk.<br>
              • Keep your Registration ID (<strong style="color: #3EEED5;">${reg.registrationNumber}</strong>) handy during event reporting.
            </div>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 22px 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #94A3B8; line-height: 1.6;">
          SAGE Euphoria 2026 • SAGE University Indore<br>
          Bypass Road, Rau, Indore, Madhya Pradesh 452020<br>
          This is an official transactional event registration confirmation.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim();
}

/**
 * Generates plain text fallback for Event Registration Confirmation
 */
function generateEventRegistrationConfirmationText(reg: RegistrationConfirmationData): string {
  const event = reg.event || {};
  const team = reg.team;
  const isGroup = event.registrationType === "GROUP" || Boolean(team);
  const formattedFee = reg.payment?.amount
    ? `₹${reg.payment.amount}`
    : event.fee
    ? `₹${event.fee}`
    : "Free Event";

  let teamText = "";
  if (isGroup && team) {
    teamText = `
TEAM DETAILS:
----------------------------------------------------
Team Name:   ${team.name}
Team Leader: ${team.leaderName || reg.fullName}
${
  team.members && team.members.length > 0
    ? `Team Members:\n${team.members.map((m, i) => `  ${i + 1}. ${m.fullName} (${m.email}${m.phone ? ` • ${m.phone}` : ""})`).join("\n")}`
    : ""
}
`;
  }

  return `
SAGE EUPHORIA 2026 — EVENT REGISTRATION CONFIRMED
====================================================

Hello ${reg.fullName},

Your registration for ${event.name || "Euphoria Event"} has been confirmed!

REGISTRATION DETAILS:
----------------------------------------------------
Registration ID:      ${reg.registrationNumber}
Event Name:           ${event.name || "Event"}
${reg.participantCategory ? `Participant Category: ${reg.participantCategory === "SAGE" ? "SAGE Student" : reg.participantCategory === "OTHER_COLLEGE" ? "Other College/School Student" : "General"}\n` : ""}Category:             ${event.category?.name || "N/A"}
Date & Day:      ${event.date || "TBA"}${event.day ? ` (${event.day})` : ""}
Time:            ${event.time || "TBA"}
Venue:           ${event.venue || "Campus Grounds"}
Fee:             ${formattedFee}
${teamText}
IMPORTANT INSTRUCTIONS:
----------------------------------------------------
• Please arrive at the venue at least 15 minutes before the scheduled time.
• Carry your college/school ID card for on-ground verification.
• Keep your Registration ID (${reg.registrationNumber}) ready at the event desk.

----------------------------------------------------
SAGE Euphoria 2026 • SAGE University Indore
Bypass Road, Rau, Indore, Madhya Pradesh 452020
`.trim();
}

/**
 * Production-ready, provider-agnostic SMTP transport
 */
class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;
  private fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465;
    const user = process.env.SMTP_USER;
    // Strip whitespace in case App Password was pasted with spaces
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : undefined;

    const rawFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
    this.fromAddress = rawFrom
      ? rawFrom.includes("<")
        ? rawFrom
        : `"SAGE Euphoria 2026" <${rawFrom}>`
      : `"SAGE Euphoria 2026" <no-reply@sageuniversity.in>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return { success: true, message: "SMTP connection verified successfully" };
    } catch (err: any) {
      return { success: false, message: err?.message || "SMTP verification failed" };
    }
  }

  public async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    const subject = "SAGE Euphoria 2026 — Your Verification OTP";

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text: generateOtpText(otp),
        html: generateOtpHtml(otp, purpose),
      });
    } catch (error: any) {
      console.error(
        "[EmailService] SMTP email delivery failed for recipient:",
        email,
        "Reason:",
        error?.message || "Unknown error"
      );
      throw new HttpError(
        `Failed to deliver verification email via SMTP: ${error?.message || "Check SMTP settings"}`,
        500
      );
    }
  }

  public async sendRegistrationConfirmation(
    email: string,
    registration: RegistrationConfirmationData
  ): Promise<void> {
    const subject = "Euphoria 2026 — Event Registration Confirmed";

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text: generateEventRegistrationConfirmationText(registration),
        html: generateEventRegistrationConfirmationHtml(registration),
      });
      console.log(
        `[EmailService] Event registration confirmation email sent to ${email} for reg ${registration.registrationNumber}`
      );
    } catch (err: any) {
      console.error(
        `[EmailService] Failed to send registration confirmation email to ${email}:`,
        err?.message
      );
      throw err;
    }
  }

  public async sendPassConfirmation(
    email: string,
    passPurchase: PassConfirmationData
  ): Promise<void> {
    const subject = "Euphoria 2026 — Pass Purchase Confirmed";

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text: generatePassPurchaseConfirmationText(passPurchase),
        html: generatePassPurchaseConfirmationHtml(passPurchase),
      });
      console.log(
        `[EmailService] Pass purchase confirmation email sent to ${email} for pass ${passPurchase.passNumber}`
      );
    } catch (err: any) {
      console.error(
        `[EmailService] Failed to send pass confirmation email to ${email}:`,
        err?.message
      );
      throw err;
    }
  }
}

/**
 * Console/Mock transport for local development ONLY.
 * NEVER active when NODE_ENV === 'production'.
 */
class ConsoleEmailProvider implements EmailProvider {
  public async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`
┌──────────────────────────────────────────────────────────┐
│ 📧 [MOCK EMAIL SERVICE] OTP DISPATCH (DEV ONLY)          │
├──────────────────────────────────────────────────────────┤
│ To:        ${email.padEnd(45)} │
│ Purpose:   ${purpose.padEnd(45)} │
│ Code:      ${otp.padEnd(45)} │
│ Valid For: 10 minutes                                    │
│ Time:      ${timestamp.padEnd(45)} │
└──────────────────────────────────────────────────────────┘
`);
  }

  public async sendRegistrationConfirmation(
    email: string,
    registration: RegistrationConfirmationData
  ): Promise<void> {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│ 🎟️  [MOCK EMAIL SERVICE] REGISTRATION CONFIRMED          │
├──────────────────────────────────────────────────────────┤
│ To:        ${email.padEnd(45)} │
│ Reg No:    ${(registration.registrationNumber || "N/A").padEnd(45)} │
│ Event:     ${(registration.event?.name || "Euphoria Event").slice(0, 45).padEnd(45)} │
└──────────────────────────────────────────────────────────┘
`);
  }

  public async sendPassConfirmation(
    email: string,
    passPurchase: PassConfirmationData
  ): Promise<void> {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│ 🎟️  [MOCK EMAIL SERVICE] PASS PURCHASE CONFIRMED         │
├──────────────────────────────────────────────────────────┤
│ To:        ${email.padEnd(45)} │
│ Pass No:   ${(passPurchase.passNumber || "N/A").padEnd(45)} │
│ Quantity:  ${String(passPurchase.quantity).padEnd(45)} │
│ Pass Name: ${(passPurchase.pass?.name || "Euphoria Pass").slice(0, 45).padEnd(45)} │
└──────────────────────────────────────────────────────────┘
`);
  }
}

/**
 * Service instance managing active email transport.
 * Strict rule: Production NEVER falls back to console mock delivery.
 */
class EmailServiceInstance {
  private provider: EmailProvider | null = null;

  private getProvider(): EmailProvider {
    if (this.provider) {
      return this.provider;
    }

    const isProduction = process.env.NODE_ENV === "production";
    const emailProviderMode = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
    const hasSmtpConfig = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS.trim() !== ""
    );

    // Production mode: MUST use real email delivery. NEVER fall back to console logging.
    if (isProduction) {
      if (!hasSmtpConfig) {
        console.error(
          "[EmailService] CRITICAL: SMTP configuration is missing in production environment."
        );
        throw new HttpError(
          "Email verification service is temporarily unavailable. Please contact support.",
          500
        );
      }
      this.provider = new SmtpEmailProvider();
      return this.provider;
    }

    // Development mode:
    // If SMTP credentials exist OR mode is explicitly "smtp", use SmtpEmailProvider
    if (hasSmtpConfig || emailProviderMode === "smtp") {
      this.provider = new SmtpEmailProvider();
    } else {
      this.provider = new ConsoleEmailProvider();
    }

    return this.provider;
  }

  public setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    const provider = this.getProvider();
    if ("verifyConnection" in provider && typeof (provider as any).verifyConnection === "function") {
      return await (provider as any).verifyConnection();
    }
    return { success: false, message: "Active email provider is ConsoleEmailProvider (mock mode)" };
  }

  public async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    const provider = this.getProvider();
    await provider.sendOtp(email, otp, purpose);
  }

  public async sendRegistrationConfirmation(
    email: string,
    registration: RegistrationConfirmationData
  ): Promise<void> {
    const provider = this.getProvider();
    await provider.sendRegistrationConfirmation(email, registration);
  }

  public async sendPassConfirmation(
    email: string,
    passPurchase: PassConfirmationData
  ): Promise<void> {
    const provider = this.getProvider();
    await provider.sendPassConfirmation(email, passPurchase);
  }
}

export const emailService = new EmailServiceInstance();

