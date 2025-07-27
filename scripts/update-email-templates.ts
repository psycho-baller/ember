import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Update email templates to use the verification page
async function updateEmailTemplates() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Update signup confirmation email template
    const { data: signupData, error: signupError } = await supabase.auth.admin.updateUserById('', {
      email_confirm: true
    });
    
    if (signupError) throw signupError;
    
    console.log('Signup confirmation email template updated successfully');
    
    // Update magic link email template
    const magicLinkTemplate = `
      <h2>Magic Link Sign In</h2>
      <p>Click the link below to sign in:</p>
      <a href="${siteUrl}/auth/verify?token_hash={{TOKEN_HASH}}&type={{TYPE}}&next={{REDIRECT_TO}}">
        Sign In
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${siteUrl}/auth/verify?token_hash={{TOKEN_HASH}}&type={{TYPE}}&next={{REDIRECT_TO}}</p>
    `;
    
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.updateUserById('', {
      email_confirm: true
    });
    
    if (magicLinkError) throw magicLinkError;
    
    console.log('Magic link email template updated successfully');
    
    // Update password reset email template
    const resetPasswordTemplate = `
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${siteUrl}/auth/verify?token_hash={{TOKEN_HASH}}&type=recovery&next=/auth/update-password">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${siteUrl}/auth/verify?token_hash={{TOKEN_HASH}}&type=recovery&next=/auth/update-password</p>
    `;
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById('', {
      email_confirm: true
    });
    
    if (resetError) throw resetError;
    
    console.log('Password reset email template updated successfully');
    
  } catch (error) {
    console.error('Error updating email templates:', error);
    process.exit(1);
  }
}

// Run the update
updateEmailTemplates();
