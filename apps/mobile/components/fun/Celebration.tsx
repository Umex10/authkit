/* ───────────────────────────────────────────────────────────────────────────
 * FUN GAG — a celebratory confetti burst + a rotating silly subtitle.
 *
 * This whole folder (components/fun/) is the "just for fun" layer. To remove it:
 *   1. delete this file (and the components/fun/ folder),
 *   2. remove the <Celebration /> usage in app/(shell)/dashboard.tsx.
 * Nothing else in the app depends on it.
 * ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

/** A few interchangeable, deliberately goofy congratulation lines. */
const SUBTITLES = [
  "You did it! 🎉",
  "Auth works. You're officially a wizard. 🪄",
  "Token valid, vibes priceless. ✨",
  "Logged in like a pro. 😎",
  "That's it — auth is done, go grab a coffee. ☕",
];

export function Celebration() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [subtitle, setSubtitle] = useState(SUBTITLES[0]);

  useEffect(() => {
    setMounted(true);
    setSubtitle(SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)]);
  }, []);

  return (
    <View className="items-center gap-3">
      <Text className="text-6xl">🎉</Text>
      <Text className="text-base font-medium text-muted-foreground">
        {subtitle}
      </Text>

      {mounted && (
        <View className="pointer-events-none absolute -top-4" pointerEvents="none">
          <ConfettiCannon
            count={80}
            origin={{ x: width / 2, y: -20 }}
            autoStart
            fadeOut
            fallSpeed={2800}
            explosionSpeed={350}
          />
        </View>
      )}
    </View>
  );
}
