/**
 * HealthCheckResponseDto
 * 
 * Response DTO for the health check endpoint.
 * Contains overall health status and individual dependency checks.
 * 
 * Requirements: 12.4, 12.5
 */

export interface DependencyCheck {
  name: string;
  healthy: boolean;
  error?: string;
}

export class HealthCheckResponseDto {
  status!: string;
  service!: string;
  timestamp!: string;
  checks!: DependencyCheck[];
}
