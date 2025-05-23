import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AccruedInterest } from "../generated/schema"
import { AccruedInterest as AccruedInterestEvent } from "../generated/Silo/Silo"
import { handleAccruedInterest } from "../src/silo"
import { createAccruedInterestEvent } from "./silo-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let hooksBefore = BigInt.fromI32(234)
    let newAccruedInterestEvent = createAccruedInterestEvent(hooksBefore)
    handleAccruedInterest(newAccruedInterestEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccruedInterest created and stored", () => {
    assert.entityCount("AccruedInterest", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AccruedInterest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "hooksBefore",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
