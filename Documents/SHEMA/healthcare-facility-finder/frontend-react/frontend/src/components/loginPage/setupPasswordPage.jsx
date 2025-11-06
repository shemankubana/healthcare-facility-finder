import React, { useState, useEffect } from "react";
import { SignupButton } from "../SignupButton";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const SetPasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Check if user came from invitation email
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password setup mode activated");
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
        return;
      }

      setMessage({ 
        type: 'success', 
        text: 'Password set successfully! Redirecting to dashboard...' 
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/overview', { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Password setup error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full absolute inset-0 bg-gradient-to-r from-[#004c99] to-[#686d72d1]">
      <div className="flex gap-[5px]">
        <Card className="w-[417px] h-[525px] bg-[#ffffff2b] rounded-[30px_0px_0px_30px] border border-white backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
          <CardContent className="flex items-center justify-center h-full p-0">
            <div className="flex flex-col w-[339px] items-center gap-[42px]">
              <div className="flex flex-col items-center w-full gap-2">
                <h2 className="w-full [font-family:'Jost',Helvetica] font-semibold text-white text-2xl text-center tracking-[0] leading-[normal]">
                  Welcome to HealthAccess!
                </h2>
                <p className="w-full font-jost font-normal text-white text-md text-center tracking-[0] leading-[normal]">
                  Your account has been approved. Please set your password to complete your registration and access the platform.
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
                  Set Your Password
                </h2>
              </div>

              <form onSubmit={handleSetPassword} className="flex flex-col items-center gap-[15px] w-full">
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
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create Password"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />
                      {/* <p className="w-full font-jost font-normal text-white text-xs tracking-[0] leading-[normal] opacity-80">
                        Password must be at least 6 characters long
                      </p> */}
                    </div>
                    <SignupButton
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00acff] rounded-[5px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-medium text-white text-md tracking-[0] leading-[normal] h-auto px-[15px] py-2.5 hover:bg-[#0099e6]"
                    >
                      {loading ? 'Setting Password...' : 'Set Password'}
                    </SignupButton>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPasswordPage;