import React, { useState } from "react";
import { SignupButton } from "../SignupButton";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
);


const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    

    try {
      // Validate all fields are filled
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
        setMessage({ type: 'error', text: 'Please fill in all fields' });
        setLoading(false);
        return;
      }

      // Submit signup request for approval
      const { data, error } = await supabase
        .from('signup_requests')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role: formData.role
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setMessage({ 
            type: 'error', 
            text: 'This email has already been registered. Please check your email for approval status.' 
          });
        } else {
          setMessage({ type: 'error', text: error.message });
        }
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Sign up request submitted! You will receive an email once your account is approved by an administrator.' 
        });
        // Clear form
        setFormData({ firstName: '', lastName: '', email: '', role: '' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
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
                  Join Us Today!
                </h2>
                <p className="w-full [font-family:'Jost',Helvetica] font-normal text-white text-md text-center tracking-[0] leading-[normal]">
                  Become a pioneer in healthcare planning with our innovative
                  platform. Sign Up today and discover how satellite analysis
                  and insights can optimize your planning process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[417px] h-[525px] bg-[#ffffff2b] rounded-[0px_30px_30px_0px] border border-white backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
          <CardContent className="flex items-center justify-center h-full p-0">
            <div className="flex flex-col w-[286px] items-center gap-[22px]">
              <div className="flex flex-col w-56 items-center">
                <h2 className="w-full [font-family:'Jost',Helvetica] font-semibold text-white text-2xl text-center tracking-[0] leading-[normal]">
                  Sign up
                </h2>
              </div>

              <form onSubmit={handleSignUp} className="flex flex-col items-center gap-[15px] w-full">
                <div className="flex flex-col items-center gap-7 w-full">
                  <div className="flex flex-col items-start gap-[31px] w-full">
                    <div className="flex flex-col items-start gap-2 w-full">
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />

                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />

                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        type="email"
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] placeholder:text-white h-auto px-[15px] py-2.5"
                      />

                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#ffffff4c] rounded-[5px] border border-white backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-normal text-white text-md tracking-[0] leading-[normal] h-auto px-[15px] py-2.5"
                      >
                        <option value="" className="bg-[#0077b6]">Select Role</option>
                        <option value="policymaker" className="bg-[#0077b6]">Policymaker</option>
                        <option value="healthcare_professional" className="bg-[#0077b6]">Healthcare Professional</option>
                        <option value="researcher" className="bg-[#0077b6]">Researcher</option>
                      </select>
                    </div>

                     {message.text && (
  <div className={`w-full rounded-lg p-3 ${
    message.type === 'success' 
      ? 'bg-green-500/20 border border-green-500' 
      : 'bg-red-500/20 border border-red-500'
  }`}>
    <p className="text-white text-sm">
      {message.text}
    </p>
  </div>
)}

                    <SignupButton
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00acff] rounded-[5px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] [font-family:'Jost',Helvetica] font-medium text-white text-md tracking-[0] leading-[normal] h-auto px-[15px] py-2.5 hover:bg-[#0099e6]"
                    >
                      {loading ? 'Submitting...' : 'Sign up'}
                    </SignupButton>
                  </div>
                </div>

                <p className="w-full [font-family:'Jost',Helvetica] font-normal text-white text-md text-center tracking-[0] leading-[normal]">
                  Already have an account?{" "}
                  <span className="font-bold cursor-pointer" onClick={() => navigate('/login')}>Sign in</span>
                </p>
              </form>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;