import React, { useState } from "react";
import { SignupButton } from "../SignupButton";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          // Check if user has a pending request
          const { data: pendingRequest } = await supabase
            .from('signup_requests')
            .select('status')
            .eq('email', formData.email)
            .single();

          if (pendingRequest) {
            if (pendingRequest.status === 'pending') {
              setMessage({ 
                type: 'error', 
                text: 'Your account is pending approval. Please wait for an administrator to approve your request.' 
              });
            } else if (pendingRequest.status === 'rejected') {
              setMessage({ 
                type: 'error', 
                text: 'Your signup request was rejected. Please contact support.' 
              });
            } else {
              setMessage({ 
                type: 'error', 
                text: 'Please check your email for a password setup link.' 
              });
            }
          } else {
            setMessage({ type: 'error', text: 'Invalid email or password' });
          }
        } else {
          setMessage({ type: 'error', text: error.message });
        }
        setLoading(false);
        return;
      }

      // Check if user profile exists and is approved
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setMessage({ 
          type: 'error', 
          text: 'Account not found. Please contact support.' 
        });
        setLoading(false);
        return;
      }

      if (profile.approval_status !== 'approved') {
        await supabase.auth.signOut();
        setMessage({ 
          type: 'error', 
          text: 'Your account is not approved yet.' 
        });
        setLoading(false);
        return;
      }

      // Check if user is admin (from metadata or profile)
      const isAdminFromMetadata = data.user.user_metadata?.is_admin === true;
      const isAdminFromProfile = profile.is_admin === true;

      // Navigate immediately without showing success message
      if (isAdminFromMetadata || isAdminFromProfile) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard/overview', { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      setLoading(false);
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen w-full absolute inset-0 bg-gradient-to-r from-[#004c99] to-[#686d72d1]">
      <div className="flex gap-[5px]">
        <Card className="w-[417px] h-[525px] bg-[#ffffff2b] rounded-[30px_0px_0px_30px] border border-white backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
          <CardContent className="flex items-center justify-center h-full p-0">
                      <div className="flex flex-col w-[339px] items-center gap-[42px]">
                        <div className="flex flex-col items-center w-full gap-2">
                          <h2 className="w-full [font-family:'Jost',Helvetica] font-semibold text-white text-2xl text-center tracking-[0] leading-[normal]">
                  Welcome Back!
                </h2>
                <p className="w-full font-jost font-normal text-white text-md text-center tracking-[0] leading-[normal]">
                  We're glad to see you again. Log in to access
                  insights to revolutionize healthcare delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[417px] h-[525px] bg-[#ffffff2b] rounded-[0px_30px_30px_0px] border border-white backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
          <CardContent className="flex items-center justify-center h-full p-0">
            <div className="flex flex-col w-[286px] items-center gap-[22px]">
              <div className="flex flex-col w-56 items-center">
                <h2 className="w-full font-jost font-semibold text-white text-2xl text-center tracking-[0] leading-[normal]">
                  Sign in
                </h2>
              </div>

              <form onSubmit={handleSignIn} className="flex flex-col items-center gap-[15px] w-full">
              {message.text && (
  <div className={`w-full rounded-lg p-3 ${
    message.type === 'success' 
      ? 'bg-green-500/20 border border-green-500' 
      : 'bg-red-500/20 border border-red-500'
  }`}>
    <p className="text-white text-xs">
      {message.text}
    </p>
  </div>
)}

                <div className="flex flex-col items-center gap-7 w-full">
                  <div className="flex flex-col items-start gap-[31px] w-full">
                    <div className="flex flex-col items-start gap-2 w-full">
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />
                    </div>
                    <SignupButton
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00acff] rounded-[5px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-medium text-white text-md tracking-[0] leading-[normal] h-auto px-[15px] py-2.5 hover:bg-[#0099e6]"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </SignupButton>
                  </div>
                </div>

                <p className="w-full font-jost font-normal text-white text-md text-center tracking-[0] leading-[normal]">
                  Don't have an account?{" "}
                  <span className="font-bold cursor-pointer" onClick={() => window.location.href = '/signup'}>
                    Sign up
                  </span>
                </p>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
