import { Worker } from "bullmq";
import type { Processor, Job } from "bullmq";
import { connection } from "../redis";
import pino from "pino";

// Kuyruk ve worker adları
export const mediaQueueName = "media-pipeline";
export const mediaProcessorName = "media:processor";

// ---- Tipler ----
type MediaJobName = "BG_REMOVE" | "TAG_EMBED" | "COLOR_EXTRACT";

interface BgRemovePayload {
  fileKey: string;
}

interface TagEmbedPayload {
  fileKey: string;
}

type Season = "spring" | "summer" | "fall" | "winter";

interface ColorExtractPayload {
  fileKey: string;
}

type BgRemoveResult = { bgRemovedUrl: string };
type TagEmbedResult = { labels: string[]; embedding: string };
type ColorExtractResult = { color: string; season: Season[] };

interface JobMap {
  BG_REMOVE: { data: BgRemovePayload; result: BgRemoveResult };
  TAG_EMBED: { data: TagEmbedPayload; result: TagEmbedResult };
  COLOR_EXTRACT: { data: ColorExtractPayload; result: ColorExtractResult };
}

// Ortak payload/result birlik tipleri (processor generics için)
type MediaJobPayload =
  | JobMap["BG_REMOVE"]["data"]
  | JobMap["TAG_EMBED"]["data"]
  | JobMap["COLOR_EXTRACT"]["data"];

type MediaJobResult =
  | JobMap["BG_REMOVE"]["result"]
  | JobMap["TAG_EMBED"]["result"]
  | JobMap["COLOR_EXTRACT"]["result"];

// ---- Logger ----
const logger = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
});

// ---- Processor ----
const processor: Processor<MediaJobPayload, MediaJobResult, MediaJobName> = async (
  job: Job<MediaJobPayload, MediaJobResult, MediaJobName>
) => {
  logger.info({ id: job.id, name: job.name, data: job.data }, "job received");

  switch (job.name) {
    case "BG_REMOVE": {
      const data = job.data as JobMap["BG_REMOVE"]["data"];
      await sleep(500);
      logger.info({ fileKey: data.fileKey }, "bg-removed (mock)");
      const result: JobMap["BG_REMOVE"]["result"] = {
        bgRemovedUrl: `mock://bg/${data.fileKey}`,
      };
      return result;
    }

    case "TAG_EMBED": {
      const data = job.data as JobMap["TAG_EMBED"]["data"];
      await sleep(400);
      logger.info({ fileKey: data.fileKey }, "tag+embed (mock)");
      const result: JobMap["TAG_EMBED"]["result"] = {
        labels: ["top", "casual"],
        embedding: "mock-clip-vec",
      };
      return result;
    }

    case "COLOR_EXTRACT": {
      const data = job.data as JobMap["COLOR_EXTRACT"]["data"];
      await sleep(300);
      logger.info({ fileKey: data.fileKey }, "color extracted (mock)");
      const result: JobMap["COLOR_EXTRACT"]["result"] = {
        color: "#a1a1a1",
        season: ["spring", "fall"],
      };
      return result;
    }

    // Exhaustive check
    default: {
      const _never: never = job.name;
      throw new Error(`Unknown job: ${_never}`);
    }
  }
};

// ---- Worker starter ----
export function startMediaWorker() {
  const worker = new Worker<MediaJobPayload, MediaJobResult, MediaJobName>(
    mediaQueueName,
    processor,
    {
      connection,
      concurrency: 4,
    }
  );

  worker.on("completed", (job, result) => {
    logger.info({ id: job.id, result }, "job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ id: job?.id, err }, "job failed");
  });

  logger.info({ name: mediaProcessorName }, "worker started");
  return worker;
}

// ---- Utils ----
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
