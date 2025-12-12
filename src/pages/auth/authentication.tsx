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

        // 2️⃣ Gọi backend để lấy token + user
        const response = await fetch(
          `${BACKEND_URL}/api/v1/auth/outbound/authentication?code=${authCode}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        console.log("📊 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Backend error:", errorText);
          throw new Error(`Backend returned ${response.status}`);
        }

        // 3️⃣ Parse response
        const data = await response.json();
        console.log("✅ API Response:", data);

        const token = data?.data?.access_token;
        const user = data?.data?.user;

        if (!token) throw new Error("❌ No access token in response");

        // 4️⃣ Lưu token
        localStorage.setItem("access_token", token);
        console.log("✅ Token saved to localStorage");

        // 5️⃣ Dispatch user nếu có
        if (user) {
          dispatch(setUserLoginInfo(user));
          console.log("✅ User info dispatched");
        } else {
          console.warn("⚠️ No user data returned from backend");
        }

        // 6️⃣ Xóa code khỏi URL để tránh fetch lại khi reload
        window.history.replaceState({}, document.title, "/");

      } catch (error: any) {
        console.error("💥 Authentication failed:", error);
        navigate("/login", { replace: true });
      }
    };

    handleOAuthCallback();
  }, [dispatch, navigate, BACKEND_URL]);

  // Khi isAuthenticated thay đổi → redirect về home
  useEffect(() => {
    if (isAuthenticated) {
      console.log("✅ User authenticated → redirecting...");
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
