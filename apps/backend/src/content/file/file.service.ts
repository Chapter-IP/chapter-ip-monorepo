import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import {
  S3Client,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandInput,
  UploadPartCommand,
  UploadPartCommandInput,
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { CommonModelService } from '../../common/model/model.service.js'

import { ContentFile } from './file.schema.js'

@Injectable()
export class FileService extends CommonModelService<ContentFile> {
  private r2: S3Client

  constructor(
    @InjectModel(ContentFile.name) private fileModel: Model<ContentFile>,
    private readonly configService: ConfigService,
  ) {
    super(fileModel)

    const accessKeyId: string = this.configService.get<string>('cloudflare.rtwo.accessKeyId') as string
    if (!accessKeyId) throw new Error('cloudflare.rtwo.accessKeyId is not set')
    const secretAccessKey: string = this.configService.get<string>('cloudflare.rtwo.secretAccessKey') as string
    if (!secretAccessKey) throw new Error('cloudflare.rtwo.secretAccessKey is not set')
    const endpoint: string = this.configService.get<string>('cloudflare.rtwo.endpoint') as string
    if (!endpoint) throw new Error('cloudflare.rtwo.endpoint is not set')

    this.r2 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    })
  }

  getBucketName(type: 'metadata' | 'content' | 'preview' | 'userfiles') {
    let bucketName = `chapter-ip-${type}`
    const env = this.configService.get<string>('env')
    if (env !== 'prod') {
      bucketName += `-test`
    }
    return bucketName
  }

  async removeObject(data: DeleteObjectCommandInput) {
    const delete_file_command = new DeleteObjectCommand(data)
    return await this.r2.send(delete_file_command)
  }

  async removeObjects(data: DeleteObjectsCommandInput) {
    if (!data.Delete?.Objects?.length) return

    await this.r2.send(new DeleteObjectsCommand(data))
  }

  async getSignedObjectUrl(opts: GetObjectCommandInput): Promise<string> {
    const url = await getSignedUrl(
      this.r2,
      new GetObjectCommand({
        Bucket: opts.Bucket,
        Key: opts.Key,
      }),
      { expiresIn: 3600 },
    )
    return url
  }

  async putObject(data: PutObjectCommandInput) {
    const command = new PutObjectCommand({
      Bucket: data.Bucket,
      Key: data.Key,
      Body: data.Body,
      ContentType: data.ContentType,
    })
    return await this.r2.send(command)
  }

  async createUploadUrl(opts: PutObjectCommandInput) {
    const command = new PutObjectCommand({
      Bucket: opts.Bucket,
      Key: opts.Key,
      ...(opts.ContentType && { ContentType: opts.ContentType }),
    })
    return await getSignedUrl(this.r2, command, { expiresIn: 60 * 5 })
  }

  async objectExists(data: HeadObjectCommandInput) {
    const command = new HeadObjectCommand(data)
    try {
      await this.r2.send(command)
      return true
    } catch {
      return false
    }
  }

  async startMultipartUpload(opts: CreateMultipartUploadCommandInput) {
    const command = new CreateMultipartUploadCommand({
      Bucket: opts.Bucket,
      Key: opts.Key,
      ContentType: opts.ContentType,
    })
    return await this.r2.send(command)
  }

  async getPartUploadUrl(opts: UploadPartCommandInput) {
    const command = new UploadPartCommand({
      Bucket: opts.Bucket,
      Key: opts.Key,
      UploadId: opts.UploadId,
      PartNumber: opts.PartNumber,
    })

    return await getSignedUrl(this.r2, command, { expiresIn: 600 })
  }

  async completeMultipartUpload(opts: CompleteMultipartUploadCommandInput) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: opts.Bucket,
      Key: opts.Key,
      UploadId: opts.UploadId,
      MultipartUpload: { Parts: opts.MultipartUpload?.Parts },
    })
    return await this.r2.send(command)
  }
}
