import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "vendors.json");

async function readVendorsFile() {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

async function writeVendorsFile(data: unknown) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(context.params.id);
    const body = await request.json();
    const action = body?.action as string | undefined;

    const data = await readVendorsFile();
    const vendors = data.vendors as Array<Record<string, any>>;
    const index = vendors.findIndex((vendor) => vendor.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const vendor = vendors[index];

    if (action === "approve") {
      vendor.status = "APPROVED";
    }

    if (action === "reject") {
      vendor.status = "REJECTED";
    }

    vendors[index] = vendor;
    data.vendors = vendors;
    await writeVendorsFile(data);

    return NextResponse.json({ vendor }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
