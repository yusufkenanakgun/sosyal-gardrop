import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function getS3Client(): S3Client {
  if (_s3) return _s3;

  const endpoint = requireEnv("S3_ENDPOINT");
  const accessKeyId = requireEnv("S3_ACCESS_KEY");
  const secretAccessKey = requireEnv("S3_SECRET_KEY");

  _s3 = new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _s3;
}

export async function testS3Connection() {
  try {
    const client = getS3Client();
    const result = await client.send(new ListBucketsCommand({}));
    console.log(
      "✅ S3 connected. Buckets:",
      result.Buckets?.map((b) => b.Name).join(", ")
    );
  } catch (err) {
    console.error("❌ S3 connection failed:", err);
  }
}
