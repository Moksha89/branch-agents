import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadharPhoto', maxCount: 1 },
        { name: 'panCardPhoto', maxCount: 1 },
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
      panCardPhoto?: Express.Multer.File[];
    },
    @Request() req: { user: { sub: string } },
  ) {
    const filePaths = {
      aadharPhoto: files?.aadharPhoto?.[0]?.filename
        ? `/uploads/${files.aadharPhoto[0].filename}`
        : undefined,
      panCardPhoto: files?.panCardPhoto?.[0]?.filename
        ? `/uploads/${files.panCardPhoto[0].filename}`
        : undefined,
    };
    return this.bankAccountsService.create(dto, req.user.sub, filePaths);
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
