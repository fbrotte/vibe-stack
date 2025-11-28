// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Logger } from '@nestjs/common';
// import { Job } from 'bullmq';

// @Processor('example-queue')
// export class ExampleProcessor extends WorkerHost {
//   private readonly logger = new Logger(ExampleProcessor.name);

//   async process(job: Job): Promise<any> {
//     this.logger.log(`Processing job ${job.id} of type ${job.name}`);

//     // Your job processing logic here
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     this.logger.log(`Completed job ${job.id}`);
//     return { success: true };
//   }
// }

export class ExampleProcessor {}
