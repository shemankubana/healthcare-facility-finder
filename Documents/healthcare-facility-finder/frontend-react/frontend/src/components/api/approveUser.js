import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId } = req.body;

  try {
    // Get the signup request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError) throw new Error('Signup request not found');

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

    // Create the user account with temporary password
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: request.first_name,
        last_name: request.last_name,
        role: request.role
      }
    });

    if (userError) throw userError;

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: user.user.id,
        first_name: request.first_name,
        last_name: request.last_name,
        email: request.email,
        role: request.role,
        approval_status: 'approved',
        approved_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // Update signup request status
    await supabaseAdmin
      .from('signup_requests')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      }
    });

    if (resetError) console.error('Failed to send password setup email:', resetError);

    res.status(200).json({ 
      success: true, 
      message: 'User approved and password setup email sent' 
    });

  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
}