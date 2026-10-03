import { motion } from "framer-motion";
import collegeLogo from "../../assets/college.png";

// a message above a form: tone is "error" or "success"
export const FormMessage = ({ tone = "error", children }) => (
  <p
    role={tone === "error" ? "alert" : "status"}
    className={`text-sm rounded-lg px-3 py-2.5 mb-4 text-left border ${tone === "error" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-green-500/10 border-green-500/30 text-green-300"}`}
  >
    {children}
  </p>
);

// The dark frame of the login page, reused by sign-up and the email-link pages
const AuthFrame = ({ title, children, footer }) => (
  <div className="relative min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-[#131314] to-[#1C1C1E] text-white p-4 overflow-hidden">
    <motion.div
      className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#1C1C1E_0%,_#131314_100%)] opacity-30"
      animate={{ opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.img
      src={collegeLogo}
      alt="College logo"
      className="relative h-20 mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    />

    <motion.h1
      className="relative text-2xl md:text-3xl font-bold text-amber-500 mb-6 text-center"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      Transparent College System
    </motion.h1>

    <motion.div
      className="relative bg-[#1C1C1E] p-6 rounded-lg shadow-lg w-full max-w-[380px] text-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold text-amber-500 mb-4">{title}</h2>
      {children}
    </motion.div>

    {footer && <p className="relative text-sm text-gray-400 mt-5 text-center">{footer}</p>}
  </div>
);

export default AuthFrame;
