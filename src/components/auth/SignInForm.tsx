import { useEffect, useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useNavigate } from "react-router";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate(); // Optional for redirection

  // Dummy users for local login
  const users = [
    { email: "nidhi.purohit@birlaopenminds.com", password: "nidhi123" },
    { email: "sanjana.deshmukh@birlaopenminds.com", password: "sanjana123" },
    { email: "sandeep.pinto@birlaopenminds.com", password: "sandeep123" },
    { email: "trunika.gamre@birlaopenminds.com", password: "trunika123" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (validUser) {
      setErrorMsg("");

      // Save user to localStorage
      localStorage.setItem("authUser", JSON.stringify(validUser));

      alert("Login successful!");

      // Optional: redirect to a protected page
      navigate("/");
    } else {
      setErrorMsg("Invalid email or password");
    }
  };

  // Check if user already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      // alert("Already logged in");
      // Optional: auto-redirect
      // navigate("/dashboard");
    }
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
              )}

              <div>
                <button type="submit" className="w-full bg-blue-900 p-5 text-white border-error-800 hover:bg-color-800 focus:outline-none">
                  Sign in
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
