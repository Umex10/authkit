import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useGetMeQuery } from "@/redux/api/apis/me";
import { Spinner } from "@/components/ui/Loader";
// FUN GAG (optional): remove this import and the <Celebration/> usage below to
// turn the dashboard into a plain welcome screen.
import { Celebration } from "@/components/fun/Celebration";

/**
 * The post-login landing screen.
 *
 * Reads the authenticated user from `GET /me` (proving the whole auth chain
 * works end to end) and greets them. The confetti celebration is an optional
 * "fun gag" — see components/fun/Celebration.tsx for how to remove it. The
 * mobile twin of the web `app/(shell)/dashboard/page.tsx`.
 */
export default function DashboardScreen() {
  const { data: user, isLoading } = useGetMeQuery();
  // Set when the landing/auth screens bounced an already-signed-in user here.
  const wasRedirected = useLocalSearchParams().redirected === "1";

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="items-center gap-10 px-6 py-10">
      {wasRedirected && <RedirectNote />}

      {/* FUN GAG (optional) — confetti + a goofy subtitle. */}
      <Celebration />

      <View className="items-center gap-2">
        <Text className="text-center text-3xl font-extrabold tracking-tight text-foreground">
          You made it{user?.name ? `, ${user.name}` : ""}! 🚀
        </Text>
        <Text className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          You&apos;re logged in. That means sign-up/sign-in, the stored refresh token,
          the access token and the protected route GET /me all worked.
        </Text>
      </View>

      {/* The authenticated user, straight from the protected /me endpoint. */}
      {user && (
        <View className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <Text className="mb-4 text-sm font-semibold text-muted-foreground">
            Your account (via GET /me)
          </Text>
          <View className="gap-3">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={user.phone} />
            <Row label="Role" value={<RoleBadge role={user.role} />} />
          </View>
        </View>
      )}

      <View className="w-full max-w-md rounded-xl border border-dashed border-border p-5">
        <Text className="font-semibold text-foreground">What&apos;s next?</Text>
        <View className="mt-2 gap-1.5">
          <Bullet>
            Build your features under app/(shell)/ — they&apos;re protected
            automatically.
          </Bullet>
          <Bullet>Add new API calls as RTK Query endpoints next to me.ts.</Bullet>
          <Bullet>Roles/logic live in the backend under com.authkit.backend.</Bullet>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      {typeof value === "string" ? (
        <Text className="text-sm font-medium text-foreground">{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

/**
 * Shown when the landing/auth screens redirected an already-authenticated user
 * here. Surfaces the convenience redirect so they understand they didn't have to
 * sign in again — the stored refresh token was still valid. The mobile twin of
 * the web dashboard's RedirectNote.
 */
function RedirectNote() {
  return (
    <View className="w-full max-w-md rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
      <Text className="text-sm font-semibold text-primary">
        👋 Welcome back — you’re already signed in.
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        Your stored refresh token was still valid, so the app sent you straight
        here instead of showing the landing or sign-in screen again.
      </Text>
    </View>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
      <Text className="text-xs font-semibold text-primary">{role}</Text>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-muted-foreground">•</Text>
      <Text className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {children}
      </Text>
    </View>
  );
}
