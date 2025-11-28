// import { Injectable, Logger } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';

// @Injectable()
// export class QueueService {
//   private readonly logger = new Logger(QueueService.name);

//   constructor(
//     @InjectQueue('example-queue') private exampleQueue: Queue,
//   ) {}

//   async addExampleJob(data: any) {
//     const job = await this.exampleQueue.add('example-job', data);
//     this.logger.log(`Added job ${job.id} to example-queue`);
//     return job;
//   }
// }

export class QueueService {}
