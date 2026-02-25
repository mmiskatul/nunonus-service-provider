import { SectionPlaceholder } from "@/components/main/section-placeholder";
import { fetchApiData } from "@/lib/server-api";

type SettingsData = {
  title: string;
  description: string;
};

const fallbackData: SettingsData = {
  title: "Settings",
  description: "Configure platform preferences, policies, and account controls."
};

export async function SettingsViewServer() {
  const data = await fetchApiData<SettingsData>("/api/settings", fallbackData);
  return <SectionPlaceholder title={data.title} description={data.description} />;
}
