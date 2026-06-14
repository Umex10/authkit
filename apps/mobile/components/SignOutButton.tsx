import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/Button";
import { deleteRefreshToken } from "@/actions/auth-action";
import { apiSlice } from "@/redux/api/apiSlice";

/**
 * Signs the user out: deletes the refresh token from the keystore (the backend
 * is stateless, so no round-trip is needed), wipes the RTK Query cache — which
 * drops the in-memory access token and the cached `/me` — and returns home.
 */
export function SignOutButton() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSignOut = async () => {
    await deleteRefreshToken();
    dispatch(apiSlice.util.resetApiState());
    router.replace("/");
  };

  return (
    <Button variant="outline" onPress={handleSignOut} className="px-4 py-2">
      Sign out
    </Button>
  );
}
