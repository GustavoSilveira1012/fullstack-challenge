export class HealthCheckResponseDto {
  status!: string;
  service!: string;

  constructor(status: string, service: string) {
    this.status = status;
    this.service = service;
  }
}
