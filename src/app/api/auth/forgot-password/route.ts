import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { checkSecurity } from '@/lib/apiSecurity';

export async function POST(request: Request) {
  const sec = await checkSecurity(request, { requireAuth: false, rateLimitCount: 5 });
  if (!sec.authorized) return sec.response;

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Check if user exists (to prevent enumeration, we just proceed, but we need to generate link)
    // Wait, generateLink fails if the user doesn't exist
    
    // Create the recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://app.mededuai.com'}/auth/reset-password`
      }
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError.message);
      // If user not found, we still return success to prevent email enumeration
      if (linkError.message.includes('User not found')) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to generate reset link. Please try again.' }, { status: 500 });
    }

    const resetUrl = linkData.properties?.action_link;
    if (!resetUrl) {
      return NextResponse.json({ error: 'Failed to generate reset link. Please try again.' }, { status: 500 });
    }

    // Send email using Resend
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="background: #f8fafc; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset the password for your MedEduAI account. Click the button below to choose a new password.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #0ea5e9; font-size: 12px; word-break: break-all; margin-bottom: 24px;">
            ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
          <p style="color: #94a3b8; font-size: 12px;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'MedEduAI Support <noreply@mededuai.com>',
      to: email,
      subject: 'Reset your MedEduAI password',
      html: htmlBody,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      return NextResponse.json({ error: 'Failed to send recovery email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
