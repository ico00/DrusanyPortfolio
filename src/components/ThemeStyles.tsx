import { getTheme } from "@/lib/theme";
import { themeToCssVariables } from "@/lib/theme";

export default async function ThemeStyles() {
  const theme = await getTheme();
  const css = themeToCssVariables(theme);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
