import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const response = await authAPI.login({ email, password });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success("Signed in successfully!");

      const userRole = response.user.role;
      if (userRole === "platform_superadmin") {
        navigate("/platform-dashboard");
      } else if (userRole === "owner" || userRole === "restaurant_owner") {
        navigate("/owner-dashboard");
      } else if (userRole === "waiter") {
        navigate("/waiter-dashboard");
      } else {
        navigate("/manager-dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes("fetch") || error.message?.includes("Network")) {
        toast.error("Connection error. Please check your internet connection.");
      } else {
        toast.error(error.response?.data?.message || error.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpRedirect = () => {
    window.open("https://wa.me/919152515229", "_blank");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#fff8f6" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #E85D25 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #cc490f 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-[420px] animate-scale-in">
        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8"
          style={{ boxShadow: "0 8px 32px hsl(15 30% 12% / 0.10), 0 2px 8px hsl(15 30% 12% / 0.06)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
              style={{ backgroundColor: "#fff1ec" }}
            >
              <img
                src="/khao-peeo-logo.png"
                alt="Khao Peeo Logo"
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/KhaoPeeo Logo.png";
                }}
              />
            </div>
            <h1
              className="text-2xl font-bold text-center"
              style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}
            >
              Welcome Back
            </h1>
            <p className="text-sm mt-1 text-center" style={{ color: "#594139" }}>
              Sign in to manage your restaurant
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="label-caps"
                style={{ color: "#594139", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-md border transition-all duration-200"
                style={{
                  borderColor: "#e1bfb4",
                  backgroundColor: "#fff8f6",
                  color: "#261814",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="label-caps"
                style={{ color: "#594139", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-md border pr-11 transition-all duration-200"
                  style={{
                    borderColor: "#e1bfb4",
                    backgroundColor: "#fff8f6",
                    color: "#261814",
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#8d7167" }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 rounded-md font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#E85D25", fontFamily: "Sora, sans-serif" }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e1bfb4" }} />
            <span className="text-xs" style={{ color: "#8d7167" }}>OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e1bfb4" }} />
          </div>

          {/* Sign up via WhatsApp */}
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: "#594139" }}>
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={handleSignUpRedirect}
              className="flex items-center justify-center gap-2 mx-auto text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "#22C55E" }}
            >
              {/* WhatsApp icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contact us on WhatsApp to Sign Up
            </button>
          </div>
        </div>

        {/* Footer brand note */}
        <p className="text-center text-xs mt-6" style={{ color: "#8d7167" }}>
          Khao Peeo POS · Smart Restaurant Management
        </p>
      </div>
    </div>
  );
};

export default Auth;
