import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';  // to connect zod with reactformhook
import { z } from 'zod'; // or 'zod/v4'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { registerUser } from '../store/authSlice';
import { useEffect, useState } from 'react';



let showError = false;

// SchemaValidation for signup form
const signupSchema = z.object({
  firstName: z.string().min(3, "Name should contain atleast 3 char").regex(/^[A-Za-z\s]+$/, "Name should contain only letters"),
  emailId: z.string().email("Enter valid email"),
  password: z.string().min(8, "Password should contain atleast 8 char"),
  confirmPassword: z.string().min(8, "Password should contain atleast 8 char")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"] // path of error
});







// no need to manually make useState , it will managed by react-hook-form
// already json data banake dega
// handleSubmit will handle e.preventDefault() automatically
export default function Signup() {
  //   const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm();  // this is hook

  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors }, // this errors is a object hving all fields in form with its type and custom error message // if error is not present then errors.firstName will be undefined
  } = useForm({ resolver: zodResolver(signupSchema) });

  // const errors = {    // like this
  //   firstName: {
  //     type: 'minLength',
  //     message: "Name should contain atleast 3 char"
  //   },
  //   emailId: {
  //     type: 'email',
  //     message: "Enter valid email"
  //   },
  //   password: {
  //     type: 'minLength',
  //     message: "Password should contain atleast 8 char"
  //   }
  // }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');  // when we are not doing routing, we only need to navigate our path then use this
    }
  }, [isAuthenticated]);

  const onSubmit = (data) => {
    // console.log(data);
    // dispatch(registerUser(data));
    const { confirmPassword, ...payload } = data;

    // console.log(payload);
    dispatch(registerUser(payload));
    showError = true;
  }





  return (
    <div className='max-w-screen w-full flex-col h-screen flex items-center justify-center  bg-gradient-to-b from-[#061021] via-[#071428] to-[#08122a] relative overflow-hidden'>

      {/* <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[180px]" /> */}
      {/* <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-[180px]" /> */}
      <div className="absolute bottom-0 right-0 w-[300px] h-[500px] bg-pink-600/30 rounded-full blur-[180px]" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card flex-shrink-0  w-full max-w-md shadow-2xl  bg-[#061021]"
      >


        <div className="card-body ">
          <h2 className="card-title text-3xl font-bold flex justify-center  mb-6 text-primary">
            <svg
              width="160"
              height="40"
              viewBox="0 0 320 90"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="builderGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00C6FF" />
                  <stop offset="100%" stopColor="#0072FF" />
                </linearGradient>
              </defs>

              {/* Icon */}
              <g transform="translate(15,15)">
                {/* Outer Circle */}
                <circle
                  cx="35"
                  cy="35"
                  r="30"
                  stroke="url(#builderGradient)"
                  strokeWidth="4"
                  fill="none"
                />

                {/* Hammer Shape */}
                <path
                  d="M25 45 L50 20"
                  stroke="url(#builderGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                <rect
                  x="48"
                  y="15"
                  width="18"
                  height="8"
                  rx="2"
                  transform="rotate(45 48 15)"
                  fill="url(#builderGradient)"
                />
              </g>

              {/* Text */}
              <text
                x="100"
                y="58"
                fontSize="36"
                fontWeight="700"
                fontFamily="Poppins, sans-serif"
                fill="url(#builderGradient)"
              >
                Build
              </text>

              <text
                x="185"
                y="58"
                fontSize="36"
                fontWeight="700"
                fontFamily="Poppins, sans-serif"
                fill="#FFFFFF"
              >
                er
              </text>
            </svg>
          </h2>

          {/* Name Field */}
          <div className="form-control flex flex-col items-center mb-6">
            <input
              {...register('firstName')}
              type="text"
              placeholder="Enter your name"
              className={`input input-bordered ${errors.firstName ? 'input-error' : ''}`}
            />
            {errors.firstName && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.firstName.message}</span>
              </label>
            )}
          </div>

          {/* Email Field */}
          <div className="form-control flex flex-col items-center  mb-6">
            <input
              {...register('emailId')}
              type="email"
              placeholder="Enter your email"
              className={`input input-bordered ${errors.emailId ? 'input-error' : ''}`}
            />
            {errors.emailId && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.emailId.message}</span>
              </label>
            )}
          </div>

          {/* Password Field */}
          <div className="form-control flex flex-col items-center px-10 mb-6">
            <div className='relative w-full'>
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className={`input input-bordered pr-10 w-full ${errors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 z-30 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" // Added transform for better centering, styling
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"} // Accessibility
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password.message}</span>
              </label>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-control flex flex-col items-center  mb-6">
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm your password"
              className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
            />
            {errors.confirmPassword && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
              </label>
            )}
          </div>

          {error && showError && (
            <label className="label flex justify-center">
              <span className="label-text-alt text-error ">{error}</span>
            </label>
          )}

          <div className="form-control flex justify-center">
            <button
              type="submit"
              className={`btn btn-primary rounded-full  ${loading ? 'loading' : ''}`}
              style={{ background: 'linear-gradient(90deg,#FFD166,#FE9A00)', color: '#061021' }}
              disabled={loading}
            >
              {loading ? "" : "SignUp"}
            </button>
          </div>

          <p className="text-center mt-4">
            Already have an account?
            <Link to={'/login'} className='link link-primary'> Login</Link>
          </p>
        </div>
      </form>
    </div>
  )

}















