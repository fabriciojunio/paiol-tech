export class CreatePixPaymentCommand {
  constructor(
    public readonly producerId: string,
    public readonly debtId: string,
    public readonly amount: number,
    public readonly description: string,
  ) {}
}
