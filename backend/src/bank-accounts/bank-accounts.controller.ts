import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadharPhoto', maxCount: 1 },
        { name: 'aadharPhotoBack', maxCount: 1 },
        { name: 'panCardPhoto', maxCount: 1 },
        { name: 'panCardPhotoBack', maxCount: 1 },
        { name: 'debitCardPhoto', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 10 },
        { name: 'merchantQrCodes', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (_req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(new Error('Only image files are allowed'), false);
          } else {
            cb(null, true);
          }
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      },
    ),
  )
  async create(
    @Body() dto: CreateBankAccountDto,
    @UploadedFiles()
    files: {
      aadharPhoto?: Express.Multer.File[];
      aadharPhotoBack?: Express.Multer.File[];
      panCardPhoto?: Express.Multer.File[];
      panCardPhotoBack?: Express.Multer.File[];
      debitCardPhoto?: Express.Multer.File[];
      otherDocuments?: Express.Multer.File[];
      merchantQrCodes?: Express.Multer.File[];
    },
    @Request() req: { user: { sub: string } },
  ) {
    const filePaths = {
      aadharPhoto: files?.aadharPhoto?.[0]?.filename
        ? `/uploads/${files.aadharPhoto[0].filename}`
        : undefined,
      aadharPhotoBack: files?.aadharPhotoBack?.[0]?.filename
        ? `/uploads/${files.aadharPhotoBack[0].filename}`
        : undefined,
      panCardPhoto: files?.panCardPhoto?.[0]?.filename
        ? `/uploads/${files.panCardPhoto[0].filename}`
        : undefined,
      panCardPhotoBack: files?.panCardPhotoBack?.[0]?.filename
        ? `/uploads/${files.panCardPhotoBack[0].filename}`
        : undefined,
      debitCardPhoto: files?.debitCardPhoto?.[0]?.filename
        ? `/uploads/${files.debitCardPhoto[0].filename}`
        : undefined,
    };

    // Build other documents list
    const otherDocs = (files?.otherDocuments || []).map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: `/uploads/${f.filename}`,
    }));

    // Build merchant QR code file map (indexed by position)
    const merchantQrFiles = (files?.merchantQrCodes || []).map((f) => ({
      filename: f.filename,
      path: `/uploads/${f.filename}`,
    }));

    return this.bankAccountsService.create(dto, req.user.sub, filePaths, otherDocs, merchantQrFiles);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@Param('id') id: string) {
    return this.bankAccountsService.remove(id);
  }

  @Post('bulk-status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async bulkStatusChange(
    @Body() body: { accountIds: string[]; status: string },
  ) {
    return this.bankAccountsService.bulkStatusChange(body.accountIds, body.status);
  }

  @Get('check-duplicate')
  async checkDuplicate(@Query('accountNumber') accountNumber: string) {
    return this.bankAccountsService.checkDuplicate(accountNumber);
  }

  @Get()
  async findAll() {
    return this.bankAccountsService.findAll();
  }

  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return this.bankAccountsService.findByBranch(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bankAccountsService.findOne(id);
  }
}
