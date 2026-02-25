import { readJson, jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readJson("users.json");
    return jsonOk(data);
  } catch {
    return jsonError("Failed to read users data");
  }
}
