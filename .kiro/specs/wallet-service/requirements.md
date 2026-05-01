# Requirements Document

## Introduction

The Wallet Service is a bounded context within the fullstack crash game application responsible for managing player wallets, balances, and monetary operations. It ensures exact monetary precision using integer-based arithmetic, prevents negative balances, and integrates with the Game Service via asynchronous messaging. The service exposes REST endpoints for wallet creation and balance retrieval, while credit and debit operations are exclusively handled through message broker events.

## Glossary

- **Wallet_Service**: The microservice responsible for managing player wallets and balances
- **Wallet**: A financial account associated with a single player containing their balance
- **Player**: An authenticated user identified by a unique player ID from the JWT token
- **Balance**: The amount of money in a wallet, stored as integer centavos (1/100 of the base currency unit)
- **Centavo**: The smallest monetary unit, representing 1/100 of the base currency (e.g., 1 cent)
- **Credit_Operation**: An operation that increases the wallet balance
- **Debit_Operation**: An operation that decreases the wallet balance
- **Game_Service**: The bounded context responsible for managing crash game rounds and player bets
- **Message_Broker**: RabbitMQ instance used for asynchronous communication between services
- **JWT_Token**: JSON Web Token issued by Keycloak containing player authentication and identification
- **API_Gateway**: Kong gateway that routes requests and validates JWT tokens
- **Wallet_Repository**: Infrastructure component responsible for persisting wallet data to PostgreSQL
- **Bet_Placed_Event**: Message published by Game Service when a player places a bet
- **Cashout_Event**: Message published by Game Service when a player cashes out
- **Bet_Lost_Event**: Message published by Game Service when a player's bet is lost
- **Insufficient_Balance_Error**: Error condition when a debit operation would result in a negative balance
- **Concurrent_Operation**: Multiple operations attempting to modify the same wallet simultaneously

## Requirements

### Requirement 1: Wallet Creation

**User Story:** As a player, I want to create a wallet for my account, so that I can participate in crash games with real money.

#### Acceptance Criteria

1. WHEN an authenticated player sends a POST request to /wallets, THE Wallet_Service SHALL create a new Wallet with an initial Balance of zero centavos
2. WHEN an authenticated player sends a POST request to /wallets, THE Wallet_Service SHALL associate the Wallet with the player ID extracted from the JWT_Token
3. IF a player already has a Wallet, THEN THE Wallet_Service SHALL return an error indicating the wallet already exists
4. WHEN a Wallet is created, THE Wallet_Service SHALL persist the Wallet to the Wallet_Repository
5. WHEN a Wallet is successfully created, THE Wallet_Service SHALL return the Wallet ID and initial Balance to the player

### Requirement 2: Wallet Retrieval

**User Story:** As a player, I want to view my wallet and current balance, so that I know how much money I have available for betting.

#### Acceptance Criteria

1. WHEN an authenticated player sends a GET request to /wallets/me, THE Wallet_Service SHALL retrieve the Wallet associated with the player ID from the JWT_Token
2. WHEN a Wallet is retrieved, THE Wallet_Service SHALL return the Wallet ID and current Balance in centavos
3. IF a player does not have a Wallet, THEN THE Wallet_Service SHALL return an error indicating no wallet exists for the player

### Requirement 3: Monetary Precision

**User Story:** As a system administrator, I want all monetary values to be handled with exact precision, so that no rounding errors or financial discrepancies occur.

#### Acceptance Criteria

1. THE Wallet_Service SHALL store all Balance values as integers representing centavos
2. THE Wallet_Service SHALL perform all arithmetic operations using integer arithmetic
3. THE Wallet_Service SHALL reject any monetary value that cannot be represented as an integer number of centavos
4. WHEN converting between currency units, THE Wallet_Service SHALL use exact integer division and multiplication
5. THE Wallet_Repository SHALL store Balance values using BIGINT, NUMERIC, or equivalent exact precision database types

### Requirement 4: Credit Operations via Message Broker

**User Story:** As the Game Service, I want to credit player wallets when they win, so that their winnings are reflected in their balance.

#### Acceptance Criteria

1. WHEN a Cashout_Event is received from the Message_Broker, THE Wallet_Service SHALL extract the player ID and credit amount in centavos
2. WHEN a credit amount is extracted, THE Wallet_Service SHALL validate that the amount is a positive integer
3. WHEN a valid credit amount is received, THE Wallet_Service SHALL increase the Wallet Balance by the credit amount
4. WHEN a Credit_Operation is completed, THE Wallet_Service SHALL persist the updated Balance to the Wallet_Repository
5. IF a Cashout_Event references a non-existent Wallet, THEN THE Wallet_Service SHALL log an error and reject the message
6. WHEN a Cashout_Event is successfully processed, THE Wallet_Service SHALL acknowledge the message to the Message_Broker

### Requirement 5: Debit Operations via Message Broker

