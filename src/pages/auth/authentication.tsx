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
  useEffect(() => {
    const authCodeRegex = /code=([^&]+)/;
    const match = window.location.href.match(authCodeRegex);

    if (!match) {
      console.error("No authorization code found in URL");
      return;
    }

    const authCode = match[1];
    console.log("Auth code:", authCode);

    fetch(
      `http://13.158.79.7:9095/api/v1/auth/outbound/authentication?code=${authCode}`,
      {
        method: "POST",
        credentials: "include", // để gửi cookie refresh_token
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return response.json();
      })
      .then((response) => {
        console.log("🔍 API Response:", response);
        // ✅ Lấy dữ liệu chính xác theo format BE trả
        const data = response?.data; // Lấy data từ response
        const token = data?.access_token ?? data?.accessToken;
        const user = data?.user;

        console.log("🔍 Data from response:", data);
        console.log("🔍 Token:", token);
        console.log("🔍 User:", user);

        if (token) {
          localStorage.setItem("access_token", token);
          console.log("✅ Token saved to localStorage");

          if (user) {
            console.log("🚀 Dispatching setUserLoginInfo with user:", user);
            dispatch(setUserLoginInfo(user));
            console.log("✅ setUserLoginInfo dispatched");
          } else {
            console.error("❌ No user data in response");
          }
        } else {
          console.error("❌ No access token in response:", data);
        }
      })
      .catch((error) => {
        console.error("Authentication failed:", error);
      });
  }, [dispatch]);

  // Khi login thành công => chuyển hướng
  useEffect(() => {
    console.log("🔍 isAuthenticated changed:", isAuthenticated);
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
