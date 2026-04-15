import { Colors } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const { resolvedTheme } = useAppearance();
  const colorFromProps = props[resolvedTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[resolvedTheme][colorName];
  }
}