**User Story:** As the Game Service, I want to debit player wallets when they place bets, so that their balance reflects the wagered amount.

#### Acceptance Criteria

1. WHEN a Bet_Placed_Event is received from the Message_Broker, THE Wallet_Service SHALL extract the player ID and debit amount in centavos
2. WHEN a debit amount is extracted, THE Wallet_Service SHALL validate that the amount is a positive integer
3. WHEN a valid debit amount is received, THE Wallet_Service SHALL verify that the current Balance is greater than or equal to the debit amount
4. WHEN the Balance is sufficient, THE Wallet_Service SHALL decrease the Wallet Balance by the debit amount
5. WHEN a Debit_Operation is completed, THE Wallet_Service SHALL persist the updated Balance to the Wallet_Repository
6. IF the Balance is insufficient, THEN THE Wallet_Service SHALL reject the Debit_Operation and publish an Insufficient_Balance_Error event
7. IF a Bet_Placed_Event references a non-existent Wallet, THEN THE Wallet_Service SHALL log an error and reject the message
8. WHEN a Bet_Placed_Event is successfully processed, THE Wallet_Service SHALL acknowledge the message to the Message_Broker

### Requirement 6: Negative Balance Prevention

**User Story:** As a system administrator, I want to ensure wallet balances never go negative, so that players cannot spend money they do not have.

#### Acceptance Criteria

1. WHEN a Debit_Operation is requested, THE Wallet_Service SHALL verify the resulting Balance would be greater than or equal to zero centavos
2. IF a Debit_Operation would result in a negative Balance, THEN THE Wallet_Service SHALL reject the operation before modifying the Balance
3. WHEN a Debit_Operation is rejected, THE Wallet_Service SHALL return an Insufficient_Balance_Error
4. THE Wallet_Repository SHALL enforce a database constraint that Balance values cannot be negative

### Requirement 7: Concurrent Operation Safety

**User Story:** As a system administrator, I want concurrent wallet operations to be handled safely, so that race conditions do not corrupt wallet balances.

#### Acceptance Criteria

1. WHEN multiple Concurrent_Operations target the same Wallet, THE Wallet_Service SHALL serialize the operations to prevent race conditions
2. WHEN a Debit_Operation or Credit_Operation begins, THE Wallet_Service SHALL acquire a lock on the target Wallet
3. WHEN an operation completes, THE Wallet_Service SHALL release the lock on the Wallet
4. THE Wallet_Repository SHALL use database transactions to ensure atomic Balance updates
5. IF a Concurrent_Operation fails due to a conflict, THEN THE Wallet_Service SHALL retry the operation up to three times

### Requirement 8: Message Broker Integration

**User Story:** As the Wallet Service, I want to consume events from the Game Service reliably, so that all bet and cashout operations are processed.

#### Acceptance Criteria

1. WHEN the Wallet_Service starts, THE Wallet_Service SHALL connect to the Message_Broker using the configured connection parameters
2. THE Wallet_Service SHALL subscribe to the Bet_Placed_Event queue
3. THE Wallet_Service SHALL subscribe to the Cashout_Event queue
4. THE Wallet_Service SHALL subscribe to the Bet_Lost_Event queue
5. WHEN a message is received, THE Wallet_Service SHALL process the message and acknowledge it only after successful completion
6. IF message processing fails, THEN THE Wallet_Service SHALL reject the message and allow redelivery according to the Message_Broker retry policy
7. THE Wallet_Service SHALL handle at-least-once delivery semantics by ensuring operations are idempotent where possible

### Requirement 9: Authentication and Authorization

**User Story:** As a player, I want my wallet operations to be secure, so that only I can access my wallet information.

#### Acceptance Criteria

1. WHEN a request is received at /wallets or /wallets/me, THE Wallet_Service SHALL validate the JWT_Token in the Authorization header
2. WHEN a JWT_Token is validated, THE Wallet_Service SHALL extract the player ID from the token claims
3. IF a JWT_Token is missing or invalid, THEN THE Wallet_Service SHALL return an authentication error with HTTP status 401
4. WHEN accessing /wallets/me, THE Wallet_Service SHALL ensure the player can only retrieve their own Wallet
5. WHEN creating a Wallet, THE Wallet_Service SHALL associate the Wallet with the authenticated player ID from the JWT_Token

### Requirement 10: Bet Lost Event Handling

**User Story:** As the Game Service, I want to notify the Wallet Service when a bet is lost, so that the system maintains an accurate record of game outcomes.

#### Acceptance Criteria

1. WHEN a Bet_Lost_Event is received from the Message_Broker, THE Wallet_Service SHALL extract the player ID and bet amount
2. WHEN a Bet_Lost_Event is received, THE Wallet_Service SHALL log the event for audit purposes
3. WHEN a Bet_Lost_Event is successfully processed, THE Wallet_Service SHALL acknowledge the message to the Message_Broker
4. THE Wallet_Service SHALL perform no Balance modification for Bet_Lost_Events since the debit occurred when the bet was placed

