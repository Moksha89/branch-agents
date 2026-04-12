import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('qrCodePhoto', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `qr-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: CreateMerchantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const qrPath = file ? `/uploads/${file.filename}` : undefined;
    return this.merchantsService.create(dto, qrPath);
  }

  @Get('account/:accountId')
  async findByAccount(@Param('accountId') accountId: string) {
    return this.merchantsService.findByAccount(accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('qrCodePhoto', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `qr-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const qrPath = file ? `/uploads/${file.filename}` : undefined;
    return this.merchantsService.update(id, dto, qrPath);
  }

  @Patch(':id/balance')
  async updateBalance(
    @Param('id') id: string,
    @Body() body: { balance: number },
  ) {
    return this.merchantsService.updateBalance(id, body.balance);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.merchantsService.remove(id);
  }
}
