import Queue from 'bull';
import redis from 'redis';

const fileProcessingQueue = new Queue('file-processing', {
  redis: { host: '127.0.0.1', port: 6379 },
});

export const addFileProcessingJob = (data) => {
  fileProcessingQueue.add(data);
};

fileProcessingQueue.process(async (job) => {
  // Process file conversion logic here
  console.log('Processing job:', job.data);
});

export default fileProcessingQueue;