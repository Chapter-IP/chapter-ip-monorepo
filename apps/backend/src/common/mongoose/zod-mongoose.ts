import mongoose, { type SchemaOptions } from 'mongoose'
import { setMongoose, toMongooseSchema, withMongoose, zObjectId } from '@nullix/zod-mongoose'
import { z } from 'zod/v4'

// zod-mongoose cannot auto-detect Mongoose in this ESM application.
setMongoose(mongoose)

export { withMongoose, z, zObjectId }

export function createMongooseSchema<T extends z.ZodType>(
  schema: T,
  options?: SchemaOptions,
): mongoose.Schema<z.infer<T>> {
  return toMongooseSchema(schema, options)
}
