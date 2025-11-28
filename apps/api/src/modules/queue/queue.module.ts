// import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bullmq';
// import { ConfigService } from '@nestjs/config';
// import { QueueService } from './queue.service';
// import { ExampleProcessor } from './processors/example.processor';

// @Module({
//   imports: [
//     BullModule.forRootAsync({
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         connection: {
//           host: configService.get('REDIS_URL')?.split('://')[1]?.split(':')[0] || 'localhost',
//           port: parseInt(configService.get('REDIS_URL')?.split(':')[2] || '6379'),
//         },
//       }),
//     }),
//     BullModule.registerQueue({
//       name: 'example-queue',
//     }),
//   ],
//   providers: [QueueService, ExampleProcessor],
//   exports: [QueueService],
// })
// export class QueueModule {}

export class QueueModule {}
