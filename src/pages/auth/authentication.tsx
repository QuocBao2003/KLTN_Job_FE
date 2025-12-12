import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import { useAppSelector } from "@/redux/hooks";

const Authenticate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.topjjobapi.click";

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // 1️⃣ Lấy code từ URL
        const authCodeRegex = /code=([^&]+)/;
        const match = window.location.href.match(authCodeRegex);

        if (!match) {
          console.error("❌ No authorization code found");
          navigate("/login", { replace: true });
          return;
        }

        const authCode = match[1];
        console.log("📝 Auth code:", authCode);

        // 2️⃣ Gọi backend để lấy token
        const res = await fetch(`${BACKEND_URL}/api/v1/auth/outbound/authentication?code=${authCode}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        });

        console.log("📊 Response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error("❌ Backend error:", text);
          throw new Error(`Backend returned ${res.status}`);
        }

        const json = await res.json();
        const token = json?.data?.access_token;
        const user = json?.data?.user;

        if (!token) throw new Error("❌ No access token in response");

        // 3️⃣ Lưu token vào localStorage
        localStorage.setItem("access_token", token);
        console.log("✅ Token saved to localStorage");

        // 4️⃣ Dispatch user lên Redux
        if (user) {
          dispatch(setUserLoginInfo(user));
          console.log("✅ User info dispatched");
        } else {
          console.warn("⚠️ No user data returned from backend");
        }

        // 5️⃣ Xóa code OAuth khỏi URL để tránh fetch lại khi reload
        window.history.replaceState({}, document.title, "/");

        // 6️⃣ Verify backend token trước khi redirect
        const verify = await fetch(`${BACKEND_URL}/api/v1/auth/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (verify.ok) {
          console.log("✅ Token verified → redirecting to home");
          navigate("/", { replace: true });
        } else {
          console.warn("⚠️ Token invalid → redirecting to login");
          navigate("/login", { replace: true });
        }

      } catch (error: any) {
        console.error("💥 Authentication failed:", error);
        navigate("/login", { replace: true });
      }
    };

    handleOAuthCallback();
  }, [dispatch, navigate, BACKEND_URL]);

  // 7️⃣ Fallback: nếu isAuthenticated thay đổi (Redux) nhưng chưa redirect
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔄 Redux says authenticated → redirecting home");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
      <Typography>Authenticating with Google...</Typography>
    </Box>
  );
};

export default Authenticate;
