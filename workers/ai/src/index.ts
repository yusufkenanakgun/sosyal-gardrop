import { startMediaWorker } from './processors/media.processor';
import { enqueueMediaJob } from './queues/media.queue';

async function main() {
  startMediaWorker();

  // Sprint 0 doğrulama: örnek 3 job kuyruğa at
  await enqueueMediaJob({
    userId: 'demo-user',
    fileKey: 'uploads/demo.jpg',
    type: 'BG_REMOVE'
  });
  await enqueueMediaJob({
    userId: 'demo-user',
    fileKey: 'uploads/demo.jpg',
    type: 'TAG_EMBED'
  });
  await enqueueMediaJob({
    userId: 'demo-user',
    fileKey: 'uploads/demo.jpg',
    type: 'COLOR_EXTRACT'
  });

  console.log('[ai] sample jobs enqueued');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
