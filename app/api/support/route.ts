import { readJson, jsonError, jsonOk } from "@/app/api/_data";

export async function GET() {
  try {
    const data = await readJson("support.json");
    return jsonOk(data);
  } catch {
    return jsonError("Failed to read support data");
  }
}