### Requirement 11: Database Persistence

**User Story:** As a system administrator, I want wallet data to be persisted reliably, so that balances are not lost during service restarts.

#### Acceptance Criteria

1. THE Wallet_Service SHALL connect to the PostgreSQL wallets database using the configured connection parameters
2. THE Wallet_Repository SHALL store Wallet records with player ID, Wallet ID, Balance, and timestamps
3. WHEN a Wallet is created or modified, THE Wallet_Repository SHALL persist the changes within a database transaction
4. THE Wallet_Repository SHALL use an ORM (MikroORM, Prisma, or TypeORM) for database operations
5. THE Wallet_Repository SHALL define a schema with Balance stored as BIGINT or NUMERIC type

### Requirement 12: Health Check Endpoint

**User Story:** As a DevOps engineer, I want to monitor the health of the Wallet Service, so that I can detect and respond to service failures.

#### Acceptance Criteria

1. THE Wallet_Service SHALL expose a GET /health endpoint
2. WHEN the /health endpoint is accessed, THE Wallet_Service SHALL verify connectivity to the PostgreSQL database
3. WHEN the /health endpoint is accessed, THE Wallet_Service SHALL verify connectivity to the Message_Broker
4. WHEN all dependencies are healthy, THE Wallet_Service SHALL return HTTP status 200 with a success message
5. IF any dependency is unhealthy, THEN THE Wallet_Service SHALL return HTTP status 503 with details of the failing dependency

### Requirement 13: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN an error occurs during message processing, THE Wallet_Service SHALL log the error with the message ID, player ID, and error details
2. WHEN an error occurs during a REST request, THE Wallet_Service SHALL return a structured error response with an error code and message
3. THE Wallet_Service SHALL log all Credit_Operations and Debit_Operations with timestamps, player ID, amount, and resulting Balance
4. THE Wallet_Service SHALL log connection failures to the PostgreSQL database or Message_Broker
5. WHEN an Insufficient_Balance_Error occurs, THE Wallet_Service SHALL log the attempted debit amount and current Balance

### Requirement 14: Domain-Driven Design Architecture

**User Story:** As a developer, I want the codebase to follow DDD principles, so that the business logic is clearly separated from infrastructure concerns.

#### Acceptance Criteria

1. THE Wallet_Service SHALL organize code into domain, application, infrastructure, and presentation layers
2. THE domain layer SHALL contain the Wallet entity with credit and debit methods
3. THE application layer SHALL contain use cases for wallet creation, retrieval, and balance operations
4. THE infrastructure layer SHALL contain the Wallet_Repository, Message_Broker client, and database configuration
5. THE presentation layer SHALL contain REST controllers and DTOs for API endpoints

### Requirement 15: TypeScript Strict Mode

**User Story:** As a developer, I want the codebase to use TypeScript strict mode, so that type safety is enforced and runtime errors are minimized.

#### Acceptance Criteria

1. THE Wallet_Service SHALL enable TypeScript strict mode in tsconfig.json
2. THE Wallet_Service SHALL define explicit types for all function parameters and return values
3. THE Wallet_Service SHALL use strict null checks to prevent null and undefined errors
4. THE Wallet_Service SHALL define interfaces or types for all DTOs, entities, and domain objects
5. THE Wallet_Service SHALL use readonly modifiers for immutable properties where appropriate

### Requirement 16: Unit Testing for Domain Layer

**User Story:** As a developer, I want comprehensive unit tests for the domain layer, so that core business logic is verified to work correctly.

#### Acceptance Criteria

1. THE Wallet_Service SHALL include unit tests for the Wallet entity credit method
2. THE Wallet_Service SHALL include unit tests for the Wallet entity debit method
3. THE Wallet_Service SHALL include unit tests verifying that debit operations reject insufficient balances
4. THE Wallet_Service SHALL include unit tests verifying monetary precision with various centavo amounts
5. THE Wallet_Service SHALL include unit tests verifying that Balance never becomes negative
6. THE unit tests SHALL achieve at least 90% code coverage for the domain layer

### Requirement 17: End-to-End Testing for API Layer

**User Story:** As a developer, I want end-to-end tests for the REST API, so that I can verify the service works correctly in an integrated environment.

#### Acceptance Criteria

1. THE Wallet_Service SHALL include E2E tests for POST /wallets endpoint
2. THE Wallet_Service SHALL include E2E tests for GET /wallets/me endpoint
3. THE E2E tests SHALL verify authentication by testing with valid and invalid JWT_Tokens
4. THE E2E tests SHALL verify that a player cannot create multiple wallets
5. THE E2E tests SHALL verify that a player can only retrieve their own wallet
6. THE E2E tests SHALL use a test database separate from the development database
