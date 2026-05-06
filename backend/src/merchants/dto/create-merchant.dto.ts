export class CreateMerchantDto {
  name: string;
  type: string;
  merchantId?: string;
  mobileNumber?: string;
  balance?: number;
  bankAccountId: string;
}
