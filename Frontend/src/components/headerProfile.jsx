import { useDispatch, useSelector } from "react-redux"
import { NavLink } from "react-router";
import { logoutUser } from "../store/authSlice";
import { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";


export default function HeaderProfile() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);

    // 👇 Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div>
            <NavLink to={"/"} className="fixed top-3 left-3 z-50">
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
            </NavLink>
            <div ref={profileRef} className="fixed top-29 sm:top-4 right-3 sm:right-6 z-50 ">
                {isAuthenticated ? (
                    <>
                        <div
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-2 cursor-pointer bg-[rgba(253,253,253,0)] border border-white/10 px-3 py-2 rounded-full shadow-md hover:bg-[rgba(46,41,95,0.8)] transition">
                            <div className="text-white flex justify-between items-center  font-medium px-2"><FaUserCircle className="mr-2" /> {user?.firstName}</div>
                        </div>

                        {showProfile && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl 
                bg-white border border-gray-200 
                shadow-xl 
                overflow-hidden 
                animate-in fade-in zoom-in-95 duration-150">

                                <button
                                    onClick={() => dispatch(logoutUser())}
                                    className="w-full px-4 py-3 text-left text-sm font-medium 
                   text-gray-700 
                   hover:bg-gray-100 
                   hover:text-red-600 
                   transition-all duration-200">
                                    Log Out
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <NavLink
                        to="/login"
                        className="px-5 py-2 rounded-lg bg-[#FFB900] text-[#222A42] font-semibold 
             hover:bg-[#e6a700] transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        Login
                    </NavLink>
                )}
            </div>
        </div>
    )
}