import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ContentModelService } from './content-model.service.js'
import { ContentRouter } from './content.router.js'
import { ContentModelName, ContentSchema } from './content.schema.js'
import { ContentFileModelName, ContentFileSchema } from './file/file.schema.js'
import { FileService } from './file/file.service.js'
import {
  PurchaseHistoryItemModelName,
  PurchaseHistoryItemSchema,
} from './purchase-history/purchase-history-item.schema.js'
import { PurchaseHistoryService } from './purchase-history/purchase-history.service.js'
import { ContentService } from './content.service.js'
import { EvmListenerModule } from '../evm-listener/evm-listener.module.js'

@Module({
  imports: [
    EvmListenerModule,
    MongooseModule.forFeature([
      { name: ContentModelName, schema: ContentSchema },
      { name: ContentFileModelName, schema: ContentFileSchema },
      { name: PurchaseHistoryItemModelName, schema: PurchaseHistoryItemSchema },
    ]),
  ],
  controllers: [],
  providers: [ContentModelService, ContentService, FileService, PurchaseHistoryService, ContentRouter],
  exports: [ContentModelService, ContentService, PurchaseHistoryService],
})
export class ContentModule {}
