import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
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
} from "../generated/Silo/Silo"

export function createAccruedInterestEvent(
  hooksBefore: BigInt
): AccruedInterest {
  let accruedInterestEvent = changetype<AccruedInterest>(newMockEvent())

  accruedInterestEvent.parameters = new Array()

  accruedInterestEvent.parameters.push(
    new ethereum.EventParam(
      "hooksBefore",
      ethereum.Value.fromUnsignedBigInt(hooksBefore)
    )
  )

  return accruedInterestEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createBorrowEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Borrow {
  let borrowEvent = changetype<Borrow>(newMockEvent())

  borrowEvent.parameters = new Array()

  borrowEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  borrowEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  borrowEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  borrowEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  borrowEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return borrowEvent
}

export function createCollateralTypeChangedEvent(
  borrower: Address
): CollateralTypeChanged {
  let collateralTypeChangedEvent =
    changetype<CollateralTypeChanged>(newMockEvent())

  collateralTypeChangedEvent.parameters = new Array()

  collateralTypeChangedEvent.parameters.push(
    new ethereum.EventParam("borrower", ethereum.Value.fromAddress(borrower))
  )

  return collateralTypeChangedEvent
}

export function createDepositEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return depositEvent
}

export function createDepositProtectedEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): DepositProtected {
  let depositProtectedEvent = changetype<DepositProtected>(newMockEvent())

  depositProtectedEvent.parameters = new Array()

  depositProtectedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  depositProtectedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  depositProtectedEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  depositProtectedEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return depositProtectedEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createFlashLoanEvent(amount: BigInt): FlashLoan {
  let flashLoanEvent = changetype<FlashLoan>(newMockEvent())

  flashLoanEvent.parameters = new Array()

  flashLoanEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return flashLoanEvent
}

export function createHooksUpdatedEvent(
  hooksBefore: i32,
  hooksAfter: i32
): HooksUpdated {
  let hooksUpdatedEvent = changetype<HooksUpdated>(newMockEvent())

  hooksUpdatedEvent.parameters = new Array()

  hooksUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "hooksBefore",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(hooksBefore))
    )
  )
  hooksUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "hooksAfter",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(hooksAfter))
    )
  )

  return hooksUpdatedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createNotificationSentEvent(
  notificationReceiver: Address,
  success: boolean
): NotificationSent {
  let notificationSentEvent = changetype<NotificationSent>(newMockEvent())

  notificationSentEvent.parameters = new Array()

  notificationSentEvent.parameters.push(
    new ethereum.EventParam(
      "notificationReceiver",
      ethereum.Value.fromAddress(notificationReceiver)
    )
  )
  notificationSentEvent.parameters.push(
    new ethereum.EventParam("success", ethereum.Value.fromBoolean(success))
  )

  return notificationSentEvent
}

export function createRepayEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Repay {
  let repayEvent = changetype<Repay>(newMockEvent())

  repayEvent.parameters = new Array()

  repayEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  repayEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  repayEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  repayEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return repayEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createWithdrawEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = new Array()

  withdrawEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return withdrawEvent
}

export function createWithdrawProtectedEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): WithdrawProtected {
  let withdrawProtectedEvent = changetype<WithdrawProtected>(newMockEvent())

  withdrawProtectedEvent.parameters = new Array()

  withdrawProtectedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  withdrawProtectedEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  withdrawProtectedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  withdrawProtectedEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  withdrawProtectedEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return withdrawProtectedEvent
}

export function createWithdrawnFeedEvent(
  daoFees: BigInt,
  deployerFees: BigInt
): WithdrawnFeed {
  let withdrawnFeedEvent = changetype<WithdrawnFeed>(newMockEvent())

  withdrawnFeedEvent.parameters = new Array()

  withdrawnFeedEvent.parameters.push(
    new ethereum.EventParam(
      "daoFees",
      ethereum.Value.fromUnsignedBigInt(daoFees)
    )
  )
  withdrawnFeedEvent.parameters.push(
    new ethereum.EventParam(
      "deployerFees",
      ethereum.Value.fromUnsignedBigInt(deployerFees)
    )
  )

  return withdrawnFeedEvent
}
