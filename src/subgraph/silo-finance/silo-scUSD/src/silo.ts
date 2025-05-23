import {
  AccruedInterest as AccruedInterestEvent,
  Approval as ApprovalEvent,
  Borrow as BorrowEvent,
  CollateralTypeChanged as CollateralTypeChangedEvent,
  Deposit as DepositEvent,
  DepositProtected as DepositProtectedEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  FlashLoan as FlashLoanEvent,
  HooksUpdated as HooksUpdatedEvent,
  Initialized as InitializedEvent,
  NotificationSent as NotificationSentEvent,
  Repay as RepayEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
  WithdrawProtected as WithdrawProtectedEvent,
  WithdrawnFeed as WithdrawnFeedEvent
} from "../generated/Silo/Silo"
import {
  AccruedInterest,
  Approval,
  Borrow,
  CollateralTypeChanged,
  Deposit,
  DepositProtected,
  EIP712DomainChanged,
  FlashLoan,
  HooksUpdated,
  Initialized,
  NotificationSent,
  Repay,
  Transfer,
  Withdraw,
  WithdrawProtected,
  WithdrawnFeed
} from "../generated/schema"

export function handleAccruedInterest(event: AccruedInterestEvent): void {
  let entity = new AccruedInterest(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hooksBefore = event.params.hooksBefore

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBorrow(event: BorrowEvent): void {
  let entity = new Borrow(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCollateralTypeChanged(
  event: CollateralTypeChangedEvent
): void {
  let entity = new CollateralTypeChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.borrower = event.params.borrower

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDepositProtected(event: DepositProtectedEvent): void {
  let entity = new DepositProtected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent
): void {
  let entity = new EIP712DomainChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFlashLoan(event: FlashLoanEvent): void {
  let entity = new FlashLoan(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHooksUpdated(event: HooksUpdatedEvent): void {
  let entity = new HooksUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hooksBefore = event.params.hooksBefore
  entity.hooksAfter = event.params.hooksAfter

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNotificationSent(event: NotificationSentEvent): void {
  let entity = new NotificationSent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.notificationReceiver = event.params.notificationReceiver
  entity.success = event.params.success

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRepay(event: RepayEvent): void {
  let entity = new Repay(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdrawProtected(event: WithdrawProtectedEvent): void {
  let entity = new WithdrawProtected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.owner = event.params.owner
  entity.assets = event.params.assets
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdrawnFeed(event: WithdrawnFeedEvent): void {
  let entity = new WithdrawnFeed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.daoFees = event.params.daoFees
  entity.deployerFees = event.params.deployerFees

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
