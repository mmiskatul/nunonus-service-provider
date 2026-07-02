import { SettingsPageClient } from "@/components/settings/page-client";
import { fetchApiData } from "@/lib/server-api";

type SettingsProfileData = {
  business_name?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
};

type SettingsNotificationData = {
  new_booking?: boolean;
  booking_cancellation?: boolean;
  new_review?: boolean;
  platform_updates?: boolean;
};

export default async function SettingsPage() {
  const [profile, notifications] = await Promise.all([
    fetchApiData<SettingsProfileData>("/api/settings/profile"),
    fetchApiData<SettingsNotificationData>("/api/settings/notifications"),
  ]);

  return (
    <SettingsPageClient
      initialProfile={profile}
      initialNotifications={notifications}
    />
  );
}
