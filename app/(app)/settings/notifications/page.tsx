// Notifications were merged into the Profile tab (/settings).
// Keep this file so existing bookmarks/links don't 404.
import { redirect } from "next/navigation";
export default function NotificationsRedirect() {
  redirect("/settings");
}
